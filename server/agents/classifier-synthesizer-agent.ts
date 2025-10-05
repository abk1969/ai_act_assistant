/**
 * Agent Classificateur & Synthétiseur
 * Classification fine + génération d'insights actionnables
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  AnalyzedUpdate,
  ClassifiedUpdate,
  RegulatoryInsight,
  AgentCard,
  Action,
  ChecklistItem
} from '../types/regulatory-monitoring';
import { storage } from '../storage';

export class ClassifierSynthesizerAgent {
  private claudeModel: ChatAnthropic | null = null;
  private geminiModel: ChatGoogleGenerativeAI | null = null;
  private openaiModel: ChatOpenAI | null = null;

  private agentCard: AgentCard = {
    agent_id: 'regulatory-classifier-synthesizer-001',
    name: 'AI Act Classifier & Insight Generator',
    description: 'Classifies updates and generates actionable insights',
    version: '1.0.0',
    capabilities: [
      {
        action: 'classify_and_synthesize',
        description: 'Full classification and synthesis pipeline',
        input_schema: {
          analyzedUpdates: 'array',
        },
        output_schema: {
          insights: 'array',
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
      const claudeKey = process.env.ANTHROPIC_API_KEY;
      if (claudeKey) {
        this.claudeModel = new ChatAnthropic({
          apiKey: claudeKey,
          modelName: 'claude-3-7-sonnet-20250219',
          temperature: 0.2,
        });
        console.log('✅ Claude model initialized for synthesis');
      }
    } catch (error) {
      console.warn('⚠️ Claude model initialization failed:', error);
    }

    try {
      const geminiKey = process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        this.geminiModel = new ChatGoogleGenerativeAI({
          apiKey: geminiKey,
          modelName: 'gemini-2.0-flash-exp',
          temperature: 0.2,
        });
        console.log('✅ Gemini model initialized for classification');
      }
    } catch (error) {
      console.warn('⚠️ Gemini model initialization failed:', error);
    }
  }

  /**
   * Initialize models based on user's LLM settings
   */
  private async initializeUserModels(userId?: string) {
    if (!userId) {
      // No user ID, use default models from environment
      return;
    }

    try {
      const settings = await storage.getActiveLlmSettings(userId);
      if (!settings || !settings.apiKey) {
        console.warn('⚠️ No active LLM settings for user, using default models');
        return;
      }

      const provider = settings.provider.toLowerCase();
      const temperature = (settings.temperature || 30) / 100;
      const modelName = settings.model;

      console.log(`🔧 Initializing ${provider} model for classification/synthesis (user ${userId})`);

      switch (provider) {
        case 'openai':
          this.openaiModel = new ChatOpenAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gpt-4-turbo-preview',
            temperature,
          });
          console.log(`✅ OpenAI model ${modelName} initialized`);
          break;

        case 'google':
        case 'gemini':
          this.geminiModel = new ChatGoogleGenerativeAI({
            apiKey: settings.apiKey,
            modelName: modelName || 'gemini-2.0-flash-exp',
            temperature,
          });
          console.log(`✅ Gemini model ${modelName} initialized`);
          break;

        case 'anthropic':
          this.claudeModel = new ChatAnthropic({
            apiKey: settings.apiKey,
            modelName: modelName || 'claude-3-7-sonnet-20250219',
            temperature,
          });
          console.log(`✅ Claude model ${modelName} initialized`);
          break;

        default:
          console.warn(`⚠️ Unsupported provider ${provider}, using default models`);
      }
    } catch (error) {
      console.error('❌ Error initializing user models:', error);
    }
  }

  async classifyAndSynthesize(analyzedUpdates: AnalyzedUpdate[], userId?: string): Promise<RegulatoryInsight[]> {
    console.log(`🏷️ Classifying and synthesizing ${analyzedUpdates.length} updates...`);

    // Initialize models based on user settings
    await this.initializeUserModels(userId);

    const insights: RegulatoryInsight[] = [];

    for (const analyzed of analyzedUpdates) {
      try {
        const classified = await this.classifyUpdate(analyzed);
        const insight = await this.synthesizeInsight(classified);
        insights.push(insight);
      } catch (error) {
        console.error(`❌ Failed to process update: ${analyzed.rawData.title}`, error);
      }
    }

    console.log(`✅ Generated ${insights.length} actionable insights`);
    return insights;
  }

  private async classifyUpdate(analyzed: AnalyzedUpdate): Promise<ClassifiedUpdate> {
    const model = this.geminiModel || this.claudeModel;

    if (!model) {
      return this.ruleBasedClassification(analyzed);
    }

    const classificationPrompt = PromptTemplate.fromTemplate(`
Tu es un expert juridique spécialisé dans le Règlement européen sur l'IA (2024/1689).

Classifie finement cette mise à jour réglementaire :

**Document:**
- Titre: {title}
- Source: {source}
- Impact: {impactLevel}
- Pertinence: {relevanceScore}/100
- Stakeholders: {stakeholders}
- Thèmes: {topics}

**Contenu:**
{content}

**Tâches de classification:**

1. **Type de mise à jour:**
   - amendment (amendement au règlement)
   - delegated_act (acte délégué)
   - implementing_act (acte d'exécution)
   - guidance (guidance officielle, FAQ, lignes directrices)
   - faq (questions-réponses officielles)
   - enforcement (décision d'application, sanction)

2. **Domaines impactés** (sélectionne tous les applicables):
   - Annexe I (techniques IA interdites)
   - Annexe III (systèmes haut risque)
   - Annexe IV (documentation technique)
   - GPAI (modèles usage général)
   - Transparence
   - Gouvernance
   - Surveillance marché
   - Sanctions

3. **Acteurs concernés:**
   - providers, deployers, distributors, importers, authorities

4. **Urgence temporelle:**
   - immediate (action < 1 mois)
   - 3_months (1-3 mois)
   - 6_months (3-6 mois)
   - 1_year (6-12 mois)
   - future (>12 mois)

5. **Articles AI Act liés:** Liste les numéros d'articles concernés (ex: ["Article 6", "Article 52"])

6. **Détection de contradiction:** Ce document contredit-il ou modifie-t-il des dispositions existantes? (true/false)

**Réponds en JSON:**

{{
  "updateType": "<type>",
  "impactedDomains": [<array>],
  "concernedActors": [<array>],
  "temporalUrgency": "<urgency>",
  "relatedArticles": [<array>],
  "detectsContradiction": <boolean>,
  "contradictionDetails": "<si applicable>",
  "extractedDates": [<ISO dates>],
  "extractedArticles": [<articles AI Act>],
  "extractedAnnexes": [<annexes>],
  "normativeChanges": [<liste changements>]
}}
`);

    const formattedPrompt = await classificationPrompt.format({
      title: analyzed.rawData.title,
      source: analyzed.rawData.source,
      impactLevel: analyzed.analysis.impactLevel,
      relevanceScore: analyzed.analysis.relevanceScore,
      stakeholders: analyzed.analysis.affectedStakeholders.join(', '),
      topics: analyzed.analysis.keyTopics.join(', '),
      content: analyzed.rawData.rawContent.substring(0, 2000),
    });

    const response = await model.invoke(formattedPrompt);
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return this.ruleBasedClassification(analyzed);
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      analyzedData: analyzed,
      classification: {
        updateType: result.updateType,
        impactedDomains: result.impactedDomains,
        concernedActors: result.concernedActors,
        temporalUrgency: result.temporalUrgency,
        relatedArticles: result.relatedArticles,
        detectsContradiction: result.detectsContradiction,
        contradictionDetails: result.contradictionDetails,
      },
      enrichment: {
        extractedEntities: {
          dates: result.extractedDates.map((d: string) => new Date(d)),
          articles: result.extractedArticles,
          annexes: result.extractedAnnexes,
          organizations: [analyzed.rawData.source],
        },
        linkedAiActArticles: result.relatedArticles,
        normativeChanges: result.normativeChanges,
      },
    };
  }

  private async synthesizeInsight(classified: ClassifiedUpdate): Promise<RegulatoryInsight> {
    const model = this.claudeModel || this.geminiModel;

    if (!model) {
      return this.ruleBasedSynthesis(classified);
    }

    const synthesisPrompt = PromptTemplate.fromTemplate(`
Tu es un consultant senior en conformité IA pour l'AI Act européen.

Génère un insight actionnable pour cette mise à jour :

**Document:** {title}
**Impact:** {impactLevel}
**Type:** {updateType}
**Urgence:** {urgency}
**Acteurs:** {actors}
**Domaines:** {domains}

**Contenu:**
{content}

**Génère un insight structuré:**

1. **Résumé exécutif** (2-3 phrases claires, orientées décision)

2. **Points clés** (3-5 bullets avec l'essentiel)

3. **Implications pratiques** (3-4 impacts concrets pour les organisations)

4. **Actions recommandées** (3-5 actions spécifiques avec priorités)
   Format: {{
     "description": "Action précise",
     "priority": "urgent|high|medium|low",
     "deadline": "ISO date si applicable"
   }}

5. **Checklist de conformité** (3-5 tâches vérifiables)
   Format: {{
     "task": "Tâche spécifique",
     "required": true|false,
     "deadline": "ISO date si applicable",
     "relatedArticle": "Article X si applicable"
   }}

6. **Score d'impact estimé** (0-100): Gravité de l'impact sur une organisation type

**Réponds en JSON:**

{{
  "executiveSummary": "<texte>",
  "keyPoints": [<array>],
  "practicalImplications": [<array>],
  "recommendedActions": [<array objects>],
  "complianceChecklist": [<array objects>],
  "estimatedImpactScore": <number>
}}
`);

    const formattedPrompt = await synthesisPrompt.format({
      title: classified.analyzedData.rawData.title,
      impactLevel: classified.analyzedData.analysis.impactLevel,
      updateType: classified.classification.updateType,
      urgency: classified.classification.temporalUrgency,
      actors: classified.classification.concernedActors.join(', '),
      domains: classified.classification.impactedDomains.join(', '),
      content: classified.analyzedData.rawData.rawContent.substring(0, 2000),
    });

    const response = await model.invoke(formattedPrompt);
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return this.ruleBasedSynthesis(classified);
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      classifiedData: classified,
      synthesis: {
        executiveSummary: result.executiveSummary,
        keyPoints: result.keyPoints,
        practicalImplications: result.practicalImplications,
        recommendedActions: result.recommendedActions.map((action: any, index: number) => ({
          id: `action-${Date.now()}-${index}`,
          description: action.description,
          priority: action.priority,
          deadline: action.deadline ? new Date(action.deadline) : undefined,
          status: 'pending' as const,
        })),
        complianceChecklist: result.complianceChecklist.map((item: any, index: number) => ({
          id: `check-${Date.now()}-${index}`,
          task: item.task,
          required: item.required,
          deadline: item.deadline ? new Date(item.deadline) : undefined,
          relatedArticle: item.relatedArticle,
          completed: false,
        })),
        estimatedImpactScore: result.estimatedImpactScore,
      },
    };
  }

  private ruleBasedClassification(analyzed: AnalyzedUpdate): ClassifiedUpdate {
    const content = analyzed.rawData.rawContent.toLowerCase();

    return {
      analyzedData: analyzed,
      classification: {
        updateType: content.includes('amendement') ? 'amendment' :
                   content.includes('acte délégué') ? 'delegated_act' :
                   content.includes('sanction') ? 'enforcement' : 'guidance',
        impactedDomains: ['Général'],
        concernedActors: analyzed.analysis.affectedStakeholders as any,
        temporalUrgency: analyzed.analysis.impactLevel === 'critical' ? 'immediate' :
                        analyzed.analysis.impactLevel === 'high' ? '3_months' : '6_months',
        relatedArticles: [],
        detectsContradiction: false,
      },
      enrichment: {
        extractedEntities: {
          dates: analyzed.analysis.deadlines,
          articles: [],
          annexes: [],
          organizations: [analyzed.rawData.source],
        },
        linkedAiActArticles: [],
        normativeChanges: [],
      },
    };
  }

  private ruleBasedSynthesis(classified: ClassifiedUpdate): RegulatoryInsight {
    return {
      classifiedData: classified,
      synthesis: {
        executiveSummary: `Nouvelle mise à jour réglementaire de ${classified.analyzedData.rawData.source} nécessitant une revue.`,
        keyPoints: [
          classified.analyzedData.rawData.title,
          `Impact: ${classified.analyzedData.analysis.impactLevel}`,
          `Pertinence: ${classified.analyzedData.analysis.relevanceScore}%`,
        ],
        practicalImplications: [
          'Revue du document source nécessaire',
          'Évaluation de l\'impact sur vos systèmes IA',
        ],
        recommendedActions: [
          {
            id: `action-${Date.now()}`,
            description: 'Lire le document complet',
            priority: 'high',
            status: 'pending',
          },
        ],
        complianceChecklist: [
          {
            id: `check-${Date.now()}`,
            task: 'Analyser l\'applicabilité à vos systèmes',
            required: true,
            completed: false,
          },
        ],
        estimatedImpactScore: classified.analyzedData.analysis.relevanceScore,
      },
    };
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }
}

export const classifierSynthesizerAgent = new ClassifierSynthesizerAgent();
