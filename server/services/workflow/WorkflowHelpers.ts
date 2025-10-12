/**
 * Utilitaires réutilisables pour le système de workflows
 * Réduit la duplication de code dans les handlers et services
 */

import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WorkflowExecutionContext,
} from "../WorkflowConfigurationService";
import { WorkflowStepExecution } from "@shared/schema";

/**
 * Récupère la configuration d'une étape depuis le contexte d'exécution
 * Élimine la duplication du pattern .find() dans chaque handler
 */
export function getStepConfiguration(
  stepExecution: WorkflowStepExecution,
  context: WorkflowExecutionContext
): Record<string, any> {
  const config = context.configuration.configuration.customSteps.find(
    (s: any) => s.id === stepExecution.stepId
  )?.configuration || {};

  return config;
}

/**
 * Génère un timestamp ISO standardisé
 * Utilisé pour marquer les événements et résultats
 */
export function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Génère un ID unique avec un préfixe optionnel
 * Format: {prefix}_{timestamp}_{random}
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Génère un ID court avec préfixe
 * Format: {prefix}-{timestamp}
 */
export function generateShortId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}`;
}

/**
 * Limite une valeur numérique entre min et max
 * Utile pour les calculs de scores et validations
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Limite un score entre 0 et maxScore
 * Raccourci pour clamp(score, 0, maxScore)
 */
export function clampScore(score: number, maxScore: number): number {
  return clamp(score, 0, maxScore);
}

/**
 * Crée un objet ValidationResult standardisé
 * Simplifie la création de résultats de validation
 */
export function createValidationResult(
  errors: ValidationError[] = [],
  warnings: ValidationWarning[] = []
): ValidationResult {
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Ajoute une erreur à un résultat de validation
 * Met à jour automatiquement isValid
 */
export function addValidationError(
  result: ValidationResult,
  field: string,
  message: string,
  code: string
): void {
  result.errors.push({ field, message, code });
  result.isValid = false;
}

/**
 * Ajoute un avertissement à un résultat de validation
 */
export function addValidationWarning(
  result: ValidationResult,
  field: string,
  message: string,
  code: string
): void {
  result.warnings.push({ field, message, code });
}

/**
 * Valide qu'un champ requis existe dans la configuration
 */
export function validateRequiredField(
  result: ValidationResult,
  config: Record<string, any>,
  fieldName: string,
  errorCode: string = 'MISSING_FIELD'
): boolean {
  if (!config[fieldName]) {
    addValidationError(
      result,
      fieldName,
      `${fieldName} is required`,
      errorCode
    );
    return false;
  }
  return true;
}

/**
 * Valide qu'un champ est un tableau non vide
 */
export function validateArrayField(
  result: ValidationResult,
  config: Record<string, any>,
  fieldName: string,
  errorCode: string = 'INVALID_ARRAY'
): boolean {
  if (!config[fieldName] || !Array.isArray(config[fieldName])) {
    addValidationError(
      result,
      fieldName,
      `${fieldName} must be a non-empty array`,
      errorCode
    );
    return false;
  }
  return true;
}

/**
 * Valide une énumération (liste de valeurs acceptées)
 */
export function validateEnum(
  result: ValidationResult,
  config: Record<string, any>,
  fieldName: string,
  allowedValues: string[],
  errorCode: string = 'INVALID_ENUM'
): boolean {
  const value = config[fieldName];
  if (value && !allowedValues.includes(value)) {
    addValidationError(
      result,
      fieldName,
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      errorCode
    );
    return false;
  }
  return true;
}

/**
 * Parse et valide un nombre
 * Retourne le nombre parsé ou une valeur par défaut
 */
export function parseNumber(
  value: any,
  defaultValue: number = 0,
  min?: number,
  max?: number
): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    return defaultValue;
  }

  if (min !== undefined && max !== undefined) {
    return clamp(parsed, min, max);
  }

  return parsed;
}

/**
 * Calcule un pourcentage avec arrondi
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  const multiplier = Math.pow(10, decimals);
  return Math.round(percentage * multiplier) / multiplier;
}

/**
 * Fusionne plusieurs objets de données en supprimant les undefined
 */
export function mergeOutputData(
  ...dataObjects: Array<Record<string, any>>
): Record<string, any> {
  const merged: Record<string, any> = {};

  for (const obj of dataObjects) {
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        merged[key] = value;
      }
    }
  }

  return merged;
}

/**
 * Extrait des valeurs sûres d'un objet (pour logging/debugging)
 * Filtre les propriétés sensibles
 */
export function extractSafeValues(
  data: Record<string, any>,
  excludeKeys: string[] = ['password', 'token', 'secret', 'apiKey']
): Record<string, any> {
  const safe: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!excludeKeys.some(excluded => key.toLowerCase().includes(excluded.toLowerCase()))) {
      safe[key] = value;
    }
  }

  return safe;
}

/**
 * Crée un résumé d'erreur standardisé
 */
export function createErrorSummary(
  errors: string[],
  warnings: string[] = []
): string {
  const parts: string[] = [];

  if (errors.length > 0) {
    parts.push(`${errors.length} error(s): ${errors.join('; ')}`);
  }

  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning(s): ${warnings.join('; ')}`);
  }

  return parts.join(' | ') || 'No issues';
}

/**
 * Détermine le niveau de risque basé sur un score
 * Utilise des seuils configurables
 */
export function determineRiskLevel(
  score: number,
  thresholds: {
    minimal?: number;
    limited?: number;
    high?: number;
  } = {}
): 'minimal' | 'limited' | 'high' | 'unacceptable' {
  const defaults = {
    minimal: 80,
    limited: 60,
    high: 40,
  };

  const t = { ...defaults, ...thresholds };

  if (score >= t.minimal) return 'minimal';
  if (score >= t.limited) return 'limited';
  if (score >= t.high) return 'high';
  return 'unacceptable';
}

/**
 * Estime la durée d'une tâche basée sur la complexité
 */
export function estimateDuration(
  itemCount: number,
  minutesPerItem: number = 5,
  minimumMinutes: number = 15
): number {
  return Math.max(minimumMinutes, itemCount * minutesPerItem);
}

/**
 * Formate une durée en minutes en texte lisible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}min`;
}
