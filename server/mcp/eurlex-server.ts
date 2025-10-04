/**
 * MCP Server pour EUR-Lex
 * Source officielle de la législation européenne
 */

import { MCPServerConfig, MCPTool, RawRegulatoryData } from '../types/regulatory-monitoring';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class EURLexMCPServer {
  private config: MCPServerConfig = {
    name: 'eurlex-ai-act-monitor',
    version: '1.0.0',
    description: 'MCP Server for EUR-Lex AI Act monitoring',
    endpoint: 'https://eur-lex.europa.eu',
    capabilities: {
      resources: true,
      tools: true,
      prompts: false,
    },
    tools: [
      {
        name: 'search_eurlex',
        description: 'Search EUR-Lex for AI Act related documents',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            dateFrom: { type: 'string', format: 'date' },
            dateTo: { type: 'string', format: 'date' },
            documentTypes: { type: 'array', items: { type: 'string' } },
          },
          required: ['query'],
        },
      },
      {
        name: 'fetch_document',
        description: 'Fetch full legal document from EUR-Lex',
        inputSchema: {
          type: 'object',
          properties: {
            celex: { type: 'string' },
            language: { type: 'string', default: 'FR' },
          },
          required: ['celex'],
        },
      },
      {
        name: 'get_recent_ai_act_updates',
        description: 'Get recent documents related to AI Act (Regulation 2024/1689)',
        inputSchema: {
          type: 'object',
          properties: {
            daysBack: { type: 'number', default: 7 },
            includeAmendments: { type: 'boolean', default: true },
          },
        },
      },
    ],
  };

  async searchEURLex(params: {
    query: string;
    dateFrom?: string;
    dateTo?: string;
    documentTypes?: string[];
  }): Promise<RawRegulatoryData[]> {
    try {
      // EUR-Lex Search API endpoint
      const searchUrl = 'https://eur-lex.europa.eu/search.html';

      const searchParams = new URLSearchParams({
        qid: '1',
        text: params.query,
        type: 'advanced',
        lang: 'fr',
        ...(params.dateFrom && { 'DD_year-from': params.dateFrom }),
        ...(params.dateTo && { 'DD_year-to': params.dateTo }),
      });

      const response = await axios.get(`${searchUrl}?${searchParams.toString()}`, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const results: RawRegulatoryData[] = [];

      // Parse search results
      $('.SearchResult').each((_, element) => {
        const $el = $(element);
        const title = $el.find('.title a').text().trim();
        const url = $el.find('.title a').attr('href') || '';
        const celex = this.extractCelexFromUrl(url);
        const dateStr = $el.find('.date').text().trim();
        const docType = $el.find('.documentType').text().trim().toLowerCase();

        if (title && url) {
          results.push({
            sourceId: 'eurlex',
            source: 'EUR-Lex',
            url: url.startsWith('http') ? url : `https://eur-lex.europa.eu${url}`,
            title,
            rawContent: $el.find('.summary').text().trim(),
            publishedDate: this.parseDate(dateStr),
            documentType: this.mapDocumentType(docType),
            language: 'FR',
            metadata: {
              celex,
            },
          });
        }
      });

      return results;
    } catch (error) {
      console.error('EUR-Lex search error:', error);
      return [];
    }
  }

  async fetchDocument(celex: string, language: string = 'FR'): Promise<RawRegulatoryData | null> {
    try {
      const docUrl = `https://eur-lex.europa.eu/legal-content/${language}/TXT/?uri=CELEX:${celex}`;

      const response = await axios.get(docUrl, {
        headers: {
          'User-Agent': 'AI-Act-Navigator/1.0 (Compliance Monitoring)',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);

      const title = $('h1.title').first().text().trim() ||
                    $('.titreFichier').first().text().trim();
      const content = $('#text').text().trim() ||
                     $('.texte').text().trim();
      const dateStr = $('.dateDocument').text().trim();

      return {
        sourceId: 'eurlex',
        source: 'EUR-Lex',
        url: docUrl,
        title,
        rawContent: content,
        publishedDate: this.parseDate(dateStr),
        documentType: 'regulation',
        language,
        metadata: {
          celex,
        },
      };
    } catch (error) {
      console.error(`EUR-Lex fetch document error for ${celex}:`, error);
      return null;
    }
  }

  async getRecentAIActUpdates(daysBack: number = 7): Promise<RawRegulatoryData[]> {
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);

    // Search for AI Act related documents
    const queries = [
      'intelligence artificielle 2024/1689',
      'AI Act',
      'règlement IA',
      'acte délégué intelligence artificielle',
    ];

    const allResults: RawRegulatoryData[] = [];

    for (const query of queries) {
      const results = await this.searchEURLex({
        query,
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
      });
      allResults.push(...results);
    }

    // Deduplicate by URL
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    );

    return uniqueResults;
  }

  private extractCelexFromUrl(url: string): string | undefined {
    const match = url.match(/CELEX:([A-Z0-9]+)/);
    return match ? match[1] : undefined;
  }

  private parseDate(dateStr: string): Date {
    // EUR-Lex uses various date formats, try to parse
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private mapDocumentType(docType: string): any {
    const mapping: Record<string, any> = {
      'règlement': 'regulation',
      'directive': 'directive',
      'décision': 'decision',
      'recommandation': 'guidance',
      'communication': 'guidance',
      'orientation': 'guidance',
    };

    for (const [key, value] of Object.entries(mapping)) {
      if (docType.includes(key)) {
        return value;
      }
    }

    return 'regulation';
  }

  getConfig(): MCPServerConfig {
    return this.config;
  }
}

export const eurlexServer = new EURLexMCPServer();
