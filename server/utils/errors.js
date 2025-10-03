/**
 * Classes d'erreur JavaScript natives pour AI Act Navigator
 * Solution simple et robuste pour éviter les problèmes d'import TypeScript
 */

class SecurityError extends Error {
  constructor(message, code = 'SECURITY_ERROR', statusCode = 500) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode;
    
    // Assurer la compatibilité avec les navigateurs plus anciens
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityError);
    }
  }
}

class AuthenticationError extends SecurityError {
  constructor(message, code = 'AUTH_FAILED') {
    super(message, code, 401);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends SecurityError {
  constructor(message, errors = []) {
    super(message, 'VALIDATION_FAILED', 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class MFAError extends SecurityError {
  constructor(message, code = 'MFA_FAILED') {
    super(message, code, 400);
    this.name = 'MFAError';
  }
}

class SessionError extends SecurityError {
  constructor(message, code = 'SESSION_FAILED') {
    super(message, code, 401);
    this.name = 'SessionError';
  }
}

// Export des classes
module.exports = {
  SecurityError,
  AuthenticationError,
  ValidationError,
  MFAError,
  SessionError
};
