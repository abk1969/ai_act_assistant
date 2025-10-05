/**
 * Agent de Personnalisation - Personalization Agent
 * Croise les insights réglementaires avec le profil utilisateur
 * (systèmes IA, maturité organisationnelle, état de conformité)
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { 
  RegulatoryInsight, 
  AgentCard, 
  AgentMessage,
  ImpactLevel 
} from '../types/regulatory-monitoring';
import { 
  AiSystem, 
  MaturityAssessment, 
  ComplianceRecord 
} from '@shared/schema';
import { storage } from '../storage';
import { llmService } from '../services/llmService';

// Nouveaux types pour la personnalisation
export interface PersonalizedRegulatoryInsight extends RegulatoryInsight {
  userContext: {
    impactedSystems: AiSystem[];
    relevanceScore: number; // 0-100 personnalisé
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low';
    maturityGaps: string[];
    complianceGaps: string[];
    estimatedImpact: number; // 0-100
    riskAmplification: number; // Facteur d'amplification du risque
  };
}

export interface UserContext {
  userId: string;
  aiSystems: AiSystem[];
  maturityAssessment?: MaturityAssessment;
  complianceRecords: ComplianceRecord[];
  organizationProfile: {
    sector?: string;
    maturityLevel: string;
    riskTolerance: 'low' | 'medium' | 'high';
    complianceScore: number;
  };
}

export class PersonalizationAgent {
  private geminiModel: ChatGoogleGenerativeAI | null = null;
  private claudeModel: ChatAnthropic | null = null;
  private openaiModel: ChatOpenAI | null = null;

  private agentCard: AgentCard = {
    agent_id: 'regulatory-personalizer-001',
    name: 'User Context Personalizer',
    description: 'Personalizes regulatory insights based on user profile and AI systems',
    version: '1.0.0',
    capabilities: [
      {
        action: 'personalize_insights',
        description: 'Cross-reference insights with user systems and maturity',
        input_schema: {
          insights: 'array',
          userId: 'string',
        },
        output_schema: {
          personalizedInsights: 'array',
        },
      },
      {
        action: 'calculate_user_relevance',
        description: 'Calculate personalized relevance score for an insight',
        input_schema: {
          insight: 'object',
          userContext: 'object',
        },
        output_schema: {
          relevanceScore: 'number',
          reasoning: 'string',
        },
      },
      {
        action: 'identify_impacted_systems',
        description: 'Identify which user AI systems are impacted by regulatory change',
        input_schema: {
          insight: 'object',
          aiSystems: 'array',
        },
        output_schema: {
          impactedSystems: 'array',
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
          temperature: 0.2,
        });
        console.log('✅ Gemini model initialized for personalization');
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
          temperature: 0.2,
        });
        console.log('✅ Claude model initialized for complex personalization');
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

      const { provider, modelName, temperature = 0.2 } = settings;

      switch (provider) {
        case 'openai':
          this.openaiModel = new ChatOpenAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gpt-4-turbo-preview',
            temperature,
          });
          console.log(`✅ OpenAI model ${modelName} initialized for personalization`);
          break;

        case 'google':
        case 'gemini':
          this.geminiModel = new ChatGoogleGenerativeAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gemini-2.0-flash-exp',
            temperature,
          });
          console.log(`✅ Gemini model ${modelName} initialized for personalization`);
          break;

        case 'anthropic':
          this.claudeModel = new ChatAnthropic({
            apiKey: settings.apiKey,
            modelName: modelName || 'claude-3-7-sonnet-20250219',
            temperature,
          });
          console.log(`✅ Claude model ${modelName} initialized for personalization`);
          break;

        default:
          console.warn(`⚠️ Unsupported provider ${provider}, using default models`);
      }
    } catch (error) {
      console.error('❌ Error initializing user models:', error);
    }
  }

  /**
   * Méthode principale : personnalise les insights pour un utilisateur
   */
  async personalizeInsights(
    insights: RegulatoryInsight[], 
    userId: string
  ): Promise<PersonalizedRegulatoryInsight[]> {
    console.log(`🎯 Personalizing ${insights.length} insights for user ${userId}...`);

    // Initialize models based on user settings
    await this.initializeUserModels(userId);

    // Récupérer le contexte utilisateur
    const userContext = await this.getUserContext(userId);
    
    if (!userContext) {
      console.warn('⚠️ No user context found, returning generic insights');
      return this.createGenericPersonalizedInsights(insights);
    }

    const personalizedInsights: PersonalizedRegulatoryInsight[] = [];

    for (const insight of insights) {
      try {
        const personalizedInsight = await this.personalizeInsight(insight, userContext);
        personalizedInsights.push(personalizedInsight);
      } catch (error) {
        console.error(`❌ Failed to personalize insight: ${insight.classifiedData.analyzedData.rawData.title}`, error);
        // Fallback: créer une version générique
        personalizedInsights.push(this.createFallbackPersonalizedInsight(insight, userContext));
      }
    }

    // Trier par score de pertinence personnalisé
    personalizedInsights.sort((a, b) => b.userContext.relevanceScore - a.userContext.relevanceScore);

    console.log(`✅ Generated ${personalizedInsights.length} personalized insights`);
    return personalizedInsights;
  }

  /**
   * Récupère le contexte complet de l'utilisateur
   */
  private async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      // Récupérer les systèmes IA de l'utilisateur
      const aiSystems = await storage.getAiSystemsByUser(userId);
      
      // Récupérer la dernière évaluation de maturité
      const maturityAssessments = await storage.getMaturityAssessmentsByUser(userId);
      const latestMaturity = maturityAssessments[0]; // Le plus récent
      
      // Récupérer les enregistrements de conformité
      const complianceRecords = await storage.getComplianceRecordsByUser(userId);

      // Calculer le profil organisationnel
      const organizationProfile = this.calculateOrganizationProfile(
        aiSystems, 
        latestMaturity, 
        complianceRecords
      );

      return {
        userId,
        aiSystems,
        maturityAssessment: latestMaturity,
        complianceRecords,
        organizationProfile,
      };
    } catch (error) {
      console.error('❌ Error fetching user context:', error);
      return null;
    }
  }

  /**
   * Calcule le profil organisationnel basé sur les données utilisateur
   */
  private calculateOrganizationProfile(
    aiSystems: AiSystem[],
    maturityAssessment?: MaturityAssessment,
    complianceRecords: ComplianceRecord[] = []
  ) {
    // Secteur le plus fréquent
    const sectors = aiSystems.map(s => s.sector).filter(Boolean);
    const sector = sectors.length > 0 ? 
      sectors.reduce((a, b, _, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      ) : undefined;

    // Niveau de maturité
    const maturityLevel = maturityAssessment?.overallMaturity || 'initial';

    // Tolérance au risque basée sur les systèmes IA
    const highRiskSystems = aiSystems.filter(s => s.riskLevel === 'high' || s.riskLevel === 'unacceptable').length;
    const totalSystems = aiSystems.length;
    const riskRatio = totalSystems > 0 ? highRiskSystems / totalSystems : 0;
    
    const riskTolerance: 'low' | 'medium' | 'high' = 
      riskRatio > 0.5 ? 'high' : 
      riskRatio > 0.2 ? 'medium' : 'low';

    // Score de conformité moyen
    const complianceScores = aiSystems.map(s => s.complianceScore || 0).filter(s => s > 0);
    const complianceScore = complianceScores.length > 0 ? 
      complianceScores.reduce((a, b) => a + b, 0) / complianceScores.length : 0;

    return {
      sector,
      maturityLevel,
      riskTolerance,
      complianceScore,
    };
  }

  /**
   * Personnalise un insight spécifique pour l'utilisateur
   */
  private async personalizeInsight(
    insight: RegulatoryInsight,
    userContext: UserContext
  ): Promise<PersonalizedRegulatoryInsight> {
    // 1. Identifier les systèmes impactés
    const impactedSystems = await this.identifyImpactedSystems(insight, userContext.aiSystems);

    // 2. Calculer le score de pertinence personnalisé
    const relevanceScore = await this.calculateUserRelevance(insight, userContext);

    // 3. Déterminer le niveau d'urgence
    const urgencyLevel = this.calculateUrgencyLevel(insight, userContext, impactedSystems);

    // 4. Détecter les gaps de maturité
    const maturityGaps = this.detectMaturityGaps(insight, userContext);

    // 5. Détecter les gaps de conformité
    const complianceGaps = await this.detectComplianceGaps(insight, userContext);

    // 6. Calculer l'impact estimé
    const estimatedImpact = this.calculateEstimatedImpact(insight, userContext, impactedSystems);

    // 7. Calculer le facteur d'amplification du risque
    const riskAmplification = this.calculateRiskAmplification(insight, userContext, impactedSystems);

    return {
      ...insight,
      userContext: {
        impactedSystems,
        relevanceScore,
        urgencyLevel,
        maturityGaps,
        complianceGaps,
        estimatedImpact,
        riskAmplification,
      },
    };
  }

  /**
   * Identifie les systèmes IA de l'utilisateur impactés par le changement réglementaire
   */
  async identifyImpactedSystems(
    insight: RegulatoryInsight,
    aiSystems: AiSystem[]
  ): Promise<AiSystem[]> {
    if (aiSystems.length === 0) return [];

    const impactedSystems: AiSystem[] = [];
    const { classifiedData } = insight;
    const { classification, enrichment } = classifiedData;

    for (const system of aiSystems) {
      let isImpacted = false;

      // Vérifier par niveau de risque
      if (classification.concernedActors.includes('providers') && system.riskLevel) {
        const systemRiskLevels = ['high', 'unacceptable'];
        if (systemRiskLevels.includes(system.riskLevel)) {
          isImpacted = true;
        }
      }

      // Vérifier par secteur
      if (system.sector && classification.impactedDomains.some(domain =>
        domain.toLowerCase().includes(system.sector?.toLowerCase() || '')
      )) {
        isImpacted = true;
      }

      // Vérifier par articles AI Act liés
      if (enrichment.linkedAiActArticles.length > 0) {
        // Si le système a des enregistrements de conformité pour ces articles
        isImpacted = true;
      }

      // Vérifier par mots-clés dans la description du système
      const systemKeywords = [
        system.name.toLowerCase(),
        system.description?.toLowerCase() || '',
        system.sector?.toLowerCase() || ''
      ].join(' ');

      const insightKeywords = [
        ...classifiedData.analyzedData.analysis.keyTopics,
        ...classification.impactedDomains
      ].map(k => k.toLowerCase());

      if (insightKeywords.some(keyword => systemKeywords.includes(keyword))) {
        isImpacted = true;
      }

      if (isImpacted) {
        impactedSystems.push(system);
      }
    }

    return impactedSystems;
  }

  /**
   * Calcule un score de pertinence personnalisé (0-100)
   */
  async calculateUserRelevance(
    insight: RegulatoryInsight,
    userContext: UserContext
  ): Promise<number> {
    const { aiSystems, organizationProfile } = userContext;
    const { classifiedData } = insight;

    let relevanceScore = classifiedData.analyzedData.analysis.relevanceScore; // Score de base

    // Facteur 1: Nombre de systèmes impactés (0-30 points)
    const impactedSystems = await this.identifyImpactedSystems(insight, aiSystems);
    const systemImpactBonus = Math.min(30, (impactedSystems.length / aiSystems.length) * 30);

    // Facteur 2: Correspondance secteur (0-20 points)
    const sectorBonus = organizationProfile.sector &&
      classifiedData.classification.impactedDomains.some(domain =>
        domain.toLowerCase().includes(organizationProfile.sector!.toLowerCase())
      ) ? 20 : 0;

    // Facteur 3: Niveau de risque organisationnel (0-20 points)
    const riskBonus = organizationProfile.riskTolerance === 'high' ? 20 :
                     organizationProfile.riskTolerance === 'medium' ? 10 : 0;

    // Facteur 4: Maturité organisationnelle (0-15 points)
    const maturityPenalty = organizationProfile.maturityLevel === 'initial' ? -15 :
                           organizationProfile.maturityLevel === 'developing' ? -10 :
                           organizationProfile.maturityLevel === 'defined' ? -5 : 0;

    // Facteur 5: Score de conformité actuel (0-15 points)
    const complianceBonus = organizationProfile.complianceScore < 50 ? 15 :
                           organizationProfile.complianceScore < 80 ? 10 : 5;

    relevanceScore = Math.max(0, Math.min(100,
      relevanceScore + systemImpactBonus + sectorBonus + riskBonus + maturityPenalty + complianceBonus
    ));

    return Math.round(relevanceScore);
  }

  /**
   * Détermine le niveau d'urgence basé sur le contexte utilisateur
   */
  private calculateUrgencyLevel(
    insight: RegulatoryInsight,
    userContext: UserContext,
    impactedSystems: AiSystem[]
  ): 'immediate' | 'high' | 'medium' | 'low' {
    const { classification } = insight.classifiedData;
    const { organizationProfile } = userContext;

    // Urgence immédiate si:
    if (
      classification.temporalUrgency === 'immediate' ||
      (impactedSystems.some(s => s.riskLevel === 'unacceptable') &&
       classification.updateType === 'amendment')
    ) {
      return 'immediate';
    }

    // Urgence élevée si:
    if (
      classification.temporalUrgency === '3_months' ||
      (impactedSystems.length > 0 && organizationProfile.maturityLevel === 'initial') ||
      (impactedSystems.some(s => s.riskLevel === 'high') &&
       organizationProfile.complianceScore < 60)
    ) {
      return 'high';
    }

    // Urgence moyenne si:
    if (
      classification.temporalUrgency === '6_months' ||
      impactedSystems.length > 0
    ) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Détecte les gaps de maturité organisationnelle
   */
  private detectMaturityGaps(
    insight: RegulatoryInsight,
    userContext: UserContext
  ): string[] {
    const gaps: string[] = [];
    const { organizationProfile, maturityAssessment } = userContext;
    const { classification } = insight.classifiedData;

    // Gap de gouvernance si changement de gouvernance et maturité faible
    if (
      classification.impactedDomains.some(d => d.toLowerCase().includes('governance')) &&
      organizationProfile.maturityLevel === 'initial'
    ) {
      gaps.push('Gouvernance IA insuffisante pour les nouvelles exigences');
    }

    // Gap de documentation si nouvelles obligations documentaires
    if (
      classification.updateType === 'implementing_act' &&
      organizationProfile.maturityLevel !== 'optimizing'
    ) {
      gaps.push('Processus de documentation à renforcer');
    }

    // Gap de monitoring si nouvelles exigences de surveillance
    if (
      classification.impactedDomains.some(d => d.toLowerCase().includes('monitoring')) &&
      ['initial', 'developing'].includes(organizationProfile.maturityLevel)
    ) {
      gaps.push('Capacités de monitoring à développer');
    }

    // Gap de formation si nouvelles compétences requises
    if (
      classification.concernedActors.includes('providers') &&
      organizationProfile.maturityLevel === 'initial'
    ) {
      gaps.push('Formation des équipes sur les nouvelles exigences');
    }

    return gaps;
  }

  /**
   * Détecte les gaps de conformité spécifiques
   */
  async detectComplianceGaps(
    insight: RegulatoryInsight,
    userContext: UserContext
  ): Promise<string[]> {
    const gaps: string[] = [];
    const { aiSystems, complianceRecords } = userContext;
    const { enrichment } = insight.classifiedData;

    // Vérifier les articles AI Act liés
    for (const articleId of enrichment.linkedAiActArticles) {
      // Chercher les systèmes qui devraient être conformes à cet article
      const relevantSystems = aiSystems.filter(system => {
        // Logique pour déterminer si le système doit être conforme à cet article
        return system.riskLevel === 'high' || system.riskLevel === 'unacceptable';
      });

      for (const system of relevantSystems) {
        // Vérifier si il y a un enregistrement de conformité pour ce système/article
        const complianceRecord = complianceRecords.find(
          record => record.aiSystemId === system.id && record.articleId === articleId
        );

        if (!complianceRecord) {
          gaps.push(`Conformité manquante: ${system.name} - Article ${articleId}`);
        } else if (!complianceRecord.compliant) {
          gaps.push(`Non-conformité détectée: ${system.name} - Article ${articleId}`);
        }
      }
    }

    return gaps;
  }

  /**
   * Calcule l'impact estimé (0-100)
   */
  private calculateEstimatedImpact(
    insight: RegulatoryInsight,
    userContext: UserContext,
    impactedSystems: AiSystem[]
  ): number {
    const { organizationProfile } = userContext;
    const { synthesis } = insight;

    let impact = synthesis.estimatedImpactScore; // Score de base

    // Amplifier selon le nombre de systèmes impactés
    const systemMultiplier = Math.min(2.0, 1 + (impactedSystems.length * 0.2));
    impact *= systemMultiplier;

    // Amplifier selon la maturité (moins mature = plus d'impact)
    const maturityMultiplier = organizationProfile.maturityLevel === 'initial' ? 1.5 :
                              organizationProfile.maturityLevel === 'developing' ? 1.3 :
                              organizationProfile.maturityLevel === 'defined' ? 1.1 : 1.0;
    impact *= maturityMultiplier;

    // Amplifier selon le score de conformité actuel
    const complianceMultiplier = organizationProfile.complianceScore < 50 ? 1.4 :
                                organizationProfile.complianceScore < 80 ? 1.2 : 1.0;
    impact *= complianceMultiplier;

    return Math.min(100, Math.round(impact));
  }

  /**
   * Calcule le facteur d'amplification du risque
   */
  private calculateRiskAmplification(
    insight: RegulatoryInsight,
    userContext: UserContext,
    impactedSystems: AiSystem[]
  ): number {
    const { organizationProfile } = userContext;

    let amplification = 1.0;

    // Amplification selon les systèmes à haut risque impactés
    const highRiskSystems = impactedSystems.filter(s =>
      s.riskLevel === 'high' || s.riskLevel === 'unacceptable'
    ).length;
    amplification += highRiskSystems * 0.3;

    // Amplification selon la maturité organisationnelle
    const maturityAmplification = organizationProfile.maturityLevel === 'initial' ? 0.5 :
                                 organizationProfile.maturityLevel === 'developing' ? 0.3 :
                                 organizationProfile.maturityLevel === 'defined' ? 0.1 : 0;
    amplification += maturityAmplification;

    // Amplification selon la tolérance au risque
    const riskToleranceAmplification = organizationProfile.riskTolerance === 'low' ? 0.4 :
                                      organizationProfile.riskTolerance === 'medium' ? 0.2 : 0;
    amplification += riskToleranceAmplification;

    return Math.round(amplification * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * Crée des insights personnalisés génériques (fallback)
   */
  private createGenericPersonalizedInsights(
    insights: RegulatoryInsight[]
  ): PersonalizedRegulatoryInsight[] {
    return insights.map(insight => ({
      ...insight,
      userContext: {
        impactedSystems: [],
        relevanceScore: insight.classifiedData.analyzedData.analysis.relevanceScore,
        urgencyLevel: 'medium' as const,
        maturityGaps: ['Évaluation de maturité requise pour personnalisation'],
        complianceGaps: ['Systèmes IA requis pour analyse de conformité'],
        estimatedImpact: insight.synthesis.estimatedImpactScore,
        riskAmplification: 1.0,
      },
    }));
  }

  /**
   * Crée un insight personnalisé de fallback en cas d'erreur
   */
  private createFallbackPersonalizedInsight(
    insight: RegulatoryInsight,
    userContext: UserContext
  ): PersonalizedRegulatoryInsight {
    return {
      ...insight,
      userContext: {
        impactedSystems: userContext.aiSystems, // Considérer tous les systèmes par sécurité
        relevanceScore: Math.max(50, insight.classifiedData.analyzedData.analysis.relevanceScore),
        urgencyLevel: 'medium',
        maturityGaps: ['Analyse détaillée requise'],
        complianceGaps: ['Vérification manuelle nécessaire'],
        estimatedImpact: insight.synthesis.estimatedImpactScore,
        riskAmplification: 1.2, // Légèrement conservateur
      },
    };
  }

  /**
   * Envoie les données au prochain agent (communication A2A)
   */
  async sendToNextAgent(
    personalizedInsights: PersonalizedRegulatoryInsight[],
    targetAgentId: string
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      from_agent_id: this.agentCard.agent_id,
      to_agent_id: targetAgentId,
      message_id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      payload: {
        personalizedInsights,
        metadata: {
          personalization_time: new Date(),
          total_count: personalizedInsights.length,
          high_relevance_count: personalizedInsights.filter(i => i.userContext.relevanceScore >= 70).length,
        },
      },
    };

    console.log(`📤 Sending ${personalizedInsights.length} personalized insights to agent: ${targetAgentId}`);
    return message;
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }

  getStatus(): 'online' | 'offline' | 'maintenance' {
    return this.agentCard.status;
  }
}

export const personalizationAgent = new PersonalizationAgent();
