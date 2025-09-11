import { storage } from '../storage';
import { llmService } from './llmService';
import type { InsertMaturityAssessment, MaturityAssessment } from '@shared/schema';

// Positive AI Framework - Organizational Maturity Domains
export interface MaturityDomain {
  name: string;
  description: string;
  questions: MaturityQuestion[];
  weight: number; // importance weight in overall calculation
}

export interface MaturityQuestion {
  id: string;
  category: string;
  question: string;
  options: MaturityOption[];
}

export interface MaturityOption {
  value: number; // 1-5 scale (Initial, Developing, Defined, Managed, Optimizing)
  label: string;
  description: string;
}

export interface MaturityFormData {
  organizationName: string;
  responses: Record<string, number>; // questionId -> selected value
}

export interface MaturityAssessmentResult {
  overallMaturity: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
  overallScore: number; // 0-100
  domainScores: Record<string, {
    score: number;
    maturityLevel: string;
    strengths: string[];
    improvements: string[];
  }>;
  recommendations: string[];
  actionPlan: {
    priority: 'high' | 'medium' | 'low';
    domain: string;
    action: string;
    timeline: string;
    resources: string[];
  }[];
}

export class MaturityService {
  // Define the Positive AI Framework maturity domains
  private maturityFramework: MaturityDomain[] = [
    {
      name: 'strategy',
      description: 'Stratégie IA et vision organisationnelle',
      weight: 0.25,
      questions: [
        {
          id: 'strategy_vision',
          category: 'strategy',
          question: 'Votre organisation a-t-elle une stratégie IA claire et documentée ?',
          options: [
            { value: 1, label: 'Aucune stratégie', description: 'Pas de stratégie IA définie' },
            { value: 2, label: 'Stratégie émergente', description: 'Réflexions préliminaires en cours' },
            { value: 3, label: 'Stratégie définie', description: 'Stratégie documentée et approuvée' },
            { value: 4, label: 'Stratégie pilotée', description: 'Exécution active avec suivi régulier' },
            { value: 5, label: 'Stratégie optimisée', description: 'Amélioration continue basée sur les résultats' },
          ]
        },
        {
          id: 'strategy_leadership',
          category: 'strategy',
          question: 'Le leadership soutient-il activement les initiatives IA ?',
          options: [
            { value: 1, label: 'Aucun soutien', description: 'Leadership non impliqué' },
            { value: 2, label: 'Soutien limité', description: 'Intérêt occasionnel' },
            { value: 3, label: 'Soutien établi', description: 'Engagement formel du leadership' },
            { value: 4, label: 'Soutien actif', description: 'Leadership champion de l\'IA' },
            { value: 5, label: 'Leadership transformateur', description: 'Vision IA intégrée à la stratégie globale' },
          ]
        }
      ]
    },
    {
      name: 'governance',
      description: 'Gouvernance et management des risques IA',
      weight: 0.30,
      questions: [
        {
          id: 'governance_structure',
          category: 'governance',
          question: 'Existe-t-il une structure de gouvernance IA formelle ?',
          options: [
            { value: 1, label: 'Aucune structure', description: 'Pas de gouvernance IA' },
            { value: 2, label: 'Structure informelle', description: 'Responsabilités ad-hoc' },
            { value: 3, label: 'Structure définie', description: 'Comités et rôles établis' },
            { value: 4, label: 'Structure mature', description: 'Processus formalisés et suivis' },
            { value: 5, label: 'Structure optimisée', description: 'Gouvernance adaptative et efficace' },
          ]
        },
        {
          id: 'risk_management',
          category: 'governance',
          question: 'Comment l\'organisation gère-t-elle les risques IA ?',
          options: [
            { value: 1, label: 'Pas de gestion', description: 'Risques IA non identifiés' },
            { value: 2, label: 'Identification basique', description: 'Conscience des risques majeurs' },
            { value: 3, label: 'Évaluation systématique', description: 'Processus d\'évaluation des risques' },
            { value: 4, label: 'Mitigation active', description: 'Plans de mitigation implementés' },
            { value: 5, label: 'Gestion proactive', description: 'Anticipation et prévention des risques' },
          ]
        }
      ]
    },
    {
      name: 'ethics',
      description: 'Éthique et IA responsable',
      weight: 0.25,
      questions: [
        {
          id: 'ethics_principles',
          category: 'ethics',
          question: 'L\'organisation a-t-elle des principes éthiques IA définis ?',
          options: [
            { value: 1, label: 'Aucun principe', description: 'Pas de considérations éthiques' },
            { value: 2, label: 'Sensibilisation émergente', description: 'Début de réflexion éthique' },
            { value: 3, label: 'Principes documentés', description: 'Charte éthique IA établie' },
            { value: 4, label: 'Application systématique', description: 'Intégration dans les processus' },
            { value: 5, label: 'Culture éthique', description: 'Éthique IA intégrée à tous les niveaux' },
          ]
        },
        {
          id: 'bias_fairness',
          category: 'ethics',
          question: 'Comment l\'organisation aborde-t-elle les biais et l\'équité ?',
          options: [
            { value: 1, label: 'Pas d\'approche', description: 'Biais non considérés' },
            { value: 2, label: 'Sensibilisation basique', description: 'Conscience du problème' },
            { value: 3, label: 'Tests systématiques', description: 'Processus de détection des biais' },
            { value: 4, label: 'Mitigation active', description: 'Stratégies de réduction des biais' },
            { value: 5, label: 'Équité par conception', description: 'Fairness intégrée dès la conception' },
          ]
        }
      ]
    },
    {
      name: 'capabilities',
      description: 'Capacités techniques et humaines',
      weight: 0.20,
      questions: [
        {
          id: 'technical_skills',
          category: 'capabilities',
          question: 'Quel est le niveau des compétences techniques IA dans l\'organisation ?',
          options: [
            { value: 1, label: 'Compétences limitées', description: 'Peu d\'expertise IA interne' },
            { value: 2, label: 'Compétences émergentes', description: 'Formation en cours' },
            { value: 3, label: 'Compétences établies', description: 'Équipes IA compétentes' },
            { value: 4, label: 'Compétences avancées', description: 'Expertise reconnue' },
            { value: 5, label: 'Excellence technique', description: 'Leadership technologique IA' },
          ]
        },
        {
          id: 'data_management',
          category: 'capabilities',
          question: 'Comment l\'organisation gère-t-elle ses données pour l\'IA ?',
          options: [
            { value: 1, label: 'Gestion ad-hoc', description: 'Pas de stratégie données' },
            { value: 2, label: 'Systèmes basiques', description: 'Infrastructure de base' },
            { value: 3, label: 'Gestion structurée', description: 'Processus et outils établis' },
            { value: 4, label: 'Gestion optimisée', description: 'Architecture données mature' },
            { value: 5, label: 'Excellence données', description: 'Data-driven organization' },
          ]
        }
      ]
    }
  ];

  async assessOrganizationalMaturity(
    formData: MaturityFormData,
    userId: string
  ): Promise<MaturityAssessmentResult> {
    // Calculate domain scores
    const domainScores: Record<string, any> = {};
    let totalWeightedScore = 0;

    for (const domain of this.maturityFramework) {
      const domainQuestions = domain.questions;
      let domainTotal = 0;
      let questionCount = 0;

      for (const question of domainQuestions) {
        const response = formData.responses[question.id];
        if (response) {
          domainTotal += response;
          questionCount++;
        }
      }

      const domainAverage = questionCount > 0 ? domainTotal / questionCount : 1;
      const domainScore = Math.round((domainAverage - 1) * 25); // Convert 1-5 scale to 0-100

      domainScores[domain.name] = {
        score: domainScore,
        maturityLevel: this.getMaturityLevel(domainAverage),
        strengths: this.getDomainStrengths(domain.name, domainScore),
        improvements: this.getDomainImprovements(domain.name, domainScore),
      };

      totalWeightedScore += domainScore * domain.weight;
    }

    const overallScore = Math.round(totalWeightedScore);
    const overallMaturity = this.getMaturityLevelFromScore(overallScore);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(
      domainScores,
      overallScore,
      userId
    );

    // Create action plan
    const actionPlan = this.createActionPlan(domainScores);

    return {
      overallMaturity,
      overallScore,
      domainScores,
      recommendations,
      actionPlan,
    };
  }

  async saveMaturityAssessment(
    formData: MaturityFormData,
    result: MaturityAssessmentResult,
    userId: string
  ): Promise<{ assessmentId: string }> {
    const assessment: InsertMaturityAssessment = {
      userId,
      organizationName: formData.organizationName,
      assessmentData: formData,
      overallMaturity: result.overallMaturity,
      domainScores: result.domainScores,
      recommendations: result.recommendations,
      actionPlan: result.actionPlan,
      overallScore: result.overallScore,
    };

    const saved = await storage.createMaturityAssessment(assessment);
    return { assessmentId: saved.id };
  }

  getMaturityFramework(): MaturityDomain[] {
    return this.maturityFramework;
  }

  private getMaturityLevel(score: number): string {
    if (score <= 1.5) return 'initial';
    if (score <= 2.5) return 'developing';
    if (score <= 3.5) return 'defined';
    if (score <= 4.5) return 'managed';
    return 'optimizing';
  }

  private getMaturityLevelFromScore(score: number): 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing' {
    if (score < 20) return 'initial';
    if (score < 40) return 'developing';
    if (score < 60) return 'defined';
    if (score < 80) return 'managed';
    return 'optimizing';
  }

  private getDomainStrengths(domain: string, score: number): string[] {
    const strengths: Record<string, string[]> = {
      strategy: [
        'Vision IA claire et alignée',
        'Leadership engagé',
        'Objectifs mesurables définis'
      ],
      governance: [
        'Structure de gouvernance solide',
        'Gestion proactive des risques',
        'Processus de décision formalisés'
      ],
      ethics: [
        'Principes éthiques établis',
        'Processus de détection des biais',
        'Culture de responsabilité'
      ],
      capabilities: [
        'Compétences techniques avancées',
        'Infrastructure données robuste',
        'Équipes pluridisciplinaires'
      ]
    };

    return score >= 60 ? (strengths[domain] || []) : [];
  }

  private getDomainImprovements(domain: string, score: number): string[] {
    const improvements: Record<string, string[]> = {
      strategy: [
        'Définir une stratégie IA claire',
        'Renforcer l\'engagement du leadership',
        'Établir des KPIs mesurables'
      ],
      governance: [
        'Créer un comité de gouvernance IA',
        'Implémenter des processus de gestion des risques',
        'Formaliser les responsabilités'
      ],
      ethics: [
        'Développer des principes éthiques IA',
        'Mettre en place des tests de biais',
        'Former les équipes à l\'éthique IA'
      ],
      capabilities: [
        'Renforcer les compétences techniques',
        'Améliorer l\'infrastructure données',
        'Recruter des talents IA'
      ]
    };

    return score < 60 ? (improvements[domain] || []) : [];
  }

  private async generateRecommendations(
    domainScores: Record<string, any>,
    overallScore: number,
    userId: string
  ): Promise<string[]> {
    const prompt = `En tant qu'expert en maturité organisationnelle IA et Positive AI Framework, analysez cette évaluation et fournissez 5 recommandations stratégiques spécifiques et actionnables :

SCORES PAR DOMAINE:
${Object.entries(domainScores).map(([domain, data]) => 
  `- ${domain}: ${data.score}/100 (${data.maturityLevel})`
).join('\n')}

SCORE GLOBAL: ${overallScore}/100

Fournissez exactement 5 recommandations concrètes pour améliorer la maturité IA organisationnelle, en vous concentrant sur les domaines les plus critiques.`;

    try {
      const llmResponse = await llmService.generateResponse(prompt, userId, {
        systemPrompt: "Vous êtes un expert en transformation digitale et maturité IA organisationnelle. Fournissez des recommandations pratiques et spécifiques."
      });

      // Parse recommendations from LLM response
      const responseText = llmResponse.content || llmResponse.toString();
      const recommendations = responseText.split('\n')
        .filter((line: string) => line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))
        .map((line: string) => line.replace(/^[-•\d.]\s*/, '').trim())
        .filter((rec: string) => rec.length > 10)
        .slice(0, 5);

      if (recommendations.length === 0) {
        return this.getFallbackRecommendations(overallScore);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating maturity recommendations:', error);
      return this.getFallbackRecommendations(overallScore);
    }
  }

  private getFallbackRecommendations(score: number): string[] {
    if (score < 30) {
      return [
        'Développer une stratégie IA claire avec des objectifs mesurables',
        'Établir une gouvernance IA basique avec des rôles définis',
        'Former les équipes aux principes fondamentaux de l\'IA éthique',
        'Investir dans les compétences techniques IA de base',
        'Améliorer la qualité et l\'accessibilité des données'
      ];
    } else if (score < 60) {
      return [
        'Formaliser les processus de gouvernance IA existants',
        'Implémenter des mécanismes de gestion des risques IA',
        'Créer des guidelines éthiques détaillées pour les projets IA',
        'Développer des centres d\'excellence IA internes',
        'Établir des métriques de performance pour les systèmes IA'
      ];
    } else {
      return [
        'Optimiser les processus de gouvernance IA existants',
        'Développer une approche proactive de gestion des risques',
        'Intégrer l\'éthique IA dans tous les processus métier',
        'Établir un leadership technologique IA sur le marché',
        'Créer un écosystème d\'innovation IA collaborative'
      ];
    }
  }

  private createActionPlan(domainScores: Record<string, any>) {
    const actions = [];
    
    // Find lowest scoring domains and create priority actions
    const sortedDomains = Object.entries(domainScores)
      .sort(([,a], [,b]) => a.score - b.score);

    for (const [domain, data] of sortedDomains.slice(0, 3)) {
      const priority = data.score < 40 ? 'high' : data.score < 70 ? 'medium' : 'low';
      
      actions.push({
        priority: priority as 'high' | 'medium' | 'low',
        domain,
        action: data.improvements[0] || `Améliorer ${domain}`,
        timeline: priority === 'high' ? '3 mois' : priority === 'medium' ? '6 mois' : '12 mois',
        resources: this.getResourcesForDomain(domain)
      });
    }

    return actions;
  }

  private getResourcesForDomain(domain: string): string[] {
    const resources: Record<string, string[]> = {
      strategy: ['Chief AI Officer', 'Strategic consultant', 'Budget planning'],
      governance: ['Risk manager', 'Legal counsel', 'Compliance specialist'],
      ethics: ['Ethics committee', 'External ethics advisor', 'Training budget'],
      capabilities: ['AI engineers', 'Data scientists', 'Infrastructure investment']
    };

    return resources[domain] || ['Personnel dédié', 'Budget alloué', 'Formation'];
  }
}

export const maturityService = new MaturityService();