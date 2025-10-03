-- Script final de création des tables manquantes
-- AI Act Navigator - Résolution définitive

-- 1. Supprimer les tables si elles existent
DROP TABLE IF EXISTS security_settings CASCADE;
DROP TABLE IF EXISTS failed_login_attempts CASCADE;
DROP TABLE IF EXISTS regulatory_updates CASCADE;

-- 2. Créer la table security_settings (version simplifiée)
CREATE TABLE security_settings (
    id SERIAL PRIMARY KEY,
    mfa_required BOOLEAN DEFAULT false,
    mfa_grace_period_days INTEGER DEFAULT 7,
    password_min_length INTEGER DEFAULT 6,
    password_max_length INTEGER DEFAULT 128,
    password_require_uppercase BOOLEAN DEFAULT true,
    password_require_lowercase BOOLEAN DEFAULT true,
    password_require_numbers BOOLEAN DEFAULT true,
    password_require_special_chars BOOLEAN DEFAULT true,
    password_expiration_days INTEGER DEFAULT 90,
    password_history_count INTEGER DEFAULT 5,
    max_login_attempts INTEGER DEFAULT 10,
    lockout_duration_minutes INTEGER DEFAULT 15,
    session_timeout_minutes INTEGER DEFAULT 120,
    max_concurrent_sessions INTEGER DEFAULT 5,
    enable_captcha BOOLEAN DEFAULT false,
    captcha_after_attempts INTEGER DEFAULT 5,
    enable_audit_logging BOOLEAN DEFAULT true,
    audit_log_retention_days INTEGER DEFAULT 365,
    encryption_enabled BOOLEAN DEFAULT true,
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    enable_security_alerts BOOLEAN DEFAULT true,
    alert_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Créer la table failed_login_attempts (version simplifiée)
CREATE TABLE failed_login_attempts (
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

-- 4. Créer la table regulatory_updates (version simplifiée)
CREATE TABLE regulatory_updates (
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

-- 5. Insérer les paramètres de sécurité par défaut (politique souple pour tests)
INSERT INTO security_settings (
    mfa_required,
    password_min_length,
    password_max_length,
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
    false,              -- MFA désactivé pour tests
    6,                  -- Longueur minimale réduite
    128,
    true,
    true,
    true,
    true,
    10,                 -- Plus de tentatives autorisées
    15,                 -- Verrouillage plus court
    120,                -- Session plus longue
    false,              -- CAPTCHA désactivé
    5,
    true,
    true
);

-- 6. Vérifications
SELECT 'Tables créées avec succès' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('security_settings', 'failed_login_attempts', 'regulatory_updates')
ORDER BY table_name;

SELECT 'Paramètres de sécurité insérés' as status;
SELECT id, password_min_length, max_login_attempts, enable_captcha 
FROM security_settings;
