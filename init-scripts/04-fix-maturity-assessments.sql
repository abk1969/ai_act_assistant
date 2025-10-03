-- Script pour corriger la table maturity_assessments
-- Ajouter la colonne primary_use_case manquante

ALTER TABLE maturity_assessments
  ADD COLUMN IF NOT EXISTS primary_use_case VARCHAR;
