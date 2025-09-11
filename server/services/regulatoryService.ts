import { storage } from "../storage";
import type { RegulatoryUpdate } from "@shared/schema";

export interface RegulatorySource {
  name: string;
  url: string;
  type: 'official_eu' | 'national_fr' | 'standards';
  checkFrequency: 'hourly' | 'daily' | 'weekly';
}

class RegulatoryService {
  private sources: RegulatorySource[] = [
    {
      name: "Commission Européenne - AI Office",
      url: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
      type: "official_eu",
      checkFrequency: "daily"
    },
    {
      name: "EUR-Lex",
      url: "https://eur-lex.europa.eu",
      type: "official_eu", 
      checkFrequency: "daily"
    },
    {
      name: "DGCCRF",
      url: "https://www.economie.gouv.fr/dgccrf",
      type: "national_fr",
      checkFrequency: "daily"
    },
    {
      name: "CNIL",
      url: "https://www.cnil.fr",
      type: "national_fr",
      checkFrequency: "daily"
    }
  ];

  async seedInitialData(): Promise<void> {
    // Seed with initial regulatory updates
    const initialUpdates = [
      {
        source: "Commission Européenne",
        title: "Actes délégués sur les normes harmonisées",
        content: "Publication des normes harmonisées pour l'évaluation de la conformité des systèmes d'IA à haut risque. Nouvelles exigences techniques entrant en vigueur au 1er août 2025.",
        url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
        severity: "critique" as const,
        category: "normes_techniques",
        publishedAt: new Date('2025-01-15'),
      },
      {
        source: "DGCCRF",
        title: "Guide pratique surveillance marché",
        content: "Nouveau guide pour les entreprises concernant les contrôles de surveillance du marché. Procédures d'audit et sanctions applicables.",
        url: "https://www.economie.gouv.fr/dgccrf/intelligence-artificielle",
        severity: "important" as const,
        category: "surveillance",
        publishedAt: new Date('2025-01-14'),
      },
      {
        source: "AI Office",
        title: "Codes de conduite IA générative",
        content: "Publication des premiers codes de conduite pour les fournisseurs de modèles d'IA générative. Applications aux modèles de fondation et LLM.",
        url: "https://digital-strategy.ec.europa.eu/en/library/ai-act-code-practice-general-purpose-ai-models",
        severity: "info" as const,
        category: "modeles_generatifs",
        publishedAt: new Date('2025-01-13'),
      },
      {
        source: "CNIL",
        title: "IA et protection des données personnelles",
        content: "Nouvelles recommandations sur l'intersection entre le RGPD et le Règlement IA. Impact sur les analyses d'impact relatives à la protection des données.",
        url: "https://www.cnil.fr/fr/intelligence-artificielle",
        severity: "important" as const,
        category: "protection_donnees",
        publishedAt: new Date('2025-01-10'),
      },
      {
        source: "Commission Européenne",
        title: "Comité européen de l'intelligence artificielle",
        content: "Première réunion du Comité européen de l'intelligence artificielle. Adoption des premières orientations pour l'application harmonisée du règlement.",
        url: "https://digital-strategy.ec.europa.eu/en/policies/european-ai-board",
        severity: "info" as const,
        category: "gouvernance",
        publishedAt: new Date('2025-01-08'),
      }
    ];

    for (const update of initialUpdates) {
      try {
        await storage.createRegulatoryUpdate(update);
      } catch (error) {
        // Ignore duplicates
        console.log(`Update already exists: ${update.title}`);
      }
    }
  }

  async getRegulatoryUpdates(limit?: number): Promise<RegulatoryUpdate[]> {
    return await storage.getRegulatoryUpdates(limit);
  }

  async getUpdatesBySource(source: string, limit = 20): Promise<RegulatoryUpdate[]> {
    const allUpdates = await storage.getRegulatoryUpdates(100);
    return allUpdates
      .filter(update => update.source.toLowerCase().includes(source.toLowerCase()))
      .slice(0, limit);
  }

  async getUpdatesBySeverity(severity: string, limit = 20): Promise<RegulatoryUpdate[]> {
    const allUpdates = await storage.getRegulatoryUpdates(100);
    return allUpdates
      .filter(update => update.severity === severity)
      .slice(0, limit);
  }

  async getCriticalAlerts(): Promise<RegulatoryUpdate[]> {
    return await this.getUpdatesBySeverity('critique', 10);
  }

  async simulateNewUpdate(): Promise<RegulatoryUpdate> {
    // Simulate a new regulatory update (in real implementation, this would fetch from external APIs)
    const simulatedUpdates = [
      {
        source: "Commission Européenne",
        title: "Mise à jour Annexe III - Nouveaux domaines haut risque",
        content: "Ajout de nouveaux domaines d'application dans l'Annexe III suite aux développements technologiques. Les systèmes d'IA dans ces domaines seront considérés comme à haut risque.",
        url: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1689",
        severity: "critique" as const,
        category: "amendements",
        publishedAt: new Date(),
      },
      {
        source: "DGCCRF",
        title: "Premières sanctions administratives",
        content: "Publication des premières sanctions appliquées pour non-conformité au Règlement IA. Montants et justifications des amendes imposées.",
        url: "https://www.economie.gouv.fr/dgccrf/sanctions-ia",
        severity: "important" as const,
        category: "sanctions",
        publishedAt: new Date(),
      },
      {
        source: "AI Office",
        title: "Système d'information technique AI",
        content: "Lancement du système d'information technique permettant l'enregistrement des systèmes d'IA à haut risque. Procédures d'inscription détaillées.",
        url: "https://digital-strategy.ec.europa.eu/en/policies/ai-database",
        severity: "important" as const,
        category: "enregistrement",
        publishedAt: new Date(),
      }
    ];

    const randomUpdate = simulatedUpdates[Math.floor(Math.random() * simulatedUpdates.length)];
    return await storage.createRegulatoryUpdate(randomUpdate);
  }

  async getMonitoringStatus(): Promise<{
    lastSync: Date;
    totalUpdates: number;
    criticalAlerts: number;
    sourceStatus: { name: string; status: 'online' | 'offline'; lastCheck: Date }[];
  }> {
    const updates = await storage.getRegulatoryUpdates(1000);
    const criticalUpdates = await this.getCriticalAlerts();

    // Simulate source status
    const sourceStatus = this.sources.map(source => ({
      name: source.name,
      status: Math.random() > 0.1 ? 'online' as const : 'offline' as const,
      lastCheck: new Date(Date.now() - Math.random() * 3600000) // Random time within last hour
    }));

    return {
      lastSync: new Date(Date.now() - Math.random() * 1800000), // Random time within last 30 minutes
      totalUpdates: updates.length,
      criticalAlerts: criticalUpdates.length,
      sourceStatus
    };
  }

  async performRegulatorySync(): Promise<{
    newUpdates: number;
    updatedSources: string[];
    errors: string[];
  }> {
    // Simulate regulatory synchronization
    // In a real implementation, this would:
    // 1. Fetch from EUR-Lex API
    // 2. Scrape DGCCRF website
    // 3. Check CNIL RSS feeds
    // 4. Monitor AI Office publications

    const result = {
      newUpdates: Math.floor(Math.random() * 3) + 1,
      updatedSources: ['Commission Européenne', 'DGCCRF'],
      errors: [] as string[]
    };

    // Simulate adding a new update
    if (result.newUpdates > 0) {
      try {
        await this.simulateNewUpdate();
      } catch (error) {
        result.errors.push(`Error creating simulated update: ${error}`);
      }
    }

    return result;
  }

  // Helper method to categorize updates by impact
  categorizeUpdatesByImpact(updates: RegulatoryUpdate[]): {
    immediate_action: RegulatoryUpdate[];
    policy_changes: RegulatoryUpdate[];
    guidance_updates: RegulatoryUpdate[];
    informational: RegulatoryUpdate[];
  } {
    return {
      immediate_action: updates.filter(u => 
        u.severity === 'critique' && 
        (u.category?.includes('sanctions') || u.category?.includes('interdiction'))
      ),
      policy_changes: updates.filter(u => 
        u.severity === 'critique' && 
        (u.category?.includes('amendements') || u.category?.includes('normes'))
      ),
      guidance_updates: updates.filter(u => 
        u.severity === 'important' && 
        (u.category?.includes('guide') || u.category?.includes('recommandations'))
      ),
      informational: updates.filter(u => u.severity === 'info')
    };
  }
}

export const regulatoryService = new RegulatoryService();
