/**
 * MCP Server pour Commission Européenne - AI Office
 * Source officielle pour les politiques et guidelines IA UE
 */

import { MCPServerConfig, RawRegulatoryData } from '../types/regulatory-monitoring';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class ECAIOfficeServer {
  private config: MCPServerConfig = {
    name: 'ec-ai-office-monitor',
    version: '1.0.0',
    description: 'MCP Server for European Commission AI Office monitoring',
    endpoint: 'https://digital-strategy.ec.europa.eu',
    capabilities: {
      resources: true,
      tools: true,
      prompts: false,
    },
    tools: [
      {
        name: 'get_ai_office_updates',
        description: 'Fetch latest updates from EC AI Office',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
          },
        },
      },
      {
        name: 'get_codes_of_conduct',
        description: 'Retrieve AI codes of conduct and guidelines',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
        },
      },
      {
        name: 'get_ai_board_decisions',
        description: 'Get European AI Board decisions and opinions',
        inputSchema: {
          type: 'object',
          properties: {
            daysBack: { type: 'number', default: 30 },
          },
        },
      },
    ],
  };

  async getAIOfficeUpdates(limit: number = 10): Promise<RawRegulatoryData[]> {
    try {
      const aiOfficeUrl = 'https://digital-strategy.ec.europa.eu/en/policies/ai-office';

      const response = await axios.get(aiOfficeUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse news and updates
      $('.ecl-content-item, .ecl-news-item').slice(0, limit).each((_, element) => {
        const $el = $(element);
        const title = $el.find('.ecl-content-item__title, h3').first().text().trim();
        const url = $el.find('a').first().attr('href') || '';
        const description = $el.find('.ecl-content-item__description, .ecl-content-item__excerpt').text().trim();
        const dateStr = $el.find('.ecl-content-item__meta-item--date, time').first().text().trim();

        if (title && url) {
          results.push({
            sourceId: 'ec-ai-office',
            source: 'Commission Européenne - AI Office',
            url: url.startsWith('http') ? url : `https://digital-strategy.ec.europa.eu${url}`,
            title,
            rawContent: description,
            publishedDate: this.parseDate(dateStr),
            documentType: 'guidance',
            language: 'EN',
            metadata: {
              keywords: ['AI Office', 'Commission Européenne', 'EU AI Act'],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('EC AI Office updates fetch error:', error);
      return [];
    }
  }

  async getCodesOfConduct(topic?: string): Promise<RawRegulatoryData[]> {
    try {
      const codesUrl = 'https://digital-strategy.ec.europa.eu/en/library/ai-act-code-practice-general-purpose-ai-models';

      const response = await axios.get(codesUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse code of conduct documents
      $('.ecl-file, .ecl-content-item').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.ecl-file__title, h3').text().trim();
        const url = $el.find('a').attr('href') || '';
        const description = $el.find('.ecl-file__meta, .description').text().trim();

        const matchesTopic = !topic || title.toLowerCase().includes(topic.toLowerCase()) ||
                            description.toLowerCase().includes(topic.toLowerCase());

        if (title && url && matchesTopic) {
          results.push({
            sourceId: 'ec-ai-office',
            source: 'Commission Européenne - AI Office',
            url: url.startsWith('http') ? url : `https://digital-strategy.ec.europa.eu${url}`,
            title,
            rawContent: description,
            publishedDate: new Date(),
            documentType: 'guidance',
            language: 'EN',
            metadata: {
              keywords: ['code of conduct', 'GPAI', 'AI Act'],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('EC codes of conduct fetch error:', error);
      return [];
    }
  }

  async getAIBoardDecisions(daysBack: number = 30): Promise<RawRegulatoryData[]> {
    try {
      const boardUrl = 'https://digital-strategy.ec.europa.eu/en/policies/european-ai-board';

      const response = await axios.get(boardUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Parse AI Board decisions
      $('.ecl-content-item, .decision-item').each((_, element) => {
        const $el = $(element);
        const title = $el.find('h3, h4').text().trim();
        const url = $el.find('a').attr('href') || '';
        const content = $el.find('.description, .summary').text().trim();
        const dateStr = $el.find('.date, time').text().trim();
        const publishedDate = this.parseDate(dateStr);

        if (title && url && publishedDate >= cutoffDate) {
          results.push({
            sourceId: 'ec-ai-board',
            source: 'European AI Board',
            url: url.startsWith('http') ? url : `https://digital-strategy.ec.europa.eu${url}`,
            title,
            rawContent: content,
            publishedDate,
            documentType: 'guidance',
            language: 'EN',
            metadata: {
              keywords: ['AI Board', 'decision', 'opinion'],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('AI Board decisions fetch error:', error);
      return [];
    }
  }

  private parseDate(dateStr: string): Date {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }
}

export const ecAIOfficeServer = new ECAIOfficeServer();
