import {
  IWorkflowStepHandler,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StepExecutionResult,
  WorkflowExecutionContext,
} from "../WorkflowConfigurationService";
import { WorkflowStepExecution } from "@shared/schema";
import {
  getStepConfiguration,
  generateTimestamp,
  validateArrayField,
  parseNumber,
  clampScore,
  calculatePercentage,
  determineRiskLevel as determineRiskLevelHelper,
  estimateDuration as estimateDurationHelper,
} from "./WorkflowHelpers";

/**
 * Handler de base abstrait pour les étapes de workflow
 * Implémente les fonctionnalités communes
 */
export abstract class BaseStepHandler implements IWorkflowStepHandler {
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly description: string;
  
  /**
   * Validation par défaut de la configuration
   * Peut être surchargée par les classes dérivées
   */
  validateConfiguration(config: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validation de base commune
    if (!config) {
      errors.push({
        field: 'configuration',
        message: 'Configuration is required',
        code: 'MISSING_CONFIGURATION'
      });
    }
    
    return { isValid: errors.length === 0, errors, warnings };
  }
  
  /**
   * Méthode abstraite à implémenter par chaque handler
   */
  abstract execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult>;
  
  /**
   * Estimation par défaut de la durée
   */
  estimateDuration(config: Record<string, any>): number {
    return config.estimatedDuration || 60; // 60 minutes par défaut
  }
  
  /**
   * Par défaut, les étapes ne peuvent pas s'exécuter en parallèle
   */
  canRunInParallel(): boolean {
    return false;
  }
  
  /**
   * Compensation par défaut (ne fait rien)
   */
  async compensate?(
    stepExecution: WorkflowStepExecution,
    context: WorkflowExecutionContext
  ): Promise<void> {
    // Implémentation par défaut vide
    console.log(`No compensation needed for step: ${stepExecution.id}`);
  }
}

/**
 * Handler pour les étapes de collecte de données
 * Permet de collecter des informations auprès des utilisateurs
 */
export class DataCollectionStepHandler extends BaseStepHandler {
  readonly type = 'data_collection';
  readonly name = 'Collecte de données';
  readonly description = 'Collecte des informations nécessaires auprès des utilisateurs';
  
  validateConfiguration(config: Record<string, any>): ValidationResult {
    const result = super.validateConfiguration(config);
    
    // Validation spécifique à la collecte de données
    if (!config.fields || !Array.isArray(config.fields)) {
      result.errors.push({
        field: 'fields',
        message: 'Fields array is required for data collection',
        code: 'MISSING_FIELDS'
      });
    } else {
      // Validation de chaque champ
      for (const field of config.fields) {
        if (!field.id) {
          result.errors.push({
            field: 'field.id',
            message: 'Field ID is required',
            code: 'MISSING_FIELD_ID'
          });
        }
        if (!field.type) {
          result.errors.push({
            field: 'field.type',
            message: 'Field type is required',
            code: 'MISSING_FIELD_TYPE'
          });
        }
        if (!field.label) {
          result.errors.push({
            field: 'field.label',
            message: 'Field label is required',
            code: 'MISSING_FIELD_LABEL'
          });
        }
      }
    }
    
    result.isValid = result.errors.length === 0;
    return result;
  }
  
  async execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const stepConfig = getStepConfiguration(stepExecution, context);

    return {
      success: true,
      outputData: {
        status: 'awaiting_user_input',
        fields: stepConfig.fields || [],
        collectedData: inputData.collectedData || {}
      },
      requiresApproval: true, // Nécessite une interaction utilisateur
      estimatedDuration: this.estimateDuration(stepConfig)
    };
  }

  estimateDuration(config: Record<string, any>): number {
    const fieldCount = config.fields?.length || 0;
    return estimateDurationHelper(fieldCount, 5, 30);
  }
}

/**
 * Handler pour les étapes d'évaluation/assessment
 * Effectue des calculs et analyses automatiques
 */
export class AssessmentStepHandler extends BaseStepHandler {
  readonly type = 'assessment';
  readonly name = 'Évaluation';
  readonly description = 'Effectue une évaluation automatique basée sur des critères';
  
  validateConfiguration(config: Record<string, any>): ValidationResult {
    const result = super.validateConfiguration(config);
    
    if (!config.criteria || !Array.isArray(config.criteria)) {
      result.errors.push({
        field: 'criteria',
        message: 'Criteria array is required for assessment',
        code: 'MISSING_CRITERIA'
      });
    }
    
    if (!config.scoringMethod) {
      result.warnings.push({
        field: 'scoringMethod',
        message: 'No scoring method specified, using default',
        code: 'DEFAULT_SCORING'
      });
    }
    
    result.isValid = result.errors.length === 0;
    return result;
  }
  
  async execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const config = getStepConfiguration(stepExecution, context);
    const criteria = config.criteria || [];

    // Évaluation de chaque critère
    const evaluations: Record<string, any> = {};
    let totalScore = 0;
    let maxScore = 0;

    for (const criterion of criteria) {
      const evaluation = await this.evaluateCriterion(
        criterion,
        inputData,
        context
      );

      evaluations[criterion.id] = evaluation;
      totalScore += evaluation.score;
      maxScore += evaluation.maxScore;
    }

    // Calcul du score final
    const finalScore = calculatePercentage(totalScore, maxScore, 2);

    // Détermination du niveau de risque basé sur le score
    const riskLevel = determineRiskLevelHelper(finalScore, config.riskThresholds);

    return {
      success: true,
      outputData: {
        evaluations,
        totalScore,
        maxScore,
        finalScore,
        riskLevel,
        timestamp: generateTimestamp()
      },
      requiresApproval: config.requiresApproval || false
    };
  }
  
  /**
   * Évalue un critère individuel
   */
  private async evaluateCriterion(
    criterion: any,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<{ score: number; maxScore: number; details: any }> {
    const weight = criterion.weight || 1;
    const maxScore = 10 * weight;
    
    // Logique d'évaluation basée sur le type de critère
    let score = 0;
    const details: any = {};
    
    switch (criterion.type) {
      case 'boolean':
        score = inputData[criterion.id] === true ? maxScore : 0;
        details.value = inputData[criterion.id];
        break;
        
      case 'numeric':
        const value = parseFloat(inputData[criterion.id]) || 0;
        const min = criterion.validation?.min || 0;
        const max = criterion.validation?.max || 100;
        score = ((value - min) / (max - min)) * maxScore;
        details.value = value;
        details.range = { min, max };
        break;
        
      case 'selection':
        const selectedValue = inputData[criterion.id];
        const scoreMap = criterion.scoring?.scoreMap || {};
        score = scoreMap[selectedValue] || 0;
        details.value = selectedValue;
        details.scoreMap = scoreMap;
        break;
        
      default:
        score = maxScore / 2; // Score neutre par défaut
        details.value = inputData[criterion.id];
    }
    
    return {
      score: clampScore(score, maxScore),
      maxScore,
      details
    };
  }

  estimateDuration(config: Record<string, any>): number {
    const criteriaCount = config.criteria?.length || 0;
    return estimateDurationHelper(criteriaCount, 2, 15);
  }
  
  canRunInParallel(): boolean {
    return true; // Les évaluations peuvent s'exécuter en parallèle
  }
}

/**
 * Handler pour les étapes de validation
 * Vérifie la conformité et la complétude des données
 */
export class ValidationStepHandler extends BaseStepHandler {
  readonly type = 'validation';
  readonly name = 'Validation';
  readonly description = 'Valide les données collectées selon des règles définies';

  validateConfiguration(config: Record<string, any>): ValidationResult {
    const result = super.validateConfiguration(config);
    validateArrayField(result, config, 'rules', 'MISSING_RULES');
    return result;
  }

  async execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const config = getStepConfiguration(stepExecution, context);
    const rules = config.rules || [];

    const validationResults: any[] = [];
    let isValid = true;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Application de chaque règle de validation
    for (const rule of rules) {
      const result = await this.applyValidationRule(rule, inputData, context);
      validationResults.push(result);

      if (!result.passed) {
        isValid = false;
        if (rule.severity === 'error') {
          errors.push(result.message);
        } else {
          warnings.push(result.message);
        }
      }
    }

    return {
      success: isValid || config.allowWarnings,
      outputData: {
        isValid,
        validationResults,
        errors,
        warnings,
        timestamp: generateTimestamp()
      },
      errors: isValid ? undefined : errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      requiresApproval: !isValid && config.requireApprovalOnFailure
    };
  }

  /**
   * Applique une règle de validation
   */
  private async applyValidationRule(
    rule: any,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<{ passed: boolean; message: string; rule: string }> {
    const { field, condition, value, message } = rule;

    let passed = false;

    switch (condition) {
      case 'required':
        passed = inputData[field] !== undefined && inputData[field] !== null && inputData[field] !== '';
        break;

      case 'equals':
        passed = inputData[field] === value;
        break;

      case 'notEquals':
        passed = inputData[field] !== value;
        break;

      case 'greaterThan':
        passed = parseNumber(inputData[field]) > parseNumber(value);
        break;

      case 'lessThan':
        passed = parseNumber(inputData[field]) < parseNumber(value);
        break;

      case 'matches':
        const regex = new RegExp(value);
        passed = regex.test(String(inputData[field]));
        break;

      case 'custom':
        // Évaluation d'une expression personnalisée
        try {
          const func = new Function('data', 'context', `return ${value}`);
          passed = func(inputData, context);
        } catch (error) {
          passed = false;
        }
        break;

      default:
        passed = true;
    }

    return {
      passed,
      message: message || `Validation failed for field: ${field}`,
      rule: condition
    };
  }

  estimateDuration(config: Record<string, any>): number {
    return 10; // Les validations sont généralement rapides
  }

  canRunInParallel(): boolean {
    return true;
  }
}

/**
 * Handler pour les étapes d'approbation
 * Gère les workflows d'approbation multi-niveaux
 */
export class ApprovalStepHandler extends BaseStepHandler {
  readonly type = 'approval';
  readonly name = 'Approbation';
  readonly description = 'Requiert une approbation manuelle avant de continuer';

  validateConfiguration(config: Record<string, any>): ValidationResult {
    const result = super.validateConfiguration(config);

    if (!config.approvers || !Array.isArray(config.approvers)) {
      result.errors.push({
        field: 'approvers',
        message: 'Approvers list is required',
        code: 'MISSING_APPROVERS'
      });
    }

    if (config.approvalType && !['any', 'all', 'majority'].includes(config.approvalType)) {
      result.errors.push({
        field: 'approvalType',
        message: 'Invalid approval type. Must be: any, all, or majority',
        code: 'INVALID_APPROVAL_TYPE'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  async execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const config = getStepConfiguration(stepExecution, context);

    // Cette étape nécessite toujours une approbation
    return {
      success: true,
      outputData: {
        status: 'awaiting_approval',
        approvers: config.approvers || [],
        approvalType: config.approvalType || 'all',
        description: config.description || 'Approbation requise',
        deadline: config.deadline || null
      },
      requiresApproval: true,
      estimatedDuration: this.estimateDuration(config)
    };
  }

  estimateDuration(config: Record<string, any>): number {
    // Les approbations peuvent prendre du temps
    return config.estimatedDuration || 24 * 60; // 24 heures par défaut
  }
}

/**
 * Handler pour les étapes de documentation
 * Génère automatiquement de la documentation
 */
export class DocumentationStepHandler extends BaseStepHandler {
  readonly type = 'documentation';
  readonly name = 'Documentation';
  readonly description = 'Génère automatiquement de la documentation';

  validateConfiguration(config: Record<string, any>): ValidationResult {
    const result = super.validateConfiguration(config);

    if (!config.template && !config.templateId) {
      result.errors.push({
        field: 'template',
        message: 'Document template is required',
        code: 'MISSING_TEMPLATE'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  async execute(
    stepExecution: WorkflowStepExecution,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<StepExecutionResult> {
    const config = getStepConfiguration(stepExecution, context);

    // Génération du document basée sur le template et les données
    const document = await this.generateDocument(config, inputData, context);

    return {
      success: true,
      outputData: {
        documentId: document.id,
        documentUrl: document.url,
        documentType: config.documentType || 'pdf',
        generatedAt: generateTimestamp()
      }
    };
  }

  /**
   * Génère un document basé sur un template
   */
  private async generateDocument(
    config: any,
    inputData: Record<string, any>,
    context: WorkflowExecutionContext
  ): Promise<{ id: string; url: string }> {
    // TODO: Implémenter la génération réelle de documents
    // Pour l'instant, retourne un mock

    const documentId = `doc_${Date.now()}`;
    const documentUrl = `/api/documents/${documentId}`;

    return { id: documentId, url: documentUrl };
  }

  estimateDuration(config: Record<string, any>): number {
    return 15; // Génération de documents relativement rapide
  }

  canRunInParallel(): boolean {
    return true;
  }
}

/**
 * Registre de tous les handlers disponibles
 */
export const DEFAULT_STEP_HANDLERS = [
  new DataCollectionStepHandler(),
  new AssessmentStepHandler(),
  new ValidationStepHandler(),
  new ApprovalStepHandler(),
  new DocumentationStepHandler(),
];

