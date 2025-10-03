-- Créer les tables manquantes pour AI Act Navigator

-- Table security_settings
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    mfa_required BOOLEAN DEFAULT false,
    mfa_grace_period_days INTEGER DEFAULT 7,
    password_min_length INTEGER DEFAULT 12,
    password_max_length INTEGER DEFAULT 128,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_special_chars BOOLEAN DEFAULT true,
    password_expiration_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 5,
    max_login_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    session_timeout_minutes INTEGER DEFAULT 60,
    max_concurrent_sessions INTEGER DEFAULT 3,
    enable_captcha BOOLEAN DEFAULT true,
    captcha_after_attempts INTEGER DEFAULT 3,
    enable_audit_logging BOOLEAN DEFAULT true,
    audit_log_retention_days INTEGER DEFAULT 365,
    encryption_enabled BOOLEAN DEFAULT true,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    enable_security_alerts BOOLEAN DEFAULT true,
    alert_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table failed_login_attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    user_id VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    attempted_password VARCHAR(255),
    failure_reason VARCHAR(255) NOT NULL,
    is_blocked BOOLEAN DEFAULT false,
    block_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table regulatory_updates
CREATE TABLE IF NOT EXISTS regulatory_updates (
    id SERIAL PRIMARY KEY,
    source VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(1000),
    severity VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'general',
    published_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les paramètres de sécurité par défaut
INSERT INTO security_settings (
    mfa_required,
    password_min_length,
    password_require_uppercase,
    password_require_lowercase,
    password_require_numbers,
    password_require_special_chars,
    max_login_attempts,
    lockout_duration_minutes,
    session_timeout_minutes,
    enable_captcha,
    captcha_after_attempts,
    enable_audit_logging,
    encryption_enabled
) VALUES (
    false,
    8,  -- Réduire la longueur minimale pour les tests
    true,
    true,
    true,
    true,
    5,
    30,
    60,
    false,  -- Désactiver CAPTCHA pour les tests
    3,
    true,
    true
) ON CONFLICT DO NOTHING;

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_created_at ON failed_login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_category ON regulatory_updates(category);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_published_at ON regulatory_updates(published_at);
