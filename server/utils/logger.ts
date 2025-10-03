/**
 * Centralized Logging System
 * Structured logging for security events and application logs
 */

import { securityConfig } from '../config/security';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface SecurityLogEntry extends LogEntry {
  eventType: string;
  riskScore?: number;
  isSuccessful?: boolean;
  failureReason?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'ERROR': return LogLevel.ERROR;
      case 'WARN': return LogLevel.WARN;
      case 'INFO': return LogLevel.INFO;
      case 'DEBUG': return LogLevel.DEBUG;
      default: return securityConfig.isDevelopment() ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    const sessionId = entry.sessionId ? `[Session:${entry.sessionId.substring(0, 8)}...]` : '';
    const ipAddress = entry.ipAddress ? `[IP:${entry.ipAddress}]` : '';
    
    let message = `${timestamp} ${level}${context}${userId}${sessionId}${ipAddress} ${entry.message}`;
    
    if (entry.error) {
      message += `\nError: ${entry.error.message}`;
      if (securityConfig.isDevelopment() && entry.error.stack) {
        message += `\nStack: ${entry.error.stack}`;
      }
    }
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      message += `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    return message;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatLogEntry(entry);
    
    // In production, you might want to send logs to external services
    // For now, we'll use console with appropriate methods
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  public error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      error,
      metadata,
    });
  }

  public warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      metadata,
    });
  }

  public info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      metadata,
    });
  }

  public debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      metadata,
    });
  }

  // Security-specific logging methods
  public security(entry: Omit<SecurityLogEntry, 'timestamp' | 'level'>): void {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      level: entry.isSuccessful === false ? LogLevel.WARN : LogLevel.INFO,
      context: 'SECURITY',
    };

    this.writeLog(logEntry);

    // In production, you might want to send security events to SIEM
    if (securityConfig.isProduction() && entry.riskScore && entry.riskScore >= 70) {
      this.alertHighRiskEvent(logEntry);
    }
  }

  private alertHighRiskEvent(entry: SecurityLogEntry): void {
    // In a real implementation, this would send alerts to security team
    console.error(`🚨 HIGH RISK SECURITY EVENT: ${entry.message}`, {
      eventType: entry.eventType,
      riskScore: entry.riskScore,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      timestamp: entry.timestamp,
    });
  }

  // Request logging for API calls
  public request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `${method} ${path} ${statusCode} ${duration}ms`;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: 'HTTP',
      userId,
      ipAddress,
      userAgent,
      requestId,
      metadata: {
        method,
        path,
        statusCode,
        duration,
      },
    });
  }

  // Database operation logging
  public database(operation: string, table: string, duration?: number, error?: Error): void {
    const level = error ? LogLevel.ERROR : LogLevel.DEBUG;
    const message = `DB ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: 'DATABASE',
      error,
      metadata: {
        operation,
        table,
        duration,
      },
    });
  }

  // Service operation logging
  public service(serviceName: string, operation: string, success: boolean, duration?: number, metadata?: Record<string, any>): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    const status = success ? 'SUCCESS' : 'FAILED';
    const message = `${serviceName}.${operation} ${status}${duration ? ` (${duration}ms)` : ''}`;
    
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      message,
      context: 'SERVICE',
      metadata: {
        serviceName,
        operation,
        success,
        duration,
        ...metadata,
      },
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export utility functions
export function createRequestLogger(requestId: string) {
  return {
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, 'REQUEST', { ...metadata, requestId }),
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, 'REQUEST', { ...metadata, requestId }),
    error: (message: string, error?: Error, metadata?: Record<string, any>) => 
      logger.error(message, 'REQUEST', { ...metadata, requestId }, error),
  };
}

export function createServiceLogger(serviceName: string) {
  return {
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, serviceName.toUpperCase(), metadata),
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, serviceName.toUpperCase(), metadata),
    error: (message: string, error?: Error, metadata?: Record<string, any>) => 
      logger.error(message, serviceName.toUpperCase(), metadata, error),
    debug: (message: string, metadata?: Record<string, any>) => 
      logger.debug(message, serviceName.toUpperCase(), metadata),
    operation: (operation: string, success: boolean, duration?: number, metadata?: Record<string, any>) =>
      logger.service(serviceName, operation, success, duration, metadata),
  };
}
