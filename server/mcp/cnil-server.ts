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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse items from the view container
      $('.view .views-row').slice(0, limit).each((_, element) => {
        const $el = $(element);
        const title = $el.find('h2, h3').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';
        const summary = $el.find('p, .description, .summary').first().text().trim();

        if (title && link && title.length > 10) {
          results.push({
            sourceId: `cnil-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: 'CNIL',
            url: link.startsWith('http') ? link : `https://www.cnil.fr${link}`,
            title,
            rawContent: summary || `Recommandation CNIL: ${title}`,
            publishedDate: new Date(), // CNIL doesn't show dates on listing page
            documentType: 'guidance',
            language: 'FR',
            metadata: {
              keywords: ['CNIL', 'protection des données', 'IA'],
              source: 'cnil-ai-page',
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
      // Same source as news - CNIL doesn't separate recommendations from news on their AI page
      const aiPageUrl = 'https://www.cnil.fr/fr/intelligence-artificielle';

      const response = await axios.get(aiPageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse items from the view container
      $('.view .views-row').slice(0, 5).each((_, element) => {
        const $el = $(element);
        const title = $el.find('h2, h3').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';
        const content = $el.find('p, .description, .summary').first().text().trim();

        // Filter by topic if provided
        const matchesTopic = !topic ||
          title.toLowerCase().includes(topic.toLowerCase()) ||
          content.toLowerCase().includes(topic.toLowerCase());

        // Only include items with "recommandation" or "guide" in title
        const isRecommendation =
          title.toLowerCase().includes('recommandation') ||
          title.toLowerCase().includes('guide') ||
          title.toLowerCase().includes('garantir');

        if (title && link && matchesTopic && isRecommendation && title.length > 10) {
          results.push({
            sourceId: `cnil-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: 'CNIL',
            url: link.startsWith('http') ? link : `https://www.cnil.fr${link}`,
            title,
            rawContent: content || `Recommandation CNIL: ${title}`,
            publishedDate: new Date(),
            documentType: 'guidance',
            language: 'FR',
            metadata: {
              keywords: topic ? [topic, 'CNIL', 'IA', 'recommandation'] : ['CNIL', 'IA', 'recommandation'],
              source: 'cnil-recommendations',
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('CNIL recommendations fetch error:', error);
      // Graceful degradation - return empty array instead of failing
      return [];
    }
  }

  async checkCNILSanctions(daysBack: number = 30): Promise<RawRegulatoryData[]> {
    try {
      // Check the AI page for sanction mentions
      const aiNewsUrl = 'https://www.cnil.fr/fr/intelligence-artificielle';

      const response = await axios.get(aiNewsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Look for sanction-related items in the views
      $('.view .views-row').each((_, element) => {
        const $el = $(element);
        const title = $el.find('h2, h3').first().text().trim();
        const link = $el.find('a').first().attr('href') || '';
        const content = $el.find('p, .description, .summary').first().text().trim();

        // Filter by sanction-related content
        const isSanctionRelated =
          title.toLowerCase().includes('sanction') ||
          title.toLowerCase().includes('amende') ||
          title.toLowerCase().includes('condamnation') ||
          title.toLowerCase().includes('mise en demeure') ||
          content.toLowerCase().includes('sanction');

        if (title && link && isSanctionRelated && title.length > 10) {
          results.push({
            sourceId: `cnil-sanction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: 'CNIL',
            url: link.startsWith('http') ? link : `https://www.cnil.fr${link}`,
            title,
            rawContent: content || `Sanction CNIL: ${title}`,
            publishedDate: new Date(), // CNIL doesn't show dates on listing
            documentType: 'decision',
            language: 'FR',
            metadata: {
              keywords: ['sanction', 'IA', 'CNIL'],
              source: 'cnil-sanctions',
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('CNIL sanctions check error:', error);
      // Graceful degradation
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
