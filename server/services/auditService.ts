import { storage } from '../storage';
import type { 
  InsertUserSecurityEvent, 
  UserSecurityEvent,
  SecuritySettings 
} from '@shared/schema';

/**
 * AuditService - Handles security event logging and audit trail
 */
export class AuditService {
  /**
   * Log a security event
   * @param event - Security event data
   */
  static async logSecurityEvent(event: Omit<InsertUserSecurityEvent, 'createdAt'>): Promise<void> {
    try {
      // Check if audit logging is enabled
      const securitySettings = await storage.getSecuritySettings();
      if (securitySettings && !securitySettings.enableAuditLogging) {
        return; // Audit logging disabled
      }

      // Calculate risk score based on event type and context
      const riskScore = this.calculateRiskScore(event);

      const auditEvent: InsertUserSecurityEvent = {
        ...event,
        riskScore,
      };

      await storage.createUserSecurityEvent(auditEvent);

      // Check for suspicious activity patterns
      if (riskScore >= 70 && event.ipAddress) {
        await this.checkSuspiciousActivity(event.userId, event.ipAddress);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Calculate risk score for a security event
   * @param event - Security event
   * @returns Risk score (0-100)
   */
  private static calculateRiskScore(event: Omit<InsertUserSecurityEvent, 'createdAt'>): number {
    let score = 0;

    // Base scores by event type
    const eventTypeScores: Record<string, number> = {
      'login_success': 10,
      'login_failed': 30,
      'logout': 5,
      'password_changed': 20,
      'mfa_enabled': 15,
      'mfa_disabled': 40,
      'mfa_verified': 10,
      'password_reset_requested': 25,
      'password_reset_completed': 30,
      'account_locked': 60,
      'account_unlocked': 40,
      'suspicious_activity': 80,
    };

    score += eventTypeScores[event.eventType] || 20;

    // Increase score for failed events
    if (!event.isSuccessful) {
      score += 20;
    }

    // Location-based risk (if available)
    if (event.location) {
      const location = event.location as any;
      // Add risk for unusual countries/regions
      if (location.country && !['FR', 'US', 'CA', 'GB', 'DE'].includes(location.country)) {
        score += 15;
      }
    }

    // Time-based risk (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      score += 10; // Activity during unusual hours
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Check for suspicious activity patterns
   * @param userId - User ID (can be null)
   * @param ipAddress - IP address (can be null)
   */
  private static async checkSuspiciousActivity(userId?: string | null, ipAddress?: string | null): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for multiple failed logins
      if (userId) {
        const recentFailures = await storage.getUserSecurityEvents(userId, {
          eventType: 'login_failed',
          since: oneHourAgo,
          limit: 10,
        });

        if (recentFailures.length >= 5) {
          await this.logSecurityEvent({
            userId,
            eventType: 'suspicious_activity',
            eventDescription: `Multiple failed login attempts detected (${recentFailures.length} in last hour)`,
            ipAddress,
            isSuccessful: false,
            riskScore: 90,
          });
        }
      }

      // Check for multiple attempts from same IP
      if (ipAddress) {
        const recentIpEvents = await storage.getSecurityEventsByIp(ipAddress, {
          since: oneHourAgo,
          limit: 20,
        });

        const failedEvents = recentIpEvents.filter(e => !e.isSuccessful);
        if (failedEvents.length >= 10) {
          await this.logSecurityEvent({
            userId,
            eventType: 'suspicious_activity',
            eventDescription: `Multiple failed attempts from IP ${ipAddress} (${failedEvents.length} in last hour)`,
            ipAddress,
            isSuccessful: false,
            riskScore: 85,
          });
        }
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }

  /**
   * Get security events for a user
   * @param userId - User ID
   * @param options - Query options
   * @returns Array of security events
   */
  static async getUserSecurityEvents(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      eventType?: string;
      since?: Date;
      until?: Date;
    } = {}
  ): Promise<UserSecurityEvent[]> {
    return storage.getUserSecurityEvents(userId, options);
  }

  /**
   * Get security events by IP address
   * @param ipAddress - IP address
   * @param options - Query options
   * @returns Array of security events
   */
  static async getSecurityEventsByIp(
    ipAddress: string,
    options: {
      limit?: number;
      offset?: number;
      since?: Date;
      until?: Date;
    } = {}
  ): Promise<UserSecurityEvent[]> {
    return storage.getSecurityEventsByIp(ipAddress, options);
  }

  /**
   * Get security dashboard data
   * @param timeframe - Timeframe for data ('24h', '7d', '30d')
   * @returns Dashboard statistics
   */
  static async getSecurityDashboard(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    totalEvents: number;
    failedLogins: number;
    suspiciousActivity: number;
    uniqueUsers: number;
    uniqueIps: number;
    riskDistribution: { low: number; medium: number; high: number };
    eventsByType: Record<string, number>;
    topRiskyIps: Array<{ ip: string; events: number; riskScore: number }>;
  }> {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const events = await storage.getSecurityEventsSince(since);

    const stats = {
      totalEvents: events.length,
      failedLogins: events.filter(e => e.eventType === 'login_failed').length,
      suspiciousActivity: events.filter(e => e.eventType === 'suspicious_activity').length,
      uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
      uniqueIps: new Set(events.map(e => e.ipAddress).filter(Boolean)).size,
      riskDistribution: {
        low: events.filter(e => (e.riskScore || 0) < 30).length,
        medium: events.filter(e => (e.riskScore || 0) >= 30 && (e.riskScore || 0) < 70).length,
        high: events.filter(e => (e.riskScore || 0) >= 70).length,
      },
      eventsByType: {} as Record<string, number>,
      topRiskyIps: [] as Array<{ ip: string; events: number; riskScore: number }>,
    };

    // Count events by type
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
    });

    // Calculate top risky IPs
    const ipStats = new Map<string, { events: number; totalRisk: number }>();
    events.forEach(event => {
      if (event.ipAddress) {
        const current = ipStats.get(event.ipAddress) || { events: 0, totalRisk: 0 };
        current.events++;
        current.totalRisk += event.riskScore || 0;
        ipStats.set(event.ipAddress, current);
      }
    });

    stats.topRiskyIps = Array.from(ipStats.entries())
      .map(([ip, data]) => ({
        ip,
        events: data.events,
        riskScore: Math.round(data.totalRisk / data.events),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10);

    return stats;
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  static async cleanupOldLogs(): Promise<void> {
    try {
      const securitySettings = await storage.getSecuritySettings();
      if (!securitySettings?.auditLogRetentionDays) {
        return; // No retention policy
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - securitySettings.auditLogRetentionDays);

      await storage.deleteSecurityEventsOlderThan(cutoffDate);
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
    }
  }

  /**
   * Export security events for external analysis
   * @param options - Export options
   * @returns CSV data
   */
  static async exportSecurityEvents(options: {
    since?: Date;
    until?: Date;
    userId?: string;
    eventType?: string;
  } = {}): Promise<string> {
    const events = await storage.getSecurityEventsForExport(options);
    
    // Convert to CSV
    const headers = [
      'Timestamp',
      'User ID',
      'Event Type',
      'Description',
      'IP Address',
      'User Agent',
      'Success',
      'Risk Score',
      'Location'
    ];

    const csvRows = [headers.join(',')];
    
    events.forEach(event => {
      const row = [
        event.createdAt ? event.createdAt.toISOString() : '',
        event.userId || '',
        event.eventType,
        `"${(event.eventDescription || '').replace(/"/g, '""')}"`,
        event.ipAddress || '',
        `"${(event.userAgent || '').replace(/"/g, '""')}"`,
        event.isSuccessful ? 'true' : 'false',
        event.riskScore?.toString() || '0',
        event.location ? `"${JSON.stringify(event.location).replace(/"/g, '""')}"` : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

// Export singleton instance
export const auditService = {
  logSecurityEvent: AuditService.logSecurityEvent.bind(AuditService),
  getUserSecurityEvents: AuditService.getUserSecurityEvents.bind(AuditService),
  getSecurityDashboard: AuditService.getSecurityDashboard.bind(AuditService),
  exportSecurityEvents: AuditService.exportSecurityEvents.bind(AuditService),
};
