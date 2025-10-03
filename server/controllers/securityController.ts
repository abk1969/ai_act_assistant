/**
 * Security Controller
 * Handles security settings, audit, and administrative operations
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { securityService } from '../services/securityService';
import { auditService } from '../services/auditService';
import { createServiceLogger } from '../utils/logger';
import { updateSecuritySettingsSchema } from '@shared/schema';
import { SecurityError, ValidationError } from '../types/security';

const logger = createServiceLogger('SecurityController');

export class SecurityController {
  /**
   * Get security settings (Admin only)
   */
  static async getSecuritySettings(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      logger.info('Security settings requested', { userId });

      const settings = await securityService.getSecuritySettings();
      if (!settings) {
        return res.status(404).json({ 
          message: 'Security settings not found',
          code: 'SETTINGS_NOT_FOUND'
        });
      }

      // Don't expose sensitive settings like encryption keys
      const { encryptionAlgorithm, ...safeSettings } = settings;
      
      logger.info('Security settings retrieved', {
        userId,
        duration: Date.now() - startTime
      });

      res.json(safeSettings);
    } catch (error) {
      logger.error('Error fetching security settings', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch security settings',
        code: 'FETCH_SETTINGS_ERROR'
      });
    }
  }

  /**
   * Update security settings (Admin only)
   */
  static async updateSecuritySettings(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;
    const userEmail = (req.user as any)?.email;

    try {
      const updates = updateSecuritySettingsSchema.parse(req.body);
      
      logger.info('Security settings update requested', {
        userId,
        userEmail,
        updatedFields: Object.keys(updates)
      });

      const updatedSettings = await securityService.updateSecuritySettings(updates);

      // Log the security settings change
      await auditService.logSecurityEvent({
        userId,
        eventType: 'security_settings_updated',
        eventDescription: `Security settings updated by admin ${userEmail}`,
        ipAddress: req.securityContext?.ipAddress,
        userAgent: req.securityContext?.userAgent,
        isSuccessful: true,
        additionalData: { 
          updatedFields: Object.keys(updates),
          adminEmail: userEmail
        }
      });

      const { encryptionAlgorithm, ...safeSettings } = updatedSettings;
      
      logger.info('Security settings updated successfully', {
        userId,
        userEmail,
        updatedFields: Object.keys(updates),
        duration: Date.now() - startTime
      });

      res.json(safeSettings);
    } catch (error) {
      logger.error('Error updating security settings', error as Error, {
        userId,
        userEmail,
        duration: Date.now() - startTime
      });

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid settings data', 
          errors: error.errors,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof SecurityError) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }

      res.status(500).json({ 
        message: 'Failed to update security settings',
        code: 'UPDATE_SETTINGS_ERROR'
      });
    }
  }

  /**
   * Get security events for current user
   */
  static async getSecurityEvents(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      if (!userId) {
        return res.status(401).json({ 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const { limit = 50, offset = 0, eventType } = req.query;
      
      logger.debug('Security events requested', {
        userId,
        limit,
        offset,
        eventType
      });

      const events = await auditService.getUserSecurityEvents(userId, {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        eventType: eventType as string,
      });

      logger.info('Security events retrieved', {
        userId,
        eventCount: events.length,
        duration: Date.now() - startTime
      });

      res.json(events);
    } catch (error) {
      logger.error('Error fetching security events', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch security events',
        code: 'FETCH_EVENTS_ERROR'
      });
    }
  }

  /**
   * Get security dashboard (Admin only)
   */
  static async getSecurityDashboard(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      const { timeframe = '24h' } = req.query;
      
      logger.info('Security dashboard requested', {
        userId,
        timeframe
      });

      const dashboard = await auditService.getSecurityDashboard(timeframe as '24h' | '7d' | '30d');
      
      logger.info('Security dashboard retrieved', {
        userId,
        timeframe,
        totalEvents: dashboard.totalEvents,
        duration: Date.now() - startTime
      });

      res.json(dashboard);
    } catch (error) {
      logger.error('Error fetching security dashboard', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch security dashboard',
        code: 'FETCH_DASHBOARD_ERROR'
      });
    }
  }

  /**
   * Export security events (Admin only)
   */
  static async exportSecurityEvents(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      const { since, until, eventType, format = 'csv' } = req.query;
      
      logger.info('Security events export requested', {
        userId,
        since,
        until,
        eventType,
        format
      });

      const exportData = await auditService.exportSecurityEvents({
        since: since ? new Date(since as string) : undefined,
        until: until ? new Date(until as string) : undefined,
        eventType: eventType as string,
      });

      // Set appropriate headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `security-events-${timestamp}.${format}`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      logger.info('Security events exported', {
        userId,
        filename,
        duration: Date.now() - startTime
      });

      res.send(exportData);
    } catch (error) {
      logger.error('Error exporting security events', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to export security events',
        code: 'EXPORT_EVENTS_ERROR'
      });
    }
  }

  /**
   * Get system security status
   */
  static async getSecurityStatus(req: Request, res: Response) {
    const startTime = Date.now();
    const userId = req.securityContext?.userId;

    try {
      logger.debug('Security status requested', { userId });

      // Get basic security metrics
      const dashboard = await auditService.getSecurityDashboard('24h');
      const settings = await securityService.getSecuritySettings();

      const status = {
        mfaEnabled: settings?.mfaRequired || false,
        auditingEnabled: settings?.enableAuditLogging || false,
        encryptionEnabled: settings?.encryptionEnabled || false,
        recentEvents: dashboard.totalEvents,
        riskLevel: dashboard.riskDistribution.high > 10 ? 'HIGH' : 
                  dashboard.riskDistribution.medium > 20 ? 'MEDIUM' : 'LOW',
        lastUpdated: new Date().toISOString()
      };

      logger.info('Security status retrieved', {
        userId,
        riskLevel: status.riskLevel,
        duration: Date.now() - startTime
      });

      res.json(status);
    } catch (error) {
      logger.error('Error fetching security status', error as Error, {
        userId,
        duration: Date.now() - startTime
      });

      res.status(500).json({ 
        message: 'Failed to fetch security status',
        code: 'FETCH_STATUS_ERROR'
      });
    }
  }
}
