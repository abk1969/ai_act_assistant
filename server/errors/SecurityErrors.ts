/**
 * Security Error Classes - Standalone Module
 * Définit toutes les classes d'erreur de sécurité
 */

export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'SecurityError';
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string, code: string = 'AUTH_FAILED') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string, public errors: string[] = []) {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class MFAError extends SecurityError {
  constructor(message: string, code: string = 'MFA_FAILED') {
    super(message, code, 400);
    this.name = 'MFAError';
    Object.setPrototypeOf(this, MFAError.prototype);
  }
}

export class SessionError extends SecurityError {
  constructor(message: string, code: string = 'SESSION_FAILED') {
    super(message, code, 401);
    this.name = 'SessionError';
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}
