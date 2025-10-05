/**
 * Workflow Orchestrator - Regulatory Monitoring
 * Orchestre les agents de veille réglementaire en séquence
 */

import { collectorAgent } from '../agents/collector-agent';
import { analyzerAgent } from '../agents/analyzer-agent';
import { classifierSynthesizerAgent } from '../agents/classifier-synthesizer-agent';
import { RegulatoryInsight, MonitoringMetrics } from '../types/regulatory-monitoring';
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
  async execute(params: {
    daysBack?: number;
    sources?: string[];
    minRelevanceScore?: number;
    userId?: string; // User ID for LLM configuration
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
}

export const regulatoryWorkflow = new RegulatoryMonitoringWorkflow();
