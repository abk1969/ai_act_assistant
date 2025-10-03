import crypto from 'crypto';
import { storage } from '../storage';
import { auditService } from './auditService';
import type { 
  InsertUserSession, 
  UserSession,
  SecuritySettings 
} from '@shared/schema';

/**
 * SessionService - Handles advanced session management and security
 */
export class SessionService {
  /**
   * Create a new user session
   * @param userId - User ID
   * @param sessionData - Session creation data
   * @returns Session token
   */
  static async createSession(userId: string, sessionData: {
    ipAddress: string;
    userAgent?: string;
    deviceName?: string;
    location?: any;
  }): Promise<string> {
    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Parse user agent for device info
    const deviceInfo = this.parseUserAgent(sessionData.userAgent || '');
    
    // Get security settings for session timeout
    const securitySettings = await storage.getSecuritySettings();
    const timeoutMinutes = securitySettings?.sessionTimeoutMinutes || 480; // 8 hours default
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + timeoutMinutes);

    // Calculate risk score for this session
    const riskScore = await this.calculateSessionRisk(userId, sessionData);

    const session: InsertUserSession = {
      userId,
      sessionToken,
      status: 'active',
      deviceName: sessionData.deviceName || deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      ipAddress: sessionData.ipAddress,
      location: sessionData.location,
      isTrusted: riskScore < 30, // Low risk sessions are trusted
      riskScore,
      lastActivityAt: new Date(),
      expiresAt,
    };

    await storage.createUserSession(session);

    // Check session limits
    await this.enforceSessionLimits(userId);

    // Log session creation
    await auditService.logSecurityEvent({
      userId,
      eventType: 'login_success',
      eventDescription: `New session created from ${sessionData.ipAddress}`,
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent,
      location: sessionData.location,
      isSuccessful: true,
      sessionId: sessionToken,
    });

    return sessionToken;
  }

  /**
   * Validate and refresh session
   * @param sessionToken - Session token
   * @param ipAddress - Current IP address
   * @returns Session data or null if invalid
   */
  static async validateSession(sessionToken: string, ipAddress: string): Promise<UserSession | null> {
    try {
      const session = await storage.getUserSessionByToken(sessionToken);
      
      if (!session) {
        return null;
      }

      // Check if session is expired
      if (session.status !== 'active' || new Date() > session.expiresAt) {
        await this.revokeSession(sessionToken, 'Session expired');
        return null;
      }

      // Check IP address consistency (optional security measure)
      if (session.ipAddress !== ipAddress) {
        // Log suspicious activity but don't automatically revoke
        // (users might have dynamic IPs)
        await auditService.logSecurityEvent({
          userId: session.userId,
          eventType: 'suspicious_activity',
          eventDescription: `IP address changed during session: ${session.ipAddress} -> ${ipAddress}`,
          ipAddress,
          sessionId: sessionToken,
          isSuccessful: false,
        });
      }

      // Update last activity
      await storage.updateUserSessionActivity(sessionToken);

      return session;
    } catch (error) {
      console.error('Session validation error:', error);
      return null;
    }
  }

  /**
   * Revoke a session
   * @param sessionToken - Session token
   * @param reason - Revocation reason
   */
  static async revokeSession(sessionToken: string, reason: string = 'Manual revocation'): Promise<void> {
    try {
      const session = await storage.getUserSessionByToken(sessionToken);
      
      if (session) {
        await storage.revokeUserSession(sessionToken);
        
        await auditService.logSecurityEvent({
          userId: session.userId,
          eventType: 'logout',
          eventDescription: `Session revoked: ${reason}`,
          ipAddress: session.ipAddress,
          sessionId: sessionToken,
          isSuccessful: true,
        });
      }
    } catch (error) {
      console.error('Session revocation error:', error);
    }
  }

  /**
   * Revoke all sessions for a user
   * @param userId - User ID
   * @param excludeSessionToken - Session token to exclude (current session)
   * @param reason - Revocation reason
   */
  static async revokeAllUserSessions(
    userId: string, 
    excludeSessionToken?: string,
    reason: string = 'All sessions revoked'
  ): Promise<void> {
    try {
      const sessions = await storage.getUserSessions(userId, { status: 'active' });
      
      for (const session of sessions) {
        if (session.sessionToken !== excludeSessionToken) {
          await this.revokeSession(session.sessionToken, reason);
        }
      }
    } catch (error) {
      console.error('Error revoking all user sessions:', error);
    }
  }

  /**
   * Get active sessions for a user
   * @param userId - User ID
   * @returns Array of active sessions
   */
  static async getUserSessions(userId: string): Promise<UserSession[]> {
    return storage.getUserSessions(userId, { status: 'active' });
  }

  /**
   * Enforce session limits per user
   * @param userId - User ID
   */
  private static async enforceSessionLimits(userId: string): Promise<void> {
    try {
      const securitySettings = await storage.getSecuritySettings();
      const maxSessions = securitySettings?.maxConcurrentSessions || 3;
      
      const activeSessions = await storage.getUserSessions(userId, { status: 'active' });
      
      if (activeSessions.length > maxSessions) {
        // Revoke oldest sessions
        const sessionsToRevoke = activeSessions
          .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
          .slice(0, activeSessions.length - maxSessions);
        
        for (const session of sessionsToRevoke) {
          await this.revokeSession(session.sessionToken, 'Session limit exceeded');
        }
      }
    } catch (error) {
      console.error('Error enforcing session limits:', error);
    }
  }

  /**
   * Calculate risk score for a new session
   * @param userId - User ID
   * @param sessionData - Session data
   * @returns Risk score (0-100)
   */
  private static async calculateSessionRisk(userId: string, sessionData: {
    ipAddress: string;
    userAgent?: string;
    location?: any;
  }): Promise<number> {
    let riskScore = 0;

    try {
      // Check for previous sessions from this IP
      const recentSessions = await storage.getUserSessionsByIp(userId, sessionData.ipAddress, {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      });

      if (recentSessions.length === 0) {
        riskScore += 20; // New IP address
      }

      // Check for unusual location
      if (sessionData.location) {
        const userSessions = await storage.getUserSessions(userId, { 
          status: 'active',
          limit: 10 
        });
        
        const commonCountries = new Set(
          userSessions
            .map(s => s.location as any)
            .filter(Boolean)
            .map(loc => loc.country)
        );

        const currentCountry = (sessionData.location as any)?.country;
        if (currentCountry && !commonCountries.has(currentCountry)) {
          riskScore += 30; // Unusual country
        }
      }

      // Check time of day
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        riskScore += 10; // Unusual hours
      }

      // Check for recent failed login attempts
      const recentFailures = await storage.getUserSecurityEvents(userId, {
        eventType: 'login_failed',
        since: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      });

      if (recentFailures.length > 0) {
        riskScore += Math.min(30, recentFailures.length * 5);
      }

    } catch (error) {
      console.error('Error calculating session risk:', error);
      riskScore = 50; // Default medium risk on error
    }

    return Math.min(100, Math.max(0, riskScore));
  }

  /**
   * Parse user agent string for device information
   * @param userAgent - User agent string
   * @returns Parsed device information
   */
  private static parseUserAgent(userAgent: string): {
    deviceName: string;
    deviceType: string;
    browserName: string;
    browserVersion: string;
    osName: string;
    osVersion: string;
  } {
    // Simple user agent parsing (in production, use a proper library like ua-parser-js)
    const ua = userAgent.toLowerCase();
    
    let deviceType = 'desktop';
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      deviceType = 'tablet';
    }

    let browserName = 'unknown';
    let browserVersion = '';
    if (ua.includes('chrome')) {
      browserName = 'Chrome';
      const match = ua.match(/chrome\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('firefox')) {
      browserName = 'Firefox';
      const match = ua.match(/firefox\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('safari')) {
      browserName = 'Safari';
      const match = ua.match(/version\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    } else if (ua.includes('edge')) {
      browserName = 'Edge';
      const match = ua.match(/edge\/([0-9.]+)/);
      browserVersion = match ? match[1] : '';
    }

    let osName = 'unknown';
    let osVersion = '';
    if (ua.includes('windows')) {
      osName = 'Windows';
      if (ua.includes('windows nt 10')) osVersion = '10';
      else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
      else if (ua.includes('windows nt 6.2')) osVersion = '8';
    } else if (ua.includes('mac os')) {
      osName = 'macOS';
      const match = ua.match(/mac os x ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    } else if (ua.includes('linux')) {
      osName = 'Linux';
    } else if (ua.includes('android')) {
      osName = 'Android';
      const match = ua.match(/android ([0-9.]+)/);
      osVersion = match ? match[1] : '';
    } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      osName = 'iOS';
      const match = ua.match(/os ([0-9_]+)/);
      osVersion = match ? match[1].replace(/_/g, '.') : '';
    }

    const deviceName = `${osName} ${osVersion} - ${browserName}`.trim();

    return {
      deviceName,
      deviceType,
      browserName,
      browserVersion,
      osName,
      osVersion,
    };
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await storage.deleteExpiredSessions();
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

// Export singleton instance
export const sessionService = {
  createSession: SessionService.createSession.bind(SessionService),
  validateSession: SessionService.validateSession.bind(SessionService),
  revokeSession: SessionService.revokeSession.bind(SessionService),
  getUserSessions: SessionService.getUserSessions.bind(SessionService),
  revokeAllUserSessions: SessionService.revokeAllUserSessions.bind(SessionService),
  cleanupExpiredSessions: SessionService.cleanupExpiredSessions.bind(SessionService),
};
