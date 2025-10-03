-- Script pour corriger la table risk_assessments
-- Ajouter toutes les colonnes manquantes selon le schéma

ALTER TABLE risk_assessments
  ADD COLUMN IF NOT EXISTS user_id VARCHAR NOT NULL DEFAULT 'unknown' REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS system_name VARCHAR NOT NULL DEFAULT 'System IA',
  ADD COLUMN IF NOT EXISTS organization_name VARCHAR NOT NULL DEFAULT 'Organisation',
  ADD COLUMN IF NOT EXISTS industry_sector VARCHAR,
  ADD COLUMN IF NOT EXISTS primary_use_case VARCHAR,
  ADD COLUMN IF NOT EXISTS system_description TEXT,
  ADD COLUMN IF NOT EXISTS eu_ai_act_risk_level VARCHAR NOT NULL DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS eu_ai_act_classification JSONB,
  ADD COLUMN IF NOT EXISTS is_high_risk_domain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS high_risk_domains JSONB,
  ADD COLUMN IF NOT EXISTS framework_responses JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dimension_scores JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS overall_framework_score INTEGER,
  ADD COLUMN IF NOT EXISTS form_data JSONB,
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS applicable_obligations JSONB,
  ADD COLUMN IF NOT EXISTS compliance_gaps JSONB,
  ADD COLUMN IF NOT EXISTS compliance_score INTEGER,
  ADD COLUMN IF NOT EXISTS recommendations JSONB,
  ADD COLUMN IF NOT EXISTS action_plan JSONB,
  ADD COLUMN IF NOT EXISTS priority_actions JSONB,
  ADD COLUMN IF NOT EXISTS timeline JSONB,
  ADD COLUMN IF NOT EXISTS assessment_version VARCHAR DEFAULT '3.0',
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Rendre assessment_data nullable (ancien schéma)
ALTER TABLE risk_assessments ALTER COLUMN assessment_data DROP NOT NULL;
