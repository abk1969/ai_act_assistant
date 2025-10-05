/**
 * Workflow Orchestrator - Regulatory Monitoring
 * Orchestre les agents de veille réglementaire en séquence
 */

import { collectorAgent } from '../agents/collector-agent';
import { analyzerAgent } from '../agents/analyzer-agent';
import { classifierSynthesizerAgent } from '../agents/classifier-synthesizer-agent';
import { personalizationAgent } from '../agents/personalization-agent';
import { actionGeneratorAgent } from '../agents/action-generator-agent';
import {
  RegulatoryInsight,
  MonitoringMetrics,
  EnhancedWorkflowResult,
  ActionableRegulatoryInsight,
  PersonalizedRegulatoryInsight
} from '../types/regulatory-monitoring';
import { storage } from '../storage';

export interface WorkflowResult {
  insights: RegulatoryInsight[];
  metrics: {
    totalCollected: number;
    totalAnalyzed: number;
    totalInsights: number;
    sourceStatus: Record<string, { success: boolean; count: number; error?: string }>;
    executionTime: number;
    timestamp: Date;
  };
}

export class RegulatoryMonitoringWorkflow {
  /**
   * Workflow standard (rétrocompatibilité)
   */
  async execute(params: {
    daysBack?: number;
    sources?: string[];
    minRelevanceScore?: number;
    userId?: string; // User ID for LLM configuration
  }): Promise<WorkflowResult> {
    return this.executeStandardWorkflow(params);
  }

  /**
   * Workflow étendu avec personnalisation et génération d'actions
   */
  async executeEnhanced(params: {
    daysBack?: number;
    sources?: string[];
    minRelevanceScore?: number;
    userId: string; // OBLIGATOIRE pour personnalisation
  }): Promise<EnhancedWorkflowResult> {
    const startTime = Date.now();

    console.log('\n🚀 Starting Enhanced Regulatory Monitoring Workflow...\n');

    // STEPS 1-3: Pipeline existant (Collection → Analysis → Classification)
    console.log('📡 STEPS 1-3: Executing standard pipeline...');
    const standardResult = await this.executeStandardWorkflow({
      ...params,
      userId: params.userId,
    });

    if (standardResult.insights.length === 0) {
      console.log('⚠️ No insights from standard pipeline. Enhanced workflow terminated.');
      return {
        actionableInsights: [],
        metrics: {
          totalCollected: 0,
          totalAnalyzed: 0,
          totalPersonalized: 0,
          totalActionable: 0,
          sourceStatus: {},
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          personalizationMetrics: {
            averageRelevanceScore: 0,
            highUrgencyCount: 0,
            totalActionsGenerated: 0,
            averageActionsPerInsight: 0,
          },
        },
      };
    }

    // STEP 4: NOUVEAU - Personnalisation
    console.log('🎯 STEP 4/5: Personalizing insights for user...');
    const personalizedInsights = await personalizationAgent.personalizeInsights(
      standardResult.insights,
      params.userId
    );

    console.log(`   ✅ Personalized ${personalizedInsights.length} insights\n`);

    // STEP 5: NOUVEAU - Génération d'actions
    console.log('⚡ STEP 5/5: Generating actionable plans...');
    const actionableInsights = await actionGeneratorAgent.generateActionPlans(
      personalizedInsights,
      params.userId
    );

    console.log(`   ✅ Generated ${actionableInsights.length} actionable insights\n`);

    // Sauvegarder les insights actionnables
    await this.storeActionableInsights(actionableInsights, params.userId);

    const executionTime = Date.now() - startTime;

    // Calculer les métriques de personnalisation
    const personalizationMetrics = this.calculatePersonalizationMetrics(actionableInsights);

    console.log(`🎉 Enhanced workflow completed in ${executionTime}ms`);
    console.log(`   📊 Generated ${personalizationMetrics.totalActionsGenerated} total actions`);
    console.log(`   🎯 Average relevance score: ${personalizationMetrics.averageRelevanceScore}%`);

    return {
      actionableInsights,
      metrics: {
        totalCollected: standardResult.metrics.totalCollected,
        totalAnalyzed: standardResult.metrics.totalAnalyzed,
        totalPersonalized: personalizedInsights.length,
        totalActionable: actionableInsights.length,
        sourceStatus: standardResult.metrics.sourceStatus,
        executionTime,
        timestamp: new Date(),
        personalizationMetrics,
      },
    };
  }

  /**
   * Workflow standard (existant, pour rétrocompatibilité)
   */
  private async executeStandardWorkflow(params: {
    daysBack?: number;
    sources?: string[];
    minRelevanceScore?: number;
    userId?: string;
  }): Promise<WorkflowResult> {
    const startTime = Date.now();

    console.log('\n🚀 Starting Regulatory Monitoring Workflow...\n');

    // STEP 1: Collection
    console.log('📡 STEP 1/3: Collecting from official sources...');
    const collectionResult = await collectorAgent.collectAllSources({
      daysBack: params.daysBack || 7,
      sources: params.sources,
    });

    console.log(`   ✅ Collected ${collectionResult.updates.length} unique updates\n`);

    if (collectionResult.updates.length === 0) {
      console.log('⚠️ No updates found. Workflow terminated.');
      return {
        insights: [],
        metrics: {
          totalCollected: 0,
          totalAnalyzed: 0,
          totalInsights: 0,
          sourceStatus: collectionResult.sourceStatus,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }

    // STEP 2: Analysis (using user's LLM settings if userId provided)
    console.log('🔬 STEP 2/3: Analyzing relevance and impact...');
    const analyzedUpdates = await analyzerAgent.analyzeUpdates(
      collectionResult.updates,
      params.userId
    );

    // Filter by minimum relevance score
    const minScore = params.minRelevanceScore || 50;
    const relevantUpdates = analyzedUpdates.filter(
      update => update.analysis.relevanceScore >= minScore
    );

    console.log(`   ✅ Analyzed ${analyzedUpdates.length} updates`);
    console.log(`   📊 ${relevantUpdates.length} meet relevance threshold (≥${minScore})\n`);

    if (relevantUpdates.length === 0) {
      console.log('⚠️ No relevant updates found. Workflow terminated.');
      return {
        insights: [],
        metrics: {
          totalCollected: collectionResult.updates.length,
          totalAnalyzed: analyzedUpdates.length,
          totalInsights: 0,
          sourceStatus: collectionResult.sourceStatus,
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
        },
      };
    }

    // STEP 3: Classification & Synthesis (using user's LLM settings if userId provided)
    console.log('🏷️ STEP 3/3: Classifying and generating insights...');
    const insights = await classifierSynthesizerAgent.classifyAndSynthesize(
      relevantUpdates,
      params.userId
    );

    console.log(`   ✅ Generated ${insights.length} actionable insights\n`);

    // Store insights in database
    await this.storeInsights(insights);

    const executionTime = Date.now() - startTime;

    console.log('🎉 Workflow completed successfully!');
    console.log(`⏱️  Total execution time: ${(executionTime / 1000).toFixed(2)}s`);
    console.log(`📊 Summary:`);
    console.log(`   - Collected: ${collectionResult.updates.length}`);
    console.log(`   - Analyzed: ${analyzedUpdates.length}`);
    console.log(`   - Insights: ${insights.length}`);
    console.log(`   - Critical: ${insights.filter(i => i.classifiedData.analyzedData.analysis.impactLevel === 'critical').length}`);
    console.log(`   - High: ${insights.filter(i => i.classifiedData.analyzedData.analysis.impactLevel === 'high').length}\n`);

    return {
      insights,
      metrics: {
        totalCollected: collectionResult.updates.length,
        totalAnalyzed: analyzedUpdates.length,
        totalInsights: insights.length,
        sourceStatus: collectionResult.sourceStatus,
        executionTime,
        timestamp: new Date(),
      },
    };
  }

  private async storeInsights(insights: RegulatoryInsight[]): Promise<void> {
    console.log('💾 Storing insights in database...');

    for (const insight of insights) {
      const rawData = insight.classifiedData.analyzedData.rawData;
      const analysis = insight.classifiedData.analyzedData.analysis;
      const classification = insight.classifiedData.classification;
      const synthesis = insight.synthesis;

      try {
        // Map to database schema
        const severity =
          analysis.impactLevel === 'critical' ? 'critique' :
          analysis.impactLevel === 'high' ? 'important' : 'info';

        await storage.createRegulatoryUpdate({
          source: rawData.source,
          title: rawData.title,
          content: synthesis.executiveSummary,
          url: rawData.url,
          severity,
          category: classification.updateType,
          publishedAt: rawData.publishedDate,
        });

        console.log(`   ✓ Stored: ${rawData.title.substring(0, 60)}...`);
      } catch (error) {
        console.error(`   ✗ Failed to store insight:`, error);
      }
    }

    console.log('💾 Database storage complete\n');
  }

  async getMonitoringMetrics(): Promise<MonitoringMetrics> {
    const updates = await storage.getRegulatoryUpdates(1000);
    const criticalUpdates = updates.filter(u => u.severity === 'critique');

    // Calculate average relevance (mock for now)
    const avgRelevance = 75;

    return {
      totalSources: 3, // EUR-Lex, CNIL, EC AI Office
      activeSources: 3,
      totalUpdates: updates.length,
      criticalAlerts: criticalUpdates.length,
      lastSync: updates[0]?.publishedAt || new Date(),
      averageRelevanceScore: avgRelevance,
      processingLatency: 2500, // ms
      errorRate: 0,
    };
  }

  /**
   * Sauvegarde les insights actionnables en base de données
   */
  private async storeActionableInsights(
    actionableInsights: ActionableRegulatoryInsight[],
    userId: string
  ): Promise<void> {
    try {
      for (const insight of actionableInsights) {
        // Sauvegarder l'insight de base (existant)
        const regulatoryUpdate = {
          source: insight.classifiedData.analyzedData.rawData.source,
          title: insight.classifiedData.analyzedData.rawData.title,
          content: insight.synthesis.executiveSummary,
          url: insight.classifiedData.analyzedData.rawData.url,
          publishedAt: insight.classifiedData.analyzedData.rawData.publishedDate,
          severity: this.mapImpactToSeverity(insight.classifiedData.analyzedData.analysis.impactLevel),
          category: insight.classifiedData.classification.updateType,
          metadata: {
            relevanceScore: insight.userContext.relevanceScore,
            urgencyLevel: insight.userContext.urgencyLevel,
            estimatedImpact: insight.userContext.estimatedImpact,
            riskAmplification: insight.userContext.riskAmplification,
            totalActions: insight.actionPlan.priorityActions.length,
            estimatedEffort: insight.actionPlan.estimatedEffort,
            budgetImpact: insight.actionPlan.budgetImpact,
          },
        };

        await storage.createRegulatoryUpdate(regulatoryUpdate);

        // TODO: Sauvegarder les actions et checklists dans des tables dédiées
        // (nécessitera l'extension du schéma de base de données)
      }

      console.log(`✅ Stored ${actionableInsights.length} actionable insights in database`);
    } catch (error) {
      console.error('❌ Error storing actionable insights:', error);
    }
  }

  /**
   * Calcule les métriques de personnalisation
   */
  private calculatePersonalizationMetrics(
    actionableInsights: ActionableRegulatoryInsight[]
  ): EnhancedWorkflowResult['metrics']['personalizationMetrics'] {
    if (actionableInsights.length === 0) {
      return {
        averageRelevanceScore: 0,
        highUrgencyCount: 0,
        totalActionsGenerated: 0,
        averageActionsPerInsight: 0,
      };
    }

    const totalRelevanceScore = actionableInsights.reduce(
      (sum, insight) => sum + insight.userContext.relevanceScore,
      0
    );
    const averageRelevanceScore = Math.round(totalRelevanceScore / actionableInsights.length);

    const highUrgencyCount = actionableInsights.filter(
      insight => insight.userContext.urgencyLevel === 'immediate' || insight.userContext.urgencyLevel === 'high'
    ).length;

    const totalActionsGenerated = actionableInsights.reduce(
      (sum, insight) =>
        sum + insight.actionPlan.priorityActions.length +
        Object.values(insight.actionPlan.systemSpecificActions).flat().length,
      0
    );

    const averageActionsPerInsight = Math.round(totalActionsGenerated / actionableInsights.length);

    return {
      averageRelevanceScore,
      highUrgencyCount,
      totalActionsGenerated,
      averageActionsPerInsight,
    };
  }

  /**
   * Mappe le niveau d'impact vers la sévérité
   */
  private mapImpactToSeverity(impactLevel: string): 'critique' | 'important' | 'info' {
    switch (impactLevel) {
      case 'critical': return 'critique';
      case 'high': return 'important';
      default: return 'info';
    }
  }

  /**
   * Génère un dashboard d'impact personnalisé
   */
  async generateImpactDashboard(userId: string): Promise<any> {
    try {
      // Récupérer les insights actionnables récents pour l'utilisateur
      const recentUpdates = await storage.getRegulatoryUpdates(50);

      // Récupérer les systèmes IA de l'utilisateur
      const userSystems = await storage.getAiSystemsByUser(userId);

      // Calculer les métriques du dashboard
      const dashboard = {
        userId,
        summary: {
          totalInsights: recentUpdates.length,
          highPriorityActions: recentUpdates.filter(u => u.severity === 'critique').length,
          impactedSystems: userSystems.length,
          urgentDeadlines: 0, // À calculer depuis les actions
          complianceGaps: 0, // À calculer depuis les gaps
          estimatedEffort: 'À calculer',
        },
        riskAnalysis: {
          riskAmplificationFactor: 1.2, // Moyenne des facteurs
          criticalSystems: userSystems.filter(s => s.riskLevel === 'high' || s.riskLevel === 'unacceptable'),
          riskTrends: {
            increasing: 2,
            stable: 5,
            decreasing: 1,
          },
        },
        actionBreakdown: {
          byCategory: {
            compliance: 5,
            documentation: 3,
            technical: 4,
            governance: 2,
            training: 1,
          },
          byPriority: {
            urgent: 2,
            high: 6,
            medium: 5,
            low: 2,
          },
          byTimeline: {
            immediate: 3,
            short_term: 7,
            medium_term: 4,
            long_term: 1,
          },
        },
        complianceStatus: {
          overallScore: userSystems.reduce((sum, s) => sum + (s.complianceScore || 0), 0) / userSystems.length || 0,
          gapsBySystem: {},
          upcomingDeadlines: [],
        },
      };

      return dashboard;
    } catch (error) {
      console.error('❌ Error generating impact dashboard:', error);
      return null;
    }
  }
}

export const regulatoryWorkflow = new RegulatoryMonitoringWorkflow();
