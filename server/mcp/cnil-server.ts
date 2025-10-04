/**
 * MCP Server pour CNIL
 * Commission Nationale de l'Informatique et des Libertés (France)
 */

import { MCPServerConfig, RawRegulatoryData } from '../types/regulatory-monitoring';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class CNILMCPServer {
  private config: MCPServerConfig = {
    name: 'cnil-ai-monitor',
    version: '1.0.0',
    description: 'MCP Server for CNIL AI and GDPR monitoring',
    endpoint: 'https://www.cnil.fr',
    capabilities: {
      resources: true,
      tools: true,
      prompts: false,
    },
    tools: [
      {
        name: 'get_cnil_ai_news',
        description: 'Fetch latest AI-related news from CNIL',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
          },
        },
      },
      {
        name: 'get_cnil_recommendations',
        description: 'Get CNIL recommendations on AI and data protection',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
          },
        },
      },
      {
        name: 'check_cnil_sanctions',
        description: 'Check for recent CNIL sanctions related to AI',
        inputSchema: {
          type: 'object',
          properties: {
            daysBack: { type: 'number', default: 30 },
          },
        },
      },
    ],
  };

  async getCNILAINews(limit: number = 10): Promise<RawRegulatoryData[]> {
    try {
      // CNIL AI-related news page
      const newsUrl = 'https://www.cnil.fr/fr/intelligence-artificielle';

      const response = await axios.get(newsUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse news items
      $('.node--type-actualite, .node--type-article').slice(0, limit).each((_, element) => {
        const $el = $(element);
        const title = $el.find('h2, h3').first().text().trim();
        const url = $el.find('a').first().attr('href') || '';
        const summary = $el.find('.field--name-field-summary, .summary').text().trim();
        const dateStr = $el.find('.date-display-single, time').first().text().trim();

        if (title && url) {
          results.push({
            sourceId: 'cnil',
            source: 'CNIL',
            url: url.startsWith('http') ? url : `https://www.cnil.fr${url}`,
            title,
            rawContent: summary,
            publishedDate: this.parseDate(dateStr),
            documentType: 'guidance',
            language: 'FR',
            metadata: {
              keywords: ['CNIL', 'protection des données', 'IA'],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('CNIL news fetch error:', error);
      return [];
    }
  }

  async getCNILRecommendations(topic?: string): Promise<RawRegulatoryData[]> {
    try {
      const searchUrl = 'https://www.cnil.fr/fr/recherche';
      const searchQuery = topic ? `intelligence artificielle ${topic}` : 'intelligence artificielle recommandations';

      const response = await axios.get(searchUrl, {
        params: {
          search_api_fulltext: searchQuery,
          type: 'recommandation',
        },
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      $('.search-result').each((_, element) => {
        const $el = $(element);
        const title = $el.find('h3').text().trim();
        const url = $el.find('a').attr('href') || '';
        const content = $el.find('.search-snippet').text().trim();
        const dateStr = $el.find('.date').text().trim();

        if (title && url) {
          results.push({
            sourceId: 'cnil',
            source: 'CNIL',
            url: url.startsWith('http') ? url : `https://www.cnil.fr${url}`,
            title,
            rawContent: content,
            publishedDate: this.parseDate(dateStr),
            documentType: 'guidance',
            language: 'FR',
            metadata: {
              keywords: topic ? [topic] : [],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('CNIL recommendations fetch error:', error);
      return [];
    }
  }

  async checkCNILSanctions(daysBack: number = 30): Promise<RawRegulatoryData[]> {
    try {
      const sanctionsUrl = 'https://www.cnil.fr/fr/sanctions';

      const response = await axios.get(sanctionsUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      $('.sanction-item, .node--type-sanction').each((_, element) => {
        const $el = $(element);
        const title = $el.find('h3, h2').text().trim();
        const url = $el.find('a').attr('href') || '';
        const content = $el.find('.description, .summary').text().trim();
        const dateStr = $el.find('.date').text().trim();
        const publishedDate = this.parseDate(dateStr);

        // Filter by AI-related content and date
        const isAIRelated = title.toLowerCase().includes('intelligence artificielle') ||
                           title.toLowerCase().includes('ia ') ||
                           content.toLowerCase().includes('intelligence artificielle');

        if (title && url && isAIRelated && publishedDate >= cutoffDate) {
          results.push({
            sourceId: 'cnil',
            source: 'CNIL',
            url: url.startsWith('http') ? url : `https://www.cnil.fr${url}`,
            title,
            rawContent: content,
            publishedDate,
            documentType: 'decision',
            language: 'FR',
            metadata: {
              keywords: ['sanction', 'IA', 'CNIL'],
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('CNIL sanctions check error:', error);
      return [];
    }
  }

  private parseDate(dateStr: string): Date {
    // Try to parse French date format
    const frenchMonths: Record<string, number> = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
      'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
      'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11,
    };

    const match = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (match) {
      const day = parseInt(match[1]);
      const month = frenchMonths[match[2].toLowerCase()];
      const year = parseInt(match[3]);
      if (month !== undefined) {
        return new Date(year, month, day);
      }
    }

    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }
}

export const cnilServer = new CNILMCPServer();
