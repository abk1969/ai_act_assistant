-- Script pour corriger la table ai_act_articles
-- Ajouter toutes les colonnes manquantes selon le schéma

ALTER TABLE ai_act_articles
  ADD COLUMN IF NOT EXISTS keywords JSONB,
  ADD COLUMN IF NOT EXISTS related_articles JSONB,
  ADD COLUMN IF NOT EXISTS practical_examples JSONB,
  ADD COLUMN IF NOT EXISTS compliance_checklist JSONB,
  ADD COLUMN IF NOT EXISTS sanctions TEXT;
