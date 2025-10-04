/**
 * Agent Analyseur - Analysis Agent
 * Évalue la pertinence et la criticité des mises à jour réglementaires
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { RawRegulatoryData, AnalyzedUpdate, AgentCard, ImpactLevel } from '../types/regulatory-monitoring';
import { llmService } from '../services/llmService';

export class AnalyzerAgent {
  private geminiModel: ChatGoogleGenerativeAI | null = null;
  private claudeModel: ChatAnthropic | null = null;

  private agentCard: AgentCard = {
    agent_id: 'regulatory-analyzer-001',
    name: 'AI Act Regulatory Analyzer',
    description: 'Analyzes regulatory updates for relevance, criticality, and impact',
    version: '1.0.0',
    capabilities: [
      {
        action: 'analyze_updates',
        description: 'Analyze regulatory updates using LLM',
        input_schema: {
          updates: 'array',
        },
        output_schema: {
          analyzed: 'array',
        },
      },
      {
        action: 'assess_relevance',
        description: 'Assess AI Act relevance of a document',
        input_schema: {
          document: 'object',
        },
        output_schema: {
          relevanceScore: 'number',
          reasoning: 'string',
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
      // Try to get Gemini API key from LLM settings
      const geminiKey = process.env.GOOGLE_API_KEY;
      if (geminiKey) {
        this.geminiModel = new ChatGoogleGenerativeAI({
          apiKey: geminiKey,
          modelName: 'gemini-2.0-flash-exp',
          temperature: 0.1,
        });
        console.log('✅ Gemini model initialized for analysis');
      }
    } catch (error) {
      console.warn('⚠️ Gemini model initialization failed:', error);
    }

    try {
      // Try to get Claude API key
      const claudeKey = process.env.ANTHROPIC_API_KEY;
      if (claudeKey) {
        this.claudeModel = new ChatAnthropic({
          apiKey: claudeKey,
          modelName: 'claude-3-7-sonnet-20250219',
          temperature: 0.1,
        });
        console.log('✅ Claude model initialized for complex analysis');
      }
    } catch (error) {
      console.warn('⚠️ Claude model initialization failed:', error);
    }
  }

  async analyzeUpdates(updates: RawRegulatoryData[]): Promise<AnalyzedUpdate[]> {
    console.log(`🔬 Analyzing ${updates.length} regulatory updates...`);
    const analyzed: AnalyzedUpdate[] = [];

    for (const update of updates) {
      try {
        const analysis = await this.analyzeUpdate(update);
        analyzed.push(analysis);
      } catch (error) {
        console.error(`❌ Failed to analyze update: ${update.title}`, error);
        // Create fallback analysis
        analyzed.push(this.createFallbackAnalysis(update));
      }
    }

    // Sort by relevance score
    analyzed.sort((a, b) => b.analysis.relevanceScore - a.analysis.relevanceScore);

    console.log(`✅ Analysis complete: ${analyzed.length} updates analyzed`);
    return analyzed;
  }

  private async analyzeUpdate(update: RawRegulatoryData): Promise<AnalyzedUpdate> {
    const model = this.geminiModel || this.claudeModel;

    if (!model) {
      // Fallback to rule-based analysis if no LLM available
      return this.ruleBasedAnalysis(update);
    }

    const analysisPrompt = PromptTemplate.fromTemplate(`
Tu es un expert en réglementation européenne sur l'intelligence artificielle, spécialisé dans le Règlement (UE) 2024/1689 (AI Act).

Analyse le document réglementaire suivant et fournis une évaluation détaillée :

**Source:** {source}
**Titre:** {title}
**Type de document:** {documentType}
**Date de publication:** {publishedDate}
**Contenu:**
{content}

**Instructions d'analyse:**

1. **Pertinence AI Act (0-100):** Évalue à quel point ce document est pertinent pour le Règlement IA.
   - 90-100: Directement lié au Règlement IA (amendements, actes délégués, guidance officielle)
   - 70-89: Très pertinent (impacts significatifs sur la conformité)
   - 50-69: Modérément pertinent (contexte réglementaire lié)
   - 0-49: Faible pertinence

2. **Niveau d'impact:** Évalue l'impact sur les stakeholders (critical/high/medium/low)
   - critical: Changements obligatoires immédiats, sanctions, interdictions
   - high: Nouvelles obligations, délais courts, changements significatifs
   - medium: Guidance, recommandations, délais longs
   - low: Informationnel, pas d'action requise

3. **Stakeholders affectés:** Identifie les acteurs concernés parmi:
   - providers (fournisseurs)
   - deployers (déployeurs)
   - distributors (distributeurs)
   - importers (importateurs)
   - authorities (autorités)
   - all (tous)

4. **Thèmes clés:** Identifie 3-5 thèmes principaux (ex: "systèmes haut risque", "GPAI", "transparence", "sanctions")

5. **Délais:** Extrais toutes les dates limites mentionnées

6. **Action requise:** Détermine si une action immédiate est requise (true/false)

7. **Score de confiance (0-100):** Ton niveau de confiance dans cette analyse

**Réponds UNIQUEMENT en JSON valide:**

{{
  "relevanceScore": <number 0-100>,
  "aiActRelevance": <boolean>,
  "impactLevel": "<critical|high|medium|low>",
  "affectedStakeholders": [<array of strings>],
  "keyTopics": [<array of 3-5 strings>],
  "deadlines": [<array of ISO date strings>],
  "actionRequired": <boolean>,
  "confidenceScore": <number 0-100>,
  "reasoning": "<brief explanation 2-3 sentences>"
}}
`);

    const formattedPrompt = await analysisPrompt.format({
      source: update.source,
      title: update.title,
      documentType: update.documentType,
      publishedDate: update.publishedDate.toISOString().split('T')[0],
      content: update.rawContent.substring(0, 3000), // Limit content length
    });

    const response = await model.invoke(formattedPrompt);
    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return {
      rawData: update,
      analysis: {
        relevanceScore: analysisResult.relevanceScore,
        aiActRelevance: analysisResult.aiActRelevance,
        impactLevel: analysisResult.impactLevel as ImpactLevel,
        affectedStakeholders: analysisResult.affectedStakeholders,
        keyTopics: analysisResult.keyTopics,
        deadlines: analysisResult.deadlines.map((d: string) => new Date(d)),
        actionRequired: analysisResult.actionRequired,
        confidenceScore: analysisResult.confidenceScore,
      },
    };
  }

  private ruleBasedAnalysis(update: RawRegulatoryData): AnalyzedUpdate {
    const title = update.title.toLowerCase();
    const content = update.rawContent.toLowerCase();
    const combined = `${title} ${content}`;

    // Rule-based relevance scoring
    let relevanceScore = 0;

    // AI Act specific keywords
    const aiActKeywords = ['2024/1689', 'ai act', "règlement ia", "intelligence artificielle"];
    const highPriorityKeywords = ['amendement', 'acte délégué', 'sanction', 'interdiction', 'obligation'];
    const stakeholderKeywords = ['fournisseur', 'déployeur', 'provider', 'deployer', 'haut risque', 'high risk'];

    aiActKeywords.forEach(keyword => {
      if (combined.includes(keyword)) relevanceScore += 30;
    });

    highPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) relevanceScore += 15;
    });

    stakeholderKeywords.forEach(keyword => {
      if (combined.includes(keyword)) relevanceScore += 10;
    });

    relevanceScore = Math.min(100, relevanceScore);

    // Determine impact level
    let impactLevel: ImpactLevel = 'low';
    if (combined.includes('sanction') || combined.includes('interdiction') || combined.includes('obligation immédiate')) {
      impactLevel = 'critical';
    } else if (combined.includes('obligation') || combined.includes('conformité') || combined.includes('haut risque')) {
      impactLevel = 'high';
    } else if (combined.includes('recommandation') || combined.includes('guidance')) {
      impactLevel = 'medium';
    }

    // Identify stakeholders
    const affectedStakeholders: string[] = [];
    if (combined.includes('fournisseur') || combined.includes('provider')) affectedStakeholders.push('providers');
    if (combined.includes('déployeur') || combined.includes('deployer')) affectedStakeholders.push('deployers');
    if (combined.includes('distributeur')) affectedStakeholders.push('distributors');
    if (combined.includes('importateur')) affectedStakeholders.push('importers');
    if (combined.includes('autorité')) affectedStakeholders.push('authorities');
    if (affectedStakeholders.length === 0) affectedStakeholders.push('all');

    // Extract topics
    const keyTopics: string[] = [];
    if (combined.includes('haut risque') || combined.includes('high risk')) keyTopics.push('Systèmes à haut risque');
    if (combined.includes('gpai') || combined.includes('usage général')) keyTopics.push('GPAI');
    if (combined.includes('transparence')) keyTopics.push('Transparence');
    if (combined.includes('sanction')) keyTopics.push('Sanctions');
    if (combined.includes('conformité')) keyTopics.push('Conformité');
    if (keyTopics.length === 0) keyTopics.push('Général');

    return {
      rawData: update,
      analysis: {
        relevanceScore,
        aiActRelevance: relevanceScore >= 50,
        impactLevel,
        affectedStakeholders,
        keyTopics,
        deadlines: [],
        actionRequired: impactLevel === 'critical' || impactLevel === 'high',
        confidenceScore: 60, // Lower confidence for rule-based
      },
    };
  }

  private createFallbackAnalysis(update: RawRegulatoryData): AnalyzedUpdate {
    return {
      rawData: update,
      analysis: {
        relevanceScore: 50,
        aiActRelevance: true,
        impactLevel: 'medium',
        affectedStakeholders: ['all'],
        keyTopics: ['Non analysé'],
        deadlines: [],
        actionRequired: false,
        confidenceScore: 30,
      },
    };
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }
}

export const analyzerAgent = new AnalyzerAgent();
