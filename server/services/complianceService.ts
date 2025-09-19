import { storage } from "../storage";
import { llmService } from "./llmService";
import type { InsertComplianceRecord, AiSystem } from "@shared/schema";

export interface ComplianceMatrixItem {
  systemId: string;
  systemName: string;
  riskLevel: string;
  obligations: {
    documentation: 'compliant' | 'pending' | 'not_applicable';
    testing: 'compliant' | 'pending' | 'not_applicable';
    surveillance: 'compliant' | 'pending' | 'not_applicable';
    transparency: 'compliant' | 'pending' | 'not_applicable';
    certification: 'compliant' | 'pending' | 'not_applicable';
  };
  overallStatus: 'compliant' | 'partial' | 'non_compliant';
  lastUpdated: Date;
}

export interface ComplianceOverview {
  totalSystems: number;
  compliantSystems: number;
  partialCompliance: number;
  nonCompliantSystems: number;
  criticalActions: number;
  upcomingDeadlines: number;
}

class ComplianceService {
  async getComplianceOverview(userId: string): Promise<ComplianceOverview> {
    const systems = await storage.getAiSystemsByUser(userId);
    const complianceData = await storage.getComplianceOverview(userId);

    const totalSystems = systems.length;
    const compliantSystems = systems.filter(s => s.status === 'active' && s.complianceScore && s.complianceScore >= 80).length;
    const nonCompliantSystems = systems.filter(s => s.riskLevel === 'unacceptable' || (s.complianceScore && s.complianceScore < 40)).length;
    const partialCompliance = totalSystems - compliantSystems - nonCompliantSystems;

    // Calculate critical actions (high risk systems with compliance issues)
    const criticalActions = systems.filter(s => 
      s.riskLevel === 'high' && (!s.complianceScore || s.complianceScore < 60)
    ).length;

    // Mock upcoming deadlines (would be calculated from actual compliance records)
    const upcomingDeadlines = Math.floor(totalSystems * 0.2);

    return {
      totalSystems,
      compliantSystems,
      partialCompliance,
      nonCompliantSystems,
      criticalActions,
      upcomingDeadlines,
    };
  }

  async getComplianceMatrix(userId: string): Promise<ComplianceMatrixItem[]> {
    const systems = await storage.getAiSystemsByUser(userId);
    const matrix: ComplianceMatrixItem[] = [];

    for (const system of systems) {
      const complianceRecords = await storage.getComplianceRecordsBySystem(system.id);
      const obligations = this.calculateObligationStatus(system, complianceRecords);
      const overallStatus = this.calculateOverallStatus(obligations);

      matrix.push({
        systemId: system.id,
        systemName: system.name,
        riskLevel: system.riskLevel || 'minimal',
        obligations,
        overallStatus,
        lastUpdated: system.updatedAt || system.createdAt,
      });
    }

    return matrix;
  }

  private calculateObligationStatus(
    system: AiSystem,
    complianceRecords: any[]
  ): ComplianceMatrixItem['obligations'] {
    const riskLevel = system.riskLevel || 'minimal';
    
    // Default status based on risk level
    const obligations: ComplianceMatrixItem['obligations'] = {
      documentation: 'not_applicable',
      testing: 'not_applicable',
      surveillance: 'not_applicable',
      transparency: 'not_applicable',
      certification: 'not_applicable',
    };

    // Apply obligations based on risk level
    switch (riskLevel) {
      case 'high':
        obligations.documentation = 'pending';
        obligations.testing = 'pending';
        obligations.surveillance = 'pending';
        obligations.transparency = 'pending';
        obligations.certification = 'pending';
        break;
      case 'limited':
        obligations.transparency = 'pending';
        obligations.documentation = 'pending';
        break;
      case 'minimal':
        obligations.documentation = 'pending';
        break;
    }

    // Update status based on actual compliance records
    complianceRecords.forEach(record => {
      // This would map specific articles to obligation categories
      // For now, we'll use a simplified approach
      if (record.compliant && record.completedAt) {
        // Mark random obligations as compliant for demo
        const keys = Object.keys(obligations) as (keyof typeof obligations)[];
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        if (obligations[randomKey] === 'pending') {
          obligations[randomKey] = 'compliant';
        }
      }
    });

    return obligations;
  }

  private calculateOverallStatus(obligations: ComplianceMatrixItem['obligations']): 'compliant' | 'partial' | 'non_compliant' {
    const values = Object.values(obligations);
    const applicableObligations = values.filter(v => v !== 'not_applicable');
    
    if (applicableObligations.length === 0) {
      return 'compliant';
    }

    const compliantCount = applicableObligations.filter(v => v === 'compliant').length;
    const totalApplicable = applicableObligations.length;

    if (compliantCount === totalApplicable) {
      return 'compliant';
    } else if (compliantCount > 0) {
      return 'partial';
    } else {
      return 'non_compliant';
    }
  }

  async generateComplianceReport(
    systemId: string,
    userId: string
  ): Promise<{ title: string; content: string; recommendations: string[] }> {
    const system = await storage.getAiSystem(systemId);
    if (!system) {
      throw new Error("AI system not found");
    }

    const complianceRecords = await storage.getComplianceRecordsBySystem(systemId);
    const latestAssessment = await storage.getLatestRiskAssessment(systemId);

    const systemPrompt = `Vous êtes un expert en conformité réglementaire pour le Règlement (UE) 2024/1689 sur l'IA.
    Générez un rapport de conformité détaillé basé sur les données du système IA fourni.
    Le rapport doit être professionnel, précis et conforme aux exigences légales françaises.`;

    const prompt = `
    Générez un rapport de conformité pour le système IA suivant:
    
    Système: ${system.name}
    Secteur: ${system.sector}
    Niveau de risque: ${system.riskLevel}
    Score de conformité: ${system.complianceScore || 0}%
    
    Données d'évaluation: ${JSON.stringify(system.assessmentData, null, 2)}
    
    Nombre d'enregistrements de conformité: ${complianceRecords.length}
    
    Veuillez fournir:
    1. Un titre approprié pour le rapport
    2. Un contenu détaillé avec analyse de conformité
    3. Des recommandations spécifiques d'amélioration
    
    Format de réponse JSON:
    {
      "title": "Titre du rapport",
      "content": "Contenu détaillé du rapport...",
      "recommendations": ["Recommandation 1", "Recommandation 2", ...]
    }`;

    try {
      const response = await llmService.generateResponse(prompt, userId, {
        systemPrompt,
        maxTokens: 3000
      });

      const parsed = JSON.parse(response.content);
      return parsed;
    } catch (error) {
      console.error('Compliance report generation failed:', error);
      
      // Fallback report
      return {
        title: `Rapport de conformité - ${system.name}`,
        content: `Ce rapport analyse la conformité du système "${system.name}" au Règlement (UE) 2024/1689.

NIVEAU DE RISQUE: ${system.riskLevel?.toUpperCase() || 'NON DÉTERMINÉ'}

ANALYSE DE CONFORMITÉ:
${this.getComplianceAnalysis(system)}

STATUT ACTUEL:
- Score de conformité: ${system.complianceScore || 0}%
- Dernière évaluation: ${system.lastAssessed ? new Date(system.lastAssessed).toLocaleDateString('fr-FR') : 'Non effectuée'}

PROCHAINES ÉTAPES:
${this.getNextSteps(system.riskLevel || 'minimal')}`,
        recommendations: this.getDefaultRecommendations(system.riskLevel || 'minimal')
      };
    }
  }

  private getComplianceAnalysis(system: AiSystem): string {
    switch (system.riskLevel) {
      case 'unacceptable':
        return "⚠️ ATTENTION: Ce système présente des caractéristiques interdites par l'Article 5. Usage prohibé.";
      case 'high':
        return "Ce système nécessite une conformité stricte avec toutes les obligations pour systèmes à haut risque.";
      case 'limited':
        return "Ce système doit respecter les obligations de transparence de l'Article 50.";
      case 'minimal':
        return "Ce système a des obligations limitées mais doit suivre les bonnes pratiques.";
      default:
        return "Niveau de risque non déterminé. Évaluation requise.";
    }
  }

  private getNextSteps(riskLevel: string): string {
    const steps = {
      unacceptable: "1. Cessation immédiate\n2. Consultation juridique\n3. Recherche d'alternatives",
      high: "1. Documentation technique\n2. Évaluation de conformité\n3. Marquage CE\n4. Enregistrement UE",
      limited: "1. Information des utilisateurs\n2. Documentation des capacités\n3. Instructions d'usage",
      minimal: "1. Documentation de base\n2. Surveillance des performances\n3. Évaluation périodique"
    };
    return steps[riskLevel as keyof typeof steps] || steps.minimal;
  }

  private getDefaultRecommendations(riskLevel: string): string[] {
    const recommendations = {
      unacceptable: [
        "Arrêter immédiatement l'utilisation du système",
        "Consulter un avocat spécialisé en droit numérique",
        "Évaluer des solutions alternatives conformes"
      ],
      high: [
        "Mettre en place un système de gestion de la qualité",
        "Effectuer une évaluation de conformité complète",
        "Préparer la documentation technique selon l'Annexe IV",
        "Implémenter une surveillance humaine effective"
      ],
      limited: [
        "Informer clairement les utilisateurs de l'usage de l'IA",
        "Documenter les capacités et limitations du système",
        "Fournir des instructions d'utilisation détaillées"
      ],
      minimal: [
        "Maintenir une documentation de base du système",
        "Surveiller régulièrement les performances",
        "Appliquer les principes d'IA éthique"
      ]
    };
    return recommendations[riskLevel as keyof typeof recommendations] || recommendations.minimal;
  }

  async updateComplianceStatus(
    systemId: string,
    articleId: string,
    compliant: boolean,
    evidence?: string,
    notes?: string,
    userId?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error("User ID required");
    }

    const record: InsertComplianceRecord = {
      aiSystemId: systemId,
      userId,
      articleId,
      compliant,
      evidence,
      notes,
      completedAt: compliant ? new Date() : undefined,
    };

    await storage.upsertComplianceRecord(record);
  }
}

export const complianceService = new ComplianceService();
