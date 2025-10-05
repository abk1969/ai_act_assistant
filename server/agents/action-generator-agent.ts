/**
 * Agent Générateur d'Actions - Action Generator Agent
 * Génère des plans d'actions concrets et prioritaires basés sur les insights personnalisés
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { 
  AgentCard, 
  AgentMessage,
  Action,
  ChecklistItem
} from '../types/regulatory-monitoring';
import { PersonalizedRegulatoryInsight } from './personalization-agent';
import { AiSystem } from '@shared/schema';
import { storage } from '../storage';
import { llmService } from '../services/llmService';

// Nouveaux types pour la génération d'actions
export interface ActionableRegulatoryInsight extends PersonalizedRegulatoryInsight {
  actionPlan: {
    priorityActions: PersonalizedAction[];
    systemSpecificActions: Record<string, PersonalizedAction[]>;
    complianceChecklist: PersonalizedChecklistItem[];
    timeline: ActionTimeline;
    estimatedEffort: string;
    budgetImpact?: string;
    riskMitigation: RiskMitigationPlan;
  };
}

export interface PersonalizedAction extends Action {
  systemId?: string;
  systemName?: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours?: number;
  requiredSkills?: string[];
  dependencies?: string[];
  category: 'compliance' | 'documentation' | 'technical' | 'governance' | 'training';
  dueDate?: Date;
  owner?: string;
  resources?: string[];
}

export interface PersonalizedChecklistItem extends ChecklistItem {
  systemId?: string;
  systemName?: string;
  category: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  estimatedHours?: number;
  prerequisites?: string[];
  validationCriteria?: string[];
}

export interface ActionTimeline {
  immediate: PersonalizedAction[]; // 0-30 jours
  short_term: PersonalizedAction[]; // 1-3 mois
  medium_term: PersonalizedAction[]; // 3-6 mois
  long_term: PersonalizedAction[]; // 6+ mois
}

export interface RiskMitigationPlan {
  identifiedRisks: string[];
  mitigationActions: PersonalizedAction[];
  contingencyPlans: string[];
  monitoringRequirements: string[];
}

export class ActionGeneratorAgent {
  private geminiModel: ChatGoogleGenerativeAI | null = null;
  private claudeModel: ChatAnthropic | null = null;
  private openaiModel: ChatOpenAI | null = null;

  private agentCard: AgentCard = {
    agent_id: 'regulatory-action-generator-001',
    name: 'Actionable Insights Generator',
    description: 'Generates concrete actions and timelines for regulatory compliance',
    version: '1.0.0',
    capabilities: [
      {
        action: 'generate_action_plan',
        description: 'Create personalized action plans from insights',
        input_schema: {
          personalizedInsights: 'array',
          userId: 'string',
        },
        output_schema: {
          actionableInsights: 'array',
        },
      },
      {
        action: 'create_system_specific_actions',
        description: 'Generate actions specific to an AI system',
        input_schema: {
          insight: 'object',
          system: 'object',
        },
        output_schema: {
          actions: 'array',
        },
      },
      {
        action: 'calculate_action_timeline',
        description: 'Calculate realistic timeline for actions based on maturity',
        input_schema: {
          actions: 'array',
          maturityLevel: 'string',
        },
        output_schema: {
          timeline: 'object',
        },
      },
    ],
    communication: {
      protocols: ['http'],
      formats: ['json'],
    },
    status: 'online',
  };

  constructor() {
    this.initializeModels();
  }

  private async initializeModels() {
    try {
      const geminiKey = process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        this.geminiModel = new ChatGoogleGenerativeAI({
          apiKey: geminiKey,
          modelName: 'gemini-2.0-flash-exp',
          temperature: 0.3,
        });
        console.log('✅ Gemini model initialized for action generation');
      }
    } catch (error) {
      console.warn('⚠️ Gemini model initialization failed:', error);
    }

    try {
      const claudeKey = process.env.ANTHROPIC_API_KEY;
      if (claudeKey) {
        this.claudeModel = new ChatAnthropic({
          apiKey: claudeKey,
          modelName: 'claude-3-7-sonnet-20250219',
          temperature: 0.3,
        });
        console.log('✅ Claude model initialized for complex action planning');
      }
    } catch (error) {
      console.warn('⚠️ Claude model initialization failed:', error);
    }
  }

  /**
   * Initialize models based on user's LLM settings
   */
  private async initializeUserModels(userId?: string) {
    if (!userId) return;

    try {
      const settings = await storage.getActiveLlmSettings(userId);
      if (!settings || !settings.apiKey) {
        console.warn('⚠️ No active LLM settings for user, using default models');
        return;
      }

      const { provider, modelName, temperature = 0.3 } = settings;

      switch (provider) {
        case 'openai':
          this.openaiModel = new ChatOpenAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gpt-4-turbo-preview',
            temperature,
          });
          console.log(`✅ OpenAI model ${modelName} initialized for action generation`);
          break;

        case 'google':
        case 'gemini':
          this.geminiModel = new ChatGoogleGenerativeAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gemini-2.0-flash-exp',
            temperature,
          });
          console.log(`✅ Gemini model ${modelName} initialized for action generation`);
          break;

        case 'anthropic':
          this.claudeModel = new ChatAnthropic({
            apiKey: settings.apiKey,
            modelName: modelName || 'claude-3-7-sonnet-20250219',
            temperature,
          });
          console.log(`✅ Claude model ${modelName} initialized for action generation`);
          break;

        default:
          console.warn(`⚠️ Unsupported provider ${provider}, using default models`);
      }
    } catch (error) {
      console.error('❌ Error initializing user models:', error);
    }
  }

  /**
   * Méthode principale : génère des plans d'actions pour les insights personnalisés
   */
  async generateActionPlans(
    personalizedInsights: PersonalizedRegulatoryInsight[],
    userId: string
  ): Promise<ActionableRegulatoryInsight[]> {
    console.log(`⚡ Generating action plans for ${personalizedInsights.length} personalized insights...`);

    // Initialize models based on user settings
    await this.initializeUserModels(userId);

    const actionableInsights: ActionableRegulatoryInsight[] = [];

    for (const insight of personalizedInsights) {
      try {
        const actionPlan = await this.createActionPlan(insight, userId);
        actionableInsights.push({
          ...insight,
          actionPlan,
        });
      } catch (error) {
        console.error(`❌ Failed to generate action plan for insight: ${insight.classifiedData.analyzedData.rawData.title}`, error);
        // Fallback: créer un plan d'actions basique
        actionableInsights.push(this.createFallbackActionableInsight(insight));
      }
    }

    console.log(`✅ Generated ${actionableInsights.length} actionable insights with concrete plans`);
    return actionableInsights;
  }

  /**
   * Crée un plan d'actions complet pour un insight personnalisé
   */
  private async createActionPlan(
    insight: PersonalizedRegulatoryInsight,
    userId: string
  ): Promise<ActionableRegulatoryInsight['actionPlan']> {
    const { userContext } = insight;
    
    // 1. Générer les actions prioritaires
    const priorityActions = await this.generatePriorityActions(insight);
    
    // 2. Générer les actions spécifiques par système
    const systemSpecificActions = await this.generateSystemSpecificActions(insight);
    
    // 3. Créer la checklist de conformité
    const complianceChecklist = await this.createComplianceChecklist(insight);
    
    // 4. Calculer la timeline
    const timeline = this.calculateActionTimeline(
      [...priorityActions, ...Object.values(systemSpecificActions).flat()],
      userContext.urgencyLevel
    );
    
    // 5. Estimer l'effort
    const estimatedEffort = this.calculateEstimatedEffort(priorityActions, systemSpecificActions);
    
    // 6. Estimer l'impact budgétaire
    const budgetImpact = this.estimateBudgetImpact(insight, priorityActions);
    
    // 7. Créer le plan de mitigation des risques
    const riskMitigation = this.createRiskMitigationPlan(insight, priorityActions);

    return {
      priorityActions,
      systemSpecificActions,
      complianceChecklist,
      timeline,
      estimatedEffort,
      budgetImpact,
      riskMitigation,
    };
  }

  /**
   * Génère les actions prioritaires basées sur l'insight personnalisé
   */
  private async generatePriorityActions(
    insight: PersonalizedRegulatoryInsight
  ): Promise<PersonalizedAction[]> {
    const { userContext, synthesis } = insight;
    const actions: PersonalizedAction[] = [];

    // Actions basées sur les recommandations existantes
    for (const [index, recommendation] of synthesis.recommendedActions.entries()) {
      const action: PersonalizedAction = {
        id: `priority-${Date.now()}-${index}`,
        description: recommendation.description,
        priority: this.mapPriorityFromUrgency(userContext.urgencyLevel),
        deadline: this.calculateDeadline(userContext.urgencyLevel),
        status: 'pending',
        category: this.categorizeAction(recommendation.description),
        impactLevel: this.determineImpactLevel(insight, recommendation),
        estimatedHours: this.estimateActionHours(recommendation.description, userContext.urgencyLevel),
        requiredSkills: this.identifyRequiredSkills(recommendation.description),
        dependencies: this.identifyDependencies(recommendation.description, userContext),
      };
      actions.push(action);
    }

    // Actions spécifiques aux gaps de maturité
    for (const gap of userContext.maturityGaps) {
      const action: PersonalizedAction = {
        id: `maturity-gap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        description: `Combler le gap de maturité: ${gap}`,
        priority: 'medium',
        deadline: this.calculateDeadline('medium'),
        status: 'pending',
        category: 'governance',
        impactLevel: 'medium',
        estimatedHours: 20,
        requiredSkills: ['Gouvernance IA', 'Gestion de projet'],
        dependencies: ['Évaluation de maturité complète'],
      };
      actions.push(action);
    }

    // Actions spécifiques aux gaps de conformité
    for (const gap of userContext.complianceGaps) {
      const action: PersonalizedAction = {
        id: `compliance-gap-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        description: `Résoudre le gap de conformité: ${gap}`,
        priority: 'high',
        deadline: this.calculateDeadline('high'),
        status: 'pending',
        category: 'compliance',
        impactLevel: 'high',
        estimatedHours: 15,
        requiredSkills: ['Conformité réglementaire', 'Audit'],
        dependencies: ['Analyse détaillée du gap'],
      };
      actions.push(action);
    }

    // Trier par priorité et impact
    return this.prioritizeActions(actions);
  }

  /**
   * Génère les actions spécifiques par système IA
   */
  private async generateSystemSpecificActions(
    insight: PersonalizedRegulatoryInsight
  ): Promise<Record<string, PersonalizedAction[]>> {
    const { userContext } = insight;
    const systemActions: Record<string, PersonalizedAction[]> = {};

    for (const system of userContext.impactedSystems) {
      const actions = await this.createSystemSpecificActions(insight, system);
      systemActions[system.id] = actions;
    }

    return systemActions;
  }

  /**
   * Crée des actions spécifiques pour un système IA donné
   */
  async createSystemSpecificActions(
    insight: PersonalizedRegulatoryInsight,
    system: AiSystem
  ): Promise<PersonalizedAction[]> {
    const actions: PersonalizedAction[] = [];
    const { classifiedData, userContext } = insight;

    // Action de révision du système si haut risque
    if (system.riskLevel === 'high' || system.riskLevel === 'unacceptable') {
      actions.push({
        id: `system-review-${system.id}-${Date.now()}`,
        description: `Révision complète du système ${system.name} suite aux nouvelles exigences`,
        priority: 'urgent',
        deadline: this.calculateDeadline('immediate'),
        status: 'pending',
        category: 'technical',
        impactLevel: 'critical',
        systemId: system.id,
        systemName: system.name,
        estimatedHours: 40,
        requiredSkills: ['Architecture IA', 'Conformité technique'],
        dependencies: ['Analyse d\'impact détaillée'],
      });
    }

    // Action de mise à jour de la documentation
    if (classifiedData.classification.updateType === 'implementing_act') {
      actions.push({
        id: `doc-update-${system.id}-${Date.now()}`,
        description: `Mise à jour de la documentation technique de ${system.name}`,
        priority: 'high',
        deadline: this.calculateDeadline('high'),
        status: 'pending',
        category: 'documentation',
        impactLevel: 'medium',
        systemId: system.id,
        systemName: system.name,
        estimatedHours: 16,
        requiredSkills: ['Documentation technique', 'Conformité'],
        dependencies: ['Révision des exigences'],
      });
    }

    // Action de test de conformité
    if (userContext.complianceGaps.some(gap => gap.includes(system.name))) {
      actions.push({
        id: `compliance-test-${system.id}-${Date.now()}`,
        description: `Tests de conformité pour ${system.name}`,
        priority: 'high',
        deadline: this.calculateDeadline('high'),
        status: 'pending',
        category: 'compliance',
        impactLevel: 'high',
        systemId: system.id,
        systemName: system.name,
        estimatedHours: 24,
        requiredSkills: ['Tests de conformité', 'Audit technique'],
        dependencies: ['Mise à jour documentation'],
      });
    }

    return actions;
  }

  /**
   * Crée une checklist de conformité personnalisée
   */
  private async createComplianceChecklist(
    insight: PersonalizedRegulatoryInsight
  ): Promise<PersonalizedChecklistItem[]> {
    const { classifiedData, synthesis, userContext } = insight;
    const checklist: PersonalizedChecklistItem[] = [];

    // Items basés sur la checklist existante
    for (const [index, item] of synthesis.complianceChecklist.entries()) {
      const checklistItem: PersonalizedChecklistItem = {
        id: `checklist-${Date.now()}-${index}`,
        task: item.task,
        required: item.required,
        deadline: item.deadline,
        relatedArticle: item.relatedArticle,
        completed: false,
        category: this.categorizeChecklistItem(item.task),
        estimatedHours: this.estimateChecklistHours(item.task),
        prerequisites: this.identifyPrerequisites(item.task),
        validationCriteria: this.defineValidationCriteria(item.task),
      };
      checklist.push(checklistItem);
    }

    // Items spécifiques aux systèmes impactés
    for (const system of userContext.impactedSystems) {
      checklist.push({
        id: `system-checklist-${system.id}-${Date.now()}`,
        task: `Vérifier la conformité de ${system.name} aux nouvelles exigences`,
        required: true,
        deadline: this.calculateDeadline(userContext.urgencyLevel),
        completed: false,
        category: 'immediate',
        systemId: system.id,
        systemName: system.name,
        estimatedHours: 8,
        prerequisites: ['Documentation système à jour'],
        validationCriteria: ['Tests de conformité passés', 'Audit interne validé'],
      });
    }

    return checklist;
  }

  /**
   * Calcule la timeline des actions basée sur l'urgence
   */
  calculateActionTimeline(
    actions: PersonalizedAction[],
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low'
  ): ActionTimeline {
    const timeline: ActionTimeline = {
      immediate: [],
      short_term: [],
      medium_term: [],
      long_term: [],
    };

    for (const action of actions) {
      // Répartir selon la priorité et l'urgence
      if (action.priority === 'urgent' || urgencyLevel === 'immediate') {
        timeline.immediate.push(action);
      } else if (action.priority === 'high' || urgencyLevel === 'high') {
        timeline.short_term.push(action);
      } else if (action.priority === 'medium' || urgencyLevel === 'medium') {
        timeline.medium_term.push(action);
      } else {
        timeline.long_term.push(action);
      }
    }

    return timeline;
  }

  /**
   * Calcule l'effort estimé total
   */
  private calculateEstimatedEffort(
    priorityActions: PersonalizedAction[],
    systemSpecificActions: Record<string, PersonalizedAction[]>
  ): string {
    const allActions = [
      ...priorityActions,
      ...Object.values(systemSpecificActions).flat()
    ];

    const totalHours = allActions.reduce((sum, action) =>
      sum + (action.estimatedHours || 0), 0
    );

    const days = Math.ceil(totalHours / 8);
    const weeks = Math.ceil(days / 5);

    if (weeks <= 1) {
      return `${days} jour(s) (${totalHours}h)`;
    } else if (weeks <= 4) {
      return `${weeks} semaine(s) (${totalHours}h)`;
    } else {
      const months = Math.ceil(weeks / 4);
      return `${months} mois (${totalHours}h)`;
    }
  }

  /**
   * Estime l'impact budgétaire
   */
  private estimateBudgetImpact(
    insight: PersonalizedRegulatoryInsight,
    actions: PersonalizedAction[]
  ): string {
    const { userContext } = insight;
    const totalHours = actions.reduce((sum, action) => sum + (action.estimatedHours || 0), 0);

    // Estimation basée sur le coût horaire moyen et la complexité
    const hourlyRate = 100; // €/h (à ajuster selon le contexte)
    const complexityMultiplier = userContext.estimatedImpact > 70 ? 1.5 : 1.2;
    const maturityMultiplier = userContext.urgencyLevel === 'immediate' ? 1.3 : 1.0;

    const estimatedCost = totalHours * hourlyRate * complexityMultiplier * maturityMultiplier;

    if (estimatedCost < 5000) {
      return `Faible (< 5k€)`;
    } else if (estimatedCost < 20000) {
      return `Modéré (5-20k€)`;
    } else if (estimatedCost < 50000) {
      return `Élevé (20-50k€)`;
    } else {
      return `Très élevé (> 50k€)`;
    }
  }

  /**
   * Crée un plan de mitigation des risques
   */
  private createRiskMitigationPlan(
    insight: PersonalizedRegulatoryInsight,
    actions: PersonalizedAction[]
  ): RiskMitigationPlan {
    const { userContext, classifiedData } = insight;

    const identifiedRisks = [
      ...userContext.complianceGaps.map(gap => `Risque de non-conformité: ${gap}`),
      ...userContext.maturityGaps.map(gap => `Risque organisationnel: ${gap}`),
    ];

    if (userContext.riskAmplification > 1.5) {
      identifiedRisks.push('Risque d\'amplification élevé dû au profil organisationnel');
    }

    if (userContext.impactedSystems.some(s => s.riskLevel === 'unacceptable')) {
      identifiedRisks.push('Risque critique sur systèmes à risque inacceptable');
    }

    const mitigationActions: PersonalizedAction[] = [
      {
        id: `risk-mitigation-${Date.now()}`,
        description: 'Mise en place d\'un monitoring renforcé des systèmes critiques',
        priority: 'high',
        deadline: this.calculateDeadline('high'),
        status: 'pending',
        category: 'governance',
        impactLevel: 'high',
        estimatedHours: 16,
        requiredSkills: ['Monitoring', 'Gouvernance des risques'],
        dependencies: ['Identification des systèmes critiques'],
      }
    ];

    const contingencyPlans = [
      'Plan de suspension temporaire des systèmes non-conformes',
      'Procédure d\'escalade vers la direction',
      'Communication de crise avec les autorités de régulation',
    ];

    const monitoringRequirements = [
      'Suivi hebdomadaire de l\'avancement des actions',
      'Reporting mensuel à la direction',
      'Audit trimestriel de conformité',
    ];

    return {
      identifiedRisks,
      mitigationActions,
      contingencyPlans,
      monitoringRequirements,
    };
  }

  // Méthodes utilitaires
  private mapPriorityFromUrgency(urgency: string): 'urgent' | 'high' | 'medium' | 'low' {
    switch (urgency) {
      case 'immediate': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private calculateDeadline(urgency: string): Date {
    const now = new Date();
    switch (urgency) {
      case 'immediate': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours
      case 'high': return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 mois
      case 'medium': return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 mois
      default: return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 an
    }
  }

  private categorizeAction(description: string): PersonalizedAction['category'] {
    const desc = description.toLowerCase();
    if (desc.includes('conformité') || desc.includes('audit')) return 'compliance';
    if (desc.includes('documentation') || desc.includes('document')) return 'documentation';
    if (desc.includes('technique') || desc.includes('système')) return 'technical';
    if (desc.includes('gouvernance') || desc.includes('processus')) return 'governance';
    if (desc.includes('formation') || desc.includes('compétence')) return 'training';
    return 'compliance';
  }

  private determineImpactLevel(
    insight: PersonalizedRegulatoryInsight,
    action: Action
  ): PersonalizedAction['impactLevel'] {
    if (insight.userContext.urgencyLevel === 'immediate') return 'critical';
    if (insight.userContext.estimatedImpact > 80) return 'high';
    if (insight.userContext.estimatedImpact > 50) return 'medium';
    return 'low';
  }

  private estimateActionHours(description: string, urgency: string): number {
    const baseHours = description.length > 100 ? 24 : 16;
    const urgencyMultiplier = urgency === 'immediate' ? 1.5 : 1.0;
    return Math.round(baseHours * urgencyMultiplier);
  }

  private identifyRequiredSkills(description: string): string[] {
    const skills: string[] = [];
    const desc = description.toLowerCase();

    if (desc.includes('conformité')) skills.push('Conformité réglementaire');
    if (desc.includes('technique')) skills.push('Expertise technique');
    if (desc.includes('audit')) skills.push('Audit');
    if (desc.includes('documentation')) skills.push('Rédaction technique');
    if (desc.includes('gouvernance')) skills.push('Gouvernance IA');
    if (desc.includes('formation')) skills.push('Formation');

    return skills.length > 0 ? skills : ['Expertise générale'];
  }

  private identifyDependencies(description: string, userContext: any): string[] {
    const dependencies: string[] = [];
    const desc = description.toLowerCase();

    if (desc.includes('révision') || desc.includes('mise à jour')) {
      dependencies.push('Analyse d\'impact préalable');
    }
    if (desc.includes('test') || desc.includes('audit')) {
      dependencies.push('Documentation à jour');
    }
    if (desc.includes('formation')) {
      dependencies.push('Matériel de formation préparé');
    }

    return dependencies;
  }

  private prioritizeActions(actions: PersonalizedAction[]): PersonalizedAction[] {
    return actions.sort((a, b) => {
      // Priorité par urgence
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Puis par impact
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return impactOrder[b.impactLevel] - impactOrder[a.impactLevel];
    });
  }

  private categorizeChecklistItem(task: string): PersonalizedChecklistItem['category'] {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('immédiat') || taskLower.includes('urgent')) return 'immediate';
    if (taskLower.includes('court terme') || taskLower.includes('3 mois')) return 'short_term';
    if (taskLower.includes('moyen terme') || taskLower.includes('6 mois')) return 'medium_term';
    return 'long_term';
  }

  private estimateChecklistHours(task: string): number {
    const taskLower = task.toLowerCase();
    if (taskLower.includes('révision complète') || taskLower.includes('audit')) return 16;
    if (taskLower.includes('documentation') || taskLower.includes('rapport')) return 8;
    if (taskLower.includes('vérification') || taskLower.includes('contrôle')) return 4;
    return 2;
  }

  private identifyPrerequisites(task: string): string[] {
    const prerequisites: string[] = [];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('audit') || taskLower.includes('vérification')) {
      prerequisites.push('Documentation système complète');
    }
    if (taskLower.includes('test')) {
      prerequisites.push('Environnement de test configuré');
    }
    if (taskLower.includes('formation')) {
      prerequisites.push('Identification des participants');
    }

    return prerequisites;
  }

  private defineValidationCriteria(task: string): string[] {
    const criteria: string[] = [];
    const taskLower = task.toLowerCase();

    if (taskLower.includes('conformité')) {
      criteria.push('Validation par audit interne');
      criteria.push('Documentation de preuve');
    }
    if (taskLower.includes('test')) {
      criteria.push('Tests passés avec succès');
      criteria.push('Rapport de test validé');
    }
    if (taskLower.includes('formation')) {
      criteria.push('Évaluation des participants');
      criteria.push('Certificat de formation');
    }

    return criteria.length > 0 ? criteria : ['Validation par responsable'];
  }

  /**
   * Crée un insight actionnable de fallback en cas d'erreur
   */
  private createFallbackActionableInsight(
    insight: PersonalizedRegulatoryInsight
  ): ActionableRegulatoryInsight {
    const fallbackAction: PersonalizedAction = {
      id: `fallback-${Date.now()}`,
      description: 'Analyse manuelle requise pour déterminer les actions spécifiques',
      priority: 'medium',
      deadline: this.calculateDeadline('medium'),
      status: 'pending',
      category: 'compliance',
      impactLevel: 'medium',
      estimatedHours: 8,
      requiredSkills: ['Analyse réglementaire'],
      dependencies: ['Revue détaillée de l\'insight'],
    };

    return {
      ...insight,
      actionPlan: {
        priorityActions: [fallbackAction],
        systemSpecificActions: {},
        complianceChecklist: [{
          id: `fallback-checklist-${Date.now()}`,
          task: 'Effectuer une analyse manuelle de l\'impact réglementaire',
          required: true,
          completed: false,
          category: 'immediate',
          estimatedHours: 4,
          prerequisites: ['Accès aux documents réglementaires'],
          validationCriteria: ['Rapport d\'analyse validé'],
        }],
        timeline: {
          immediate: [],
          short_term: [fallbackAction],
          medium_term: [],
          long_term: [],
        },
        estimatedEffort: '1 jour (8h)',
        budgetImpact: 'Faible (< 5k€)',
        riskMitigation: {
          identifiedRisks: ['Analyse incomplète par manque d\'automatisation'],
          mitigationActions: [fallbackAction],
          contingencyPlans: ['Consultation d\'expert externe'],
          monitoringRequirements: ['Suivi hebdomadaire'],
        },
      },
    };
  }

  /**
   * Envoie les données au prochain agent ou système (communication A2A)
   */
  async sendToNextAgent(
    actionableInsights: ActionableRegulatoryInsight[],
    targetAgentId: string
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      from_agent_id: this.agentCard.agent_id,
      to_agent_id: targetAgentId,
      message_id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      payload: {
        actionableInsights,
        metadata: {
          action_generation_time: new Date(),
          total_count: actionableInsights.length,
          total_actions: actionableInsights.reduce((sum, insight) =>
            sum + insight.actionPlan.priorityActions.length +
            Object.values(insight.actionPlan.systemSpecificActions).flat().length, 0
          ),
          urgent_actions: actionableInsights.reduce((sum, insight) =>
            sum + insight.actionPlan.priorityActions.filter(a => a.priority === 'urgent').length, 0
          ),
        },
      },
    };

    console.log(`📤 Sending ${actionableInsights.length} actionable insights to agent: ${targetAgentId}`);
    return message;
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }

  getStatus(): 'online' | 'offline' | 'maintenance' {
    return this.agentCard.status;
  }
}

export const actionGeneratorAgent = new ActionGeneratorAgent();
