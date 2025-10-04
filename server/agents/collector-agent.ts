/**
 * Agent Collecteur - Data Collector Agent
 * Collecte automatisée depuis sources officielles via MCP servers
 */

import { RawRegulatoryData, AgentCard, AgentMessage } from '../types/regulatory-monitoring';
import { eurlexServer } from '../mcp/eurlex-server';
import { cnilServer } from '../mcp/cnil-server';
import { ecAIOfficeServer } from '../mcp/ec-aioffice-server';

export class CollectorAgent {
  private agentCard: AgentCard = {
    agent_id: 'regulatory-collector-001',
    name: 'EU AI Act Data Collector',
    description: 'Collects regulatory updates from official EU and national sources',
    version: '1.0.0',
    capabilities: [
      {
        action: 'collect_all_sources',
        description: 'Collect updates from all configured sources',
        input_schema: {
          daysBack: 'number',
          sources: 'array',
        },
        output_schema: {
          updates: 'array',
          sourceStatus: 'object',
        },
      },
      {
        action: 'collect_eurlex',
        description: 'Collect from EUR-Lex',
        input_schema: { daysBack: 'number' },
        output_schema: { updates: 'array' },
      },
      {
        action: 'collect_cnil',
        description: 'Collect from CNIL',
        input_schema: { limit: 'number' },
        output_schema: { updates: 'array' },
      },
      {
        action: 'collect_ec_aioffice',
        description: 'Collect from EC AI Office',
        input_schema: { limit: 'number' },
        output_schema: { updates: 'array' },
      },
    ],
    communication: {
      protocols: ['http', 'sse'],
      formats: ['json'],
    },
    status: 'online',
  };

  async collectAllSources(params: {
    daysBack?: number;
    sources?: string[];
  }): Promise<{
    updates: RawRegulatoryData[];
    sourceStatus: Record<string, { success: boolean; count: number; error?: string }>;
  }> {
    const daysBack = params.daysBack || 7;
    const enabledSources = params.sources || ['eurlex', 'cnil', 'ec-ai-office'];

    const allUpdates: RawRegulatoryData[] = [];
    const sourceStatus: Record<string, { success: boolean; count: number; error?: string }> = {};

    // Collect from EUR-Lex
    if (enabledSources.includes('eurlex')) {
      try {
        console.log('📚 Collecting from EUR-Lex...');
        const eurlexUpdates = await eurlexServer.getRecentAIActUpdates(daysBack);
        allUpdates.push(...eurlexUpdates);
        sourceStatus['eurlex'] = {
          success: true,
          count: eurlexUpdates.length,
        };
        console.log(`✅ EUR-Lex: ${eurlexUpdates.length} updates`);
      } catch (error) {
        sourceStatus['eurlex'] = {
          success: false,
          count: 0,
          error: String(error),
        };
        console.error('❌ EUR-Lex collection failed:', error);
      }
    }

    // Collect from CNIL
    if (enabledSources.includes('cnil')) {
      try {
        console.log('🔒 Collecting from CNIL...');
        const cnilNews = await cnilServer.getCNILAINews(10);
        const cnilRecommendations = await cnilServer.getCNILRecommendations();
        const cnilSanctions = await cnilServer.checkCNILSanctions(daysBack);

        const cnilUpdates = [...cnilNews, ...cnilRecommendations, ...cnilSanctions];
        allUpdates.push(...cnilUpdates);
        sourceStatus['cnil'] = {
          success: true,
          count: cnilUpdates.length,
        };
        console.log(`✅ CNIL: ${cnilUpdates.length} updates`);
      } catch (error) {
        sourceStatus['cnil'] = {
          success: false,
          count: 0,
          error: String(error),
        };
        console.error('❌ CNIL collection failed:', error);
      }
    }

    // Collect from EC AI Office
    if (enabledSources.includes('ec-ai-office')) {
      try {
        console.log('🇪🇺 Collecting from EC AI Office...');
        const aiOfficeUpdates = await ecAIOfficeServer.getAIOfficeUpdates(10);
        const codesOfConduct = await ecAIOfficeServer.getCodesOfConduct();
        const aiBoardDecisions = await ecAIOfficeServer.getAIBoardDecisions(daysBack);

        const ecUpdates = [...aiOfficeUpdates, ...codesOfConduct, ...aiBoardDecisions];
        allUpdates.push(...ecUpdates);
        sourceStatus['ec-ai-office'] = {
          success: true,
          count: ecUpdates.length,
        };
        console.log(`✅ EC AI Office: ${ecUpdates.length} updates`);
      } catch (error) {
        sourceStatus['ec-ai-office'] = {
          success: false,
          count: 0,
          error: String(error),
        };
        console.error('❌ EC AI Office collection failed:', error);
      }
    }

    // Deduplicate by URL
    const uniqueUpdates = Array.from(
      new Map(allUpdates.map(item => [item.url, item])).values()
    );

    console.log(`\n📊 Collection Summary:`);
    console.log(`   Total collected: ${allUpdates.length}`);
    console.log(`   Unique updates: ${uniqueUpdates.length}`);
    console.log(`   Duplicates removed: ${allUpdates.length - uniqueUpdates.length}`);

    return {
      updates: uniqueUpdates,
      sourceStatus,
    };
  }

  async sendToNextAgent(updates: RawRegulatoryData[], targetAgentId: string): Promise<AgentMessage> {
    const message: AgentMessage = {
      from_agent_id: this.agentCard.agent_id,
      to_agent_id: targetAgentId,
      message_id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      payload: {
        updates,
        metadata: {
          collection_time: new Date(),
          total_count: updates.length,
        },
      },
    };

    console.log(`📤 Sending ${updates.length} updates to agent: ${targetAgentId}`);
    return message;
  }

  getAgentCard(): AgentCard {
    return this.agentCard;
  }

  getStatus(): 'online' | 'offline' | 'maintenance' {
    return this.agentCard.status;
  }
}

export const collectorAgent = new CollectorAgent();
