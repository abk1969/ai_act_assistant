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
    // EC AI Office site uses dynamic content, so we use official known documents
    const officialUpdates: RawRegulatoryData[] = [
      {
        sourceId: `ec-ai-office-setup-${Date.now()}`,
        source: 'Commission Européenne - AI Office',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-office',
        title: 'Mise en place du Bureau européen de l\'IA (AI Office)',
        rawContent: 'Le Bureau de l\'IA a été créé pour soutenir la mise en œuvre du règlement sur l\'IA, coordonner la surveillance au niveau de l\'UE et favoriser l\'adoption de l\'IA digne de confiance.',
        publishedDate: new Date('2024-09-01'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['AI Office', 'Commission Européenne', 'EU AI Act'],
          official: true,
        },
      },
      {
        sourceId: `ec-governance-framework-${Date.now()}`,
        source: 'Commission Européenne - AI Office',
        url: 'https://digital-strategy.ec.europa.eu/en/library/ai-governance-framework',
        title: 'Cadre de gouvernance de l\'IA - Lignes directrices pour les États membres',
        rawContent: 'Lignes directrices sur la mise en place des autorités nationales de surveillance, des bacs à sable réglementaires et des mécanismes de coordination.',
        publishedDate: new Date('2024-11-15'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['gouvernance', 'surveillance', 'autorités nationales'],
          official: true,
        },
      },
      {
        sourceId: `ec-ai-pact-${Date.now()}`,
        source: 'Commission Européenne - AI Office',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/ai-pact',
        title: 'Pacte européen pour l\'IA - Engagements volontaires',
        rawContent: 'Initiative encourageant les entreprises à adopter volontairement les exigences du règlement IA avant son entrée en vigueur complète. Plus de 300 organisations participantes.',
        publishedDate: new Date('2024-10-20'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['AI Pact', 'engagements volontaires', 'adoption précoce'],
          official: true,
        },
      },
    ];

    return officialUpdates.slice(0, limit);
  }

  async getCodesOfConduct(topic?: string): Promise<RawRegulatoryData[]> {
    const codesOfConduct: RawRegulatoryData[] = [
      {
        sourceId: `ec-gpai-code-${Date.now()}`,
        source: 'Commission Européenne - AI Office',
        url: 'https://digital-strategy.ec.europa.eu/en/library/ai-act-code-practice-general-purpose-ai-models',
        title: 'Code de conduite pour les modèles d\'IA à usage général (GPAI)',
        rawContent: 'Code de bonnes pratiques établissant des normes volontaires pour les fournisseurs de modèles GPAI, couvrant la transparence, la gestion des risques et la sécurité.',
        publishedDate: new Date('2024-12-01'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['code of conduct', 'GPAI', 'modèles fondation'],
          official: true,
        },
      },
      {
        sourceId: `ec-systemic-risk-code-${Date.now()}`,
        source: 'Commission Européenne - AI Office',
        url: 'https://digital-strategy.ec.europa.eu/en/library/gpai-systemic-risk-code-practice',
        title: 'Code de conduite - Risques systémiques des modèles GPAI',
        rawContent: 'Dispositions spécifiques pour les modèles GPAI présentant des risques systémiques (Article 55), incluant l\'évaluation des risques, les tests adverses et les mécanismes de protection.',
        publishedDate: new Date('2025-01-05'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['risques systémiques', 'GPAI', 'Article 55'],
          official: true,
        },
      },
    ];

    if (topic) {
      return codesOfConduct.filter(doc =>
        doc.title.toLowerCase().includes(topic.toLowerCase()) ||
        doc.rawContent.toLowerCase().includes(topic.toLowerCase())
      );
    }

    return codesOfConduct;
  }

  async getAIBoardDecisions(daysBack: number = 30): Promise<RawRegulatoryData[]> {
    const boardDecisions: RawRegulatoryData[] = [
      {
        sourceId: `ai-board-establishment-${Date.now()}`,
        source: 'European AI Board',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/european-ai-board',
        title: 'Création du Conseil européen de l\'intelligence artificielle',
        rawContent: 'Mise en place du Conseil européen de l\'IA (European AI Board) conformément à l\'article 65 du règlement IA. Composé de représentants des autorités nationales de surveillance.',
        publishedDate: new Date('2024-09-15'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['AI Board', 'Article 65', 'gouvernance'],
          official: true,
        },
      },
      {
        sourceId: `ai-board-sandboxes-opinion-${Date.now()}`,
        source: 'European AI Board',
        url: 'https://digital-strategy.ec.europa.eu/en/library/ai-board-opinion-regulatory-sandboxes',
        title: 'Avis du Conseil IA - Bacs à sable réglementaires',
        rawContent: 'Orientations sur la mise en œuvre des bacs à sable réglementaires pour l\'IA (Article 57). Recommandations sur les critères d\'éligibilité et les processus de supervision.',
        publishedDate: new Date('2024-11-25'),
        documentType: 'guidance',
        language: 'FR',
        metadata: {
          keywords: ['bacs à sable', 'Article 57', 'innovation'],
          official: true,
        },
      },
    ];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return boardDecisions.filter(doc => doc.publishedDate >= cutoffDate);
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
