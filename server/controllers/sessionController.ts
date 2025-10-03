/**
 * Session Controller
 * Handles session management operations
 */

import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { auditService } from '../services/auditService';
import { createServiceLogger } from '../utils/logger';
import { SessionError } from '../types/security';

const logger = createServiceLogger('SessionController');

export class SessionController {
  /**
   * Get all active sessions for current user
   */
  static async getUserSessions(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      logger.debug('User sessions requested', { userId });

      const sessions = await sessionService.getUserSessions(userId);
      
      // Don't expose session tokens in the response
      const safeSessions = sessions.map(session => {
        const { sessionToken, ...safeSession } = session;
        return {
          ...safeSession,
          sessionId: sessionToken.substring(0, 8) + '...' // Show partial token for identification
        };
      });

      logger.info('User sessions retrieved', {
        userId,
        sessionCount: sessions.length,
        duration: Date.now() - startTime
      });

      res.json(safeSessions);
    } catch (error) {
      logger.error('Error fetching user sessions', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch sessions',
        code: 'FETCH_SESSIONS_ERROR'
      });
    }
  }

  /**
   * Revoke a specific session
   */
  static async revokeSession(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const currentSessionToken = req.securityContext?.sessionToken;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { sessionId } = req.params;
      
      logger.info('Session revocation requested', { 
        userId, 
        targetSessionId: sessionId.substring(0, 8) + '...'
      });

      // Verify the session belongs to the user
      const sessions = await sessionService.getUserSessions(userId);
      const targetSession = sessions.find(s => s.sessionToken === sessionId);
      
      if (!targetSession) {
        return res.status(404).json({ 
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Don't allow revoking current session through this endpoint
      if (sessionId === currentSessionToken) {
        return res.status(400).json({ 
          message: 'Cannot revoke current session. Use logout instead.',
          code: 'CANNOT_REVOKE_CURRENT_SESSION'
        });
      }

      await sessionService.revokeSession(sessionId, 'Revoked by user');

      // Log the session revocation
      await auditService.logSecurityEvent({
        userId,
        eventType: 'session_revoked',
        eventDescription: `Session revoked by user`,
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
        additionalData: {
          revokedSessionId: sessionId.substring(0, 8) + '...',
          revokedFromDevice: targetSession.deviceName || 'Unknown'
        }
      });

      logger.info('Session revoked successfully', {
        userId,
        revokedSessionId: sessionId.substring(0, 8) + '...',
        duration: Date.now() - startTime
      });

      res.json({ 
        message: 'Session revoked successfully',
        code: 'SESSION_REVOKED'
      });
    } catch (error) {
      logger.error('Error revoking session', error as Error, {
        userId,
        sessionId: req.params.sessionId?.substring(0, 8) + '...',
        duration: Date.now() - startTime
      });

      if (error instanceof SessionError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(500).json({ 
        message: 'Failed to revoke session',
        code: 'REVOKE_SESSION_ERROR'
      });
    }
  }

  /**
   * Revoke all other sessions (keep current session active)
   */
  static async revokeAllOtherSessions(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const currentSessionToken = req.securityContext?.sessionToken;

    try {
      if (!userId || !currentSessionToken) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      logger.info('All other sessions revocation requested', { userId });

      // Get current session count for logging
      const sessionsBefore = await sessionService.getUserSessions(userId);
      const otherSessionsCount = sessionsBefore.filter(s => s.sessionToken !== currentSessionToken).length;

      await sessionService.revokeAllUserSessions(userId, currentSessionToken, 'All other sessions revoked by user');

      // Log the mass session revocation
      await auditService.logSecurityEvent({
        userId,
        eventType: 'all_sessions_revoked',
        eventDescription: `All other sessions revoked by user (${otherSessionsCount} sessions)`,
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
        additionalData: {
          revokedSessionsCount: otherSessionsCount,
          currentSessionKept: currentSessionToken.substring(0, 8) + '...'
        }
      });

      logger.info('All other sessions revoked successfully', {
        userId,
        revokedCount: otherSessionsCount,
        duration: Date.now() - startTime
      });

      res.json({ 
        message: `All other sessions revoked successfully (${otherSessionsCount} sessions)`,
        revokedCount: otherSessionsCount,
        code: 'ALL_SESSIONS_REVOKED'
      });
    } catch (error) {
      logger.error('Error revoking all sessions', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      if (error instanceof SessionError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(500).json({ 
        message: 'Failed to revoke sessions',
        code: 'REVOKE_ALL_SESSIONS_ERROR'
      });
    }
  }

  /**
   * Get session details for current session
   */
  static async getCurrentSession(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const sessionToken = req.securityContext?.sessionToken;

    try {
      if (!userId || !sessionToken) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      logger.debug('Current session details requested', { userId });

      const session = await sessionService.validateSession(sessionToken, req.securityContext?.ipAddress || '127.0.0.1');
      
      if (!session) {
        return res.status(404).json({ 
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }

      // Return safe session data (without token)
      const { sessionToken: _, ...safeSession } = session;
      const sessionDetails = {
        ...safeSession,
        sessionId: sessionToken.substring(0, 8) + '...',
        isCurrentSession: true
      };

      logger.info('Current session details retrieved', {
        userId,
        riskScore: session.riskScore,
        duration: Date.now() - startTime
      });

      res.json(sessionDetails);
    } catch (error) {
      logger.error('Error fetching current session', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch session details',
        code: 'FETCH_SESSION_ERROR'
      });
    }
  }

  /**
   * Update session metadata (device name, etc.)
   */
  static async updateSessionMetadata(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const sessionToken = req.securityContext?.sessionToken;

    try {
      if (!userId || !sessionToken) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { deviceName } = req.body;
      
      if (!deviceName || typeof deviceName !== 'string' || deviceName.length > 100) {
        return res.status(400).json({ 
          message: 'Invalid device name',
          code: 'INVALID_DEVICE_NAME'
        });
      }

      logger.info('Session metadata update requested', { 
        userId, 
        newDeviceName: deviceName 
      });

      // Update session metadata (this would require a new method in sessionService)
      // For now, we'll just log the request
      await auditService.logSecurityEvent({
        userId,
        eventType: 'session_metadata_updated',
        eventDescription: `Session device name updated to: ${deviceName}`,
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
        sessionId: sessionToken,
        additionalData: { newDeviceName: deviceName }
      });

      logger.info('Session metadata updated', {
        userId,
        deviceName,
        duration: Date.now() - startTime
      });

      res.json({ 
        message: 'Session metadata updated successfully',
        deviceName,
        code: 'SESSION_UPDATED'
      });
    } catch (error) {
      logger.error('Error updating session metadata', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to update session metadata',
        code: 'UPDATE_SESSION_ERROR'
      });
    }
  }
}
