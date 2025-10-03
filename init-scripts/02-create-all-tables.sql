-- Create all missing tables for AI Act Navigator
-- This script creates security and compliance tables

-- Enums
DO $$ BEGIN
    CREATE TYPE "risk_level" AS ENUM('minimal', 'limited', 'high', 'unacceptable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "system_status" AS ENUM('draft', 'active', 'archived', 'non_compliant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "maturity_level" AS ENUM('initial', 'developing', 'defined', 'managed', 'optimizing');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "mfa_type" AS ENUM('totp', 'backup_code');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "security_event_type" AS ENUM(
        'login_success', 'login_failed', 'logout', 'password_changed', 'mfa_enabled',
        'mfa_disabled', 'mfa_verified', 'password_reset_requested', 'password_reset_completed',
        'account_locked', 'account_unlocked', 'suspicious_activity'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "session_status" AS ENUM('active', 'expired', 'revoked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "certificate_status" AS ENUM('valid', 'expired', 'revoked', 'pending');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "certificate_type" AS ENUM('conformity', 'risk_assessment', 'maturity', 'compliance_summary');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ai_framework_dimension" AS ENUM(
        'justice_fairness', 'transparency_explainability', 'human_ai_interaction',
        'social_environmental_impact', 'responsibility', 'data_privacy', 'technical_robustness_security'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "framework_risk_level" AS ENUM('none', 'minimal', 'moderate', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "industry_sector" AS ENUM(
        'finance_banking', 'healthcare_medical', 'education_training', 'transportation_automotive',
        'retail_ecommerce', 'manufacturing_industrial', 'energy_utilities', 'telecommunications',
        'insurance', 'real_estate', 'agriculture', 'legal_services', 'media_entertainment',
        'government_public_sector', 'defense_security', 'research_development',
        'consulting_professional_services', 'technology_software', 'logistics_supply_chain',
        'hospitality_tourism', 'non_profit', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AI Act Articles table
CREATE TABLE IF NOT EXISTS ai_act_articles (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    article_number VARCHAR NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chapter VARCHAR,
    risk_category VARCHAR,
    obligations JSONB,
    effective_date TIMESTAMP,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Compliance Records table
CREATE TABLE IF NOT EXISTS compliance_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_system_id VARCHAR NOT NULL REFERENCES ai_systems(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    article_id VARCHAR NOT NULL REFERENCES ai_act_articles(id),
    compliant BOOLEAN DEFAULT false,
    evidence TEXT,
    notes TEXT,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated Documents table
CREATE TABLE IF NOT EXISTS generated_documents (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_system_id VARCHAR NOT NULL REFERENCES ai_systems(id),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    document_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    content TEXT,
    file_path VARCHAR,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- LLM Settings table
CREATE TABLE IF NOT EXISTS llm_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    provider VARCHAR NOT NULL,
    model VARCHAR,
    api_key TEXT,
    endpoint VARCHAR,
    temperature INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Maturity Assessments table
CREATE TABLE IF NOT EXISTS maturity_assessments (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    organization_name VARCHAR NOT NULL,
    industry_sector industry_sector,
    assessment_data JSONB NOT NULL,
    dimension_scores JSONB,
    customer_risk_levels JSONB,
    employee_risk_levels JSONB,
    overall_maturity maturity_level,
    domain_scores JSONB,
    recommendations JSONB,
    action_plan JSONB,
    overall_score INTEGER,
    eu_ai_act_compliance JSONB,
    compliance_gaps JSONB,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Certificates table
CREATE TABLE IF NOT EXISTS compliance_certificates (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    ai_system_id VARCHAR REFERENCES ai_systems(id),
    maturity_assessment_id VARCHAR REFERENCES maturity_assessments(id),
    certificate_type certificate_type NOT NULL,
    certificate_number VARCHAR NOT NULL UNIQUE,
    status certificate_status DEFAULT 'valid',
    organization_name VARCHAR NOT NULL,
    system_name VARCHAR,
    risk_level risk_level,
    compliance_score INTEGER,
    maturity_level maturity_level,
    certification_criteria JSONB,
    compliance_details JSONB,
    issued_by VARCHAR DEFAULT 'IA-ACT-NAVIGATOR',
    issued_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    certificate_data JSONB,
    certification_hash VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Framework Questions table
CREATE TABLE IF NOT EXISTS framework_questions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    dimension ai_framework_dimension NOT NULL,
    question_id VARCHAR NOT NULL UNIQUE,
    strategy TEXT NOT NULL,
    question TEXT NOT NULL,
    corresponding_action TEXT,
    tools JSONB,
    customer_risk_level framework_risk_level,
    employee_risk_level framework_risk_level,
    project_phase VARCHAR,
    weight INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    framework_version VARCHAR DEFAULT '3.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Use Case Risk Mapping table
CREATE TABLE IF NOT EXISTS use_case_risk_mapping (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_risk_levels JSONB NOT NULL,
    employee_risk_levels JSONB NOT NULL,
    description TEXT,
    remarks TEXT,
    framework_version VARCHAR DEFAULT '3.0',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User MFA Settings table
CREATE TABLE IF NOT EXISTS user_mfa_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) UNIQUE,
    totp_enabled BOOLEAN DEFAULT false,
    totp_secret TEXT,
    totp_backup_codes JSONB,
    totp_verified_at TIMESTAMP,
    recovery_email VARCHAR,
    recovery_phone VARCHAR,
    last_used_backup_code VARCHAR,
    backup_codes_used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Security Events table
CREATE TABLE IF NOT EXISTS user_security_events (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id),
    event_type security_event_type NOT NULL,
    event_description TEXT,
    ip_address VARCHAR,
    user_agent TEXT,
    location JSONB,
    risk_score INTEGER,
    is_successful BOOLEAN DEFAULT true,
    failure_reason TEXT,
    session_id VARCHAR,
    additional_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_security_events_user_id ON user_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_events_event_type ON user_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_security_events_created_at ON user_security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_security_events_ip_address ON user_security_events(ip_address);

-- Password Reset Tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    token VARCHAR NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    requested_from_ip VARCHAR,
    requested_from_user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id),
    session_token VARCHAR NOT NULL UNIQUE,
    status session_status DEFAULT 'active',
    device_name VARCHAR,
    device_type VARCHAR,
    browser_name VARCHAR,
    browser_version VARCHAR,
    os_name VARCHAR,
    os_version VARCHAR,
    ip_address VARCHAR,
    location JSONB,
    is_trusted BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_act_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_act_admin;
