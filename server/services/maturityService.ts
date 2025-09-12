import { storage } from '../storage';
import { llmService } from './llmService';
import type { InsertMaturityAssessment, MaturityAssessment } from '@shared/schema';

// Positive AI Framework v3.0 - 7 Dimensions Organizational Maturity
export interface MaturityDimension {
  name: string;
  description: string;
  questions: MaturityQuestion[];
  weight: number; // importance weight in overall calculation
}

// Legacy compatibility
export interface MaturityDomain extends MaturityDimension {}

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
      name: 'justice_fairness',
      description: 'Justice et équité',
      weight: 0.15,
      questions: [
        {
          id: 'justice_bias_detection',
          category: 'justice_fairness',
          question: 'Comment votre organisation détecte-t-elle les biais dans ses systèmes IA ?',
          options: [
            { value: 1, label: 'Aucune détection', description: 'Pas de processus de détection des biais' },
            { value: 2, label: 'Détection basique', description: 'Tests ponctuels de biais' },
            { value: 3, label: 'Détection systématique', description: 'Processus formalisé de détection' },
            { value: 4, label: 'Détection continue', description: 'Monitoring permanent des biais' },
            { value: 5, label: 'Prévention proactive', description: 'Système de prévention avancée des biais' },
          ]
        },
        {
          id: 'justice_protected_groups',
          category: 'justice_fairness',
          question: 'Comment protégez-vous les groupes vulnérables dans vos systèmes IA ?',
          options: [
            { value: 1, label: 'Aucune protection', description: 'Groupes vulnérables non considérés' },
            { value: 2, label: 'Sensibilisation basique', description: 'Conscience des enjeux de protection' },
            { value: 3, label: 'Mesures définies', description: 'Politiques de protection formalisées' },
            { value: 4, label: 'Protection active', description: 'Mécanismes de protection implémentés' },
            { value: 5, label: 'Inclusion optimale', description: 'Excellence en protection et inclusion' },
          ]
        },
        {
          id: 'justice_inclusive_teams',
          category: 'justice_fairness',
          question: 'Vos équipes de développement IA sont-elles diversifiées et inclusives ?',
          options: [
            { value: 1, label: 'Pas de diversité', description: 'Équipes homogènes' },
            { value: 2, label: 'Diversité limitée', description: 'Quelques efforts de diversification' },
            { value: 3, label: 'Diversité structurée', description: 'Politiques de diversité définies' },
            { value: 4, label: 'Inclusion active', description: 'Culture inclusive établie' },
            { value: 5, label: 'Excellence inclusive', description: 'Modèle de référence en diversité' },
          ]
        }
      ]
    },
    {
      name: 'transparency_explainability',
      description: 'Transparence et explicabilité',
      weight: 0.15,
      questions: [
        {
          id: 'transparency_decision_process',
          category: 'transparency_explainability',
          question: 'Dans quelle mesure vos systèmes IA peuvent-ils expliquer leurs décisions ?',
          options: [
            { value: 1, label: 'Boîte noire', description: 'Aucune explication des décisions IA' },
            { value: 2, label: 'Transparence limitée', description: 'Informations de base sur le fonctionnement' },
            { value: 3, label: 'Explicabilité technique', description: 'Explications pour les experts techniques' },
            { value: 4, label: 'Explicabilité métier', description: 'Explications adaptées aux utilisateurs métier' },
            { value: 5, label: 'Transparence totale', description: 'Explications claires pour tous les publics' },
          ]
        },
        {
          id: 'transparency_data_source',
          category: 'transparency_explainability',
          question: 'Votre organisation documente-t-elle les sources et traitements des données ?',
          options: [
            { value: 1, label: 'Non documenté', description: 'Pas de traçabilité des données' },
            { value: 2, label: 'Documentation basique', description: 'Informations minimales sur les sources' },
            { value: 3, label: 'Documentation structurée', description: 'Traçabilité formalisée des données' },
            { value: 4, label: 'Transparence active', description: 'Documentation accessible aux parties prenantes' },
            { value: 5, label: 'Audit complet', description: 'Traçabilité complète et auditabilité' },
          ]
        },
        {
          id: 'transparency_algorithmic_impact',
          category: 'transparency_explainability',
          question: 'Comment communiquez-vous l\'impact algorithmique aux utilisateurs ?',
          options: [
            { value: 1, label: 'Aucune communication', description: 'Utilisateurs non informés de l\'usage IA' },
            { value: 2, label: 'Information minimale', description: 'Mention de l\'usage de l\'IA' },
            { value: 3, label: 'Communication structurée', description: 'Explication du rôle de l\'IA' },
            { value: 4, label: 'Transparence proactive', description: 'Communication détaillée des impacts' },
            { value: 5, label: 'Co-construction', description: 'Dialogue continu sur l\'usage de l\'IA' },
          ]
        }
      ]
    },
    {
      name: 'human_ai_interaction',
      description: 'Interaction humaine et IA',
      weight: 0.15,
      questions: [
        {
          id: 'human_ai_collaboration',
          category: 'human_ai_interaction',
          question: 'Comment vos systèmes IA sont-ils conçus pour collaborer avec les humains ?',
          options: [
            { value: 1, label: 'Remplacement total', description: 'IA remplace complètement l\'humain' },
            { value: 2, label: 'Supervision minimale', description: 'Humain valide les décisions IA' },
            { value: 3, label: 'Collaboration définie', description: 'Répartition claire des rôles humain-IA' },
            { value: 4, label: 'Collaboration adaptative', description: 'Ajustement dynamique des interactions' },
            { value: 5, label: 'Symbiose optimale', description: 'Complémentarité parfaite humain-IA' },
          ]
        },
        {
          id: 'human_ai_control',
          category: 'human_ai_interaction',
          question: 'Les utilisateurs peuvent-ils exercer un contrôle significatif sur les systèmes IA ?',
          options: [
            { value: 1, label: 'Aucun contrôle', description: 'Système entièrement automatisé' },
            { value: 2, label: 'Contrôle limité', description: 'Paramètres basiques modifiables' },
            { value: 3, label: 'Contrôle structuré', description: 'Options de configuration définies' },
            { value: 4, label: 'Contrôle adaptatif', description: 'Personnalisation avancée possible' },
            { value: 5, label: 'Contrôle total', description: 'Utilisateur maître de toutes les décisions' },
          ]
        },
        {
          id: 'human_ai_training',
          category: 'human_ai_interaction',
          question: 'Comment formez-vous les utilisateurs à travailler avec l\'IA ?',
          options: [
            { value: 1, label: 'Aucune formation', description: 'Utilisateurs livrés à eux-mêmes' },
            { value: 2, label: 'Formation basique', description: 'Instructions minimales d\'utilisation' },
            { value: 3, label: 'Formation structurée', description: 'Programme de formation défini' },
            { value: 4, label: 'Formation continue', description: 'Mise à jour régulière des compétences' },
            { value: 5, label: 'Expertise développée', description: 'Utilisateurs experts en collaboration IA' },
          ]
        }
      ]
    },
    {
      name: 'social_environmental_impact',
      description: 'Impact social et environnemental',
      weight: 0.10,
      questions: [
        {
          id: 'social_impact_assessment',
          category: 'social_environmental_impact',
          question: 'Votre organisation évalue-t-elle l\'impact social de ses systèmes IA ?',
          options: [
            { value: 1, label: 'Aucune évaluation', description: 'Impact social non considéré' },
            { value: 2, label: 'Évaluation ponctuelle', description: 'Analyses ad-hoc sur demande' },
            { value: 3, label: 'Évaluation systématique', description: 'Processus formalisé d\'évaluation' },
            { value: 4, label: 'Suivi continu', description: 'Monitoring des impacts sociaux' },
            { value: 5, label: 'Optimisation sociale', description: 'IA conçue pour maximiser l\'impact positif' },
          ]
        },
        {
          id: 'environmental_sustainability',
          category: 'social_environmental_impact',
          question: 'Comment gérez-vous l\'empreinte environnementale de vos systèmes IA ?',
          options: [
            { value: 1, label: 'Non considérée', description: 'Empreinte environnementale ignorée' },
            { value: 2, label: 'Sensibilisation basique', description: 'Conscience des enjeux environnementaux' },
            { value: 3, label: 'Mesure établie', description: 'Quantification de l\'empreinte carbone' },
            { value: 4, label: 'Réduction active', description: 'Stratégies de réduction de l\'impact' },
            { value: 5, label: 'Neutralité carbone', description: 'IA neutre ou positive pour l\'environnement' },
          ]
        }
      ]
    },
    {
      name: 'responsibility',
      description: 'Responsabilité',
      weight: 0.15,
      questions: [
        {
          id: 'responsibility_accountability',
          category: 'responsibility',
          question: 'Comment est organisée la responsabilité des décisions IA dans votre organisation ?',
          options: [
            { value: 1, label: 'Responsabilité floue', description: 'Pas de responsable identifié' },
            { value: 2, label: 'Responsabilité technique', description: 'Équipes techniques responsables' },
            { value: 3, label: 'Responsabilité métier', description: 'Propriétaires métier responsables' },
            { value: 4, label: 'Responsabilité partagée', description: 'Modèle de responsabilité claire' },
            { value: 5, label: 'Responsabilité totale', description: 'Chaîne complète de responsabilité' },
          ]
        },
        {
          id: 'responsibility_redress',
          category: 'responsibility',
          question: 'Existe-t-il des mécanismes de recours en cas d\'erreur IA ?',
          options: [
            { value: 1, label: 'Aucun recours', description: 'Pas de possibilité de contester' },
            { value: 2, label: 'Recours limité', description: 'Processus informel de plainte' },
            { value: 3, label: 'Recours structuré', description: 'Processus formalisé de recours' },
            { value: 4, label: 'Recours efficace', description: 'Mécanismes rapides et effectifs' },
            { value: 5, label: 'Justice algorithmique', description: 'Système complet de recours et réparation' },
          ]
        }
      ]
    },
    {
      name: 'data_privacy',
      description: 'Données et vie privée',
      weight: 0.15,
      questions: [
        {
          id: 'data_privacy_protection',
          category: 'data_privacy',
          question: 'Comment votre organisation protège-t-elle la vie privée dans ses systèmes IA ?',
          options: [
            { value: 1, label: 'Protection minimale', description: 'Peu d\'attention à la vie privée' },
            { value: 2, label: 'Conformité basique', description: 'Respect des exigences légales minimales' },
            { value: 3, label: 'Protection structurée', description: 'Processus formalisés de protection' },
            { value: 4, label: 'Privacy by design', description: 'Vie privée intégrée dès la conception' },
            { value: 5, label: 'Excellence privacy', description: 'Leadership en protection de la vie privée' },
          ]
        },
        {
          id: 'data_governance',
          category: 'data_privacy',
          question: 'Existe-t-il une gouvernance claire des données pour l\'IA ?',
          options: [
            { value: 1, label: 'Gouvernance inexistante', description: 'Pas de règles sur les données' },
            { value: 2, label: 'Règles basiques', description: 'Politiques minimales de données' },
            { value: 3, label: 'Gouvernance formalisée', description: 'Cadre de gouvernance établi' },
            { value: 4, label: 'Gouvernance mature', description: 'Contrôles et audits réguliers' },
            { value: 5, label: 'Gouvernance exemplaire', description: 'Modèle de référence en gouvernance' },
          ]
        },
        {
          id: 'data_consent_rights',
          category: 'data_privacy',
          question: 'Comment gérez-vous les droits des personnes sur leurs données ?',
          options: [
            { value: 1, label: 'Droits ignorés', description: 'Pas de gestion des droits individuels' },
            { value: 2, label: 'Conformité minimale', description: 'Respect basique du RGPD/CCPA' },
            { value: 3, label: 'Gestion structurée', description: 'Processus clairs pour les droits' },
            { value: 4, label: 'Facilitation active', description: 'Outils simples pour exercer les droits' },
            { value: 5, label: 'Empowerment total', description: 'Contrôle complet des individus sur leurs données' },
          ]
        }
      ]
    },
    {
      name: 'technical_robustness_security',
      description: 'Robustesse technique et sécurité',
      weight: 0.15,
      questions: [
        {
          id: 'technical_reliability',
          category: 'technical_robustness_security',
          question: 'Quelle est la fiabilité technique de vos systèmes IA ?',
          options: [
            { value: 1, label: 'Fiabilité faible', description: 'Systèmes instables et peu fiables' },
            { value: 2, label: 'Fiabilité basique', description: 'Fonctionnement correct dans conditions normales' },
            { value: 3, label: 'Fiabilité éprouvée', description: 'Tests systématiques et monitoring' },
            { value: 4, label: 'Haute fiabilité', description: 'Systèmes robustes et résilients' },
            { value: 5, label: 'Fiabilité critique', description: 'Standards de fiabilité maximaux' },
          ]
        },
        {
          id: 'security_measures',
          category: 'technical_robustness_security',
          question: 'Comment sécurisez-vous vos systèmes IA contre les attaques ?',
          options: [
            { value: 1, label: 'Sécurité minimale', description: 'Peu de mesures de sécurité IA' },
            { value: 2, label: 'Sécurité basique', description: 'Mesures de sécurité standards' },
            { value: 3, label: 'Sécurité renforcée', description: 'Sécurité spécifique aux systèmes IA' },
            { value: 4, label: 'Sécurité avancée', description: 'Protection contre attaques adversaires' },
            { value: 5, label: 'Sécurité militaire', description: 'Niveau de sécurité maximal' },
          ]
        },
        {
          id: 'testing_validation',
          category: 'technical_robustness_security',
          question: 'Comment testez-vous et validez-vous vos systèmes IA ?',
          options: [
            { value: 1, label: 'Tests limités', description: 'Tests minimaux avant déploiement' },
            { value: 2, label: 'Tests standards', description: 'Tests fonctionnels de base' },
            { value: 3, label: 'Tests complets', description: 'Suite complète de tests automatisés' },
            { value: 4, label: 'Validation continue', description: 'Monitoring et validation en continu' },
            { value: 5, label: 'Validation formelle', description: 'Méthodes formelles de validation' },
          ]
        }
      ]
    }
  ];

  constructor() {
    this.validateFramework();
  }

  private validateFramework(): void {
    // Validate that all 7 dimensions are present
    const expectedDimensions = [
      'justice_fairness',
      'transparency_explainability', 
      'human_ai_interaction',
      'social_environmental_impact',
      'responsibility',
      'data_privacy',
      'technical_robustness_security'
    ];
    
    const actualDimensions = this.maturityFramework.map(d => d.name);
    const missingDimensions = expectedDimensions.filter(dim => !actualDimensions.includes(dim));
    
    if (missingDimensions.length > 0) {
      throw new Error(`Missing dimensions in Positive AI Framework v3.0: ${missingDimensions.join(', ')}`);
    }
    
    if (actualDimensions.length !== 7) {
      throw new Error(`Framework should have exactly 7 dimensions, found ${actualDimensions.length}`);
    }

    // Validate weights sum to 1.0 (within tolerance for floating point)
    const totalWeight = this.maturityFramework.reduce((sum, domain) => sum + domain.weight, 0);
    const tolerance = 0.0001;
    
    if (Math.abs(totalWeight - 1.0) > tolerance) {
      throw new Error(`Domain weights must sum to 1.0, current sum is ${totalWeight.toFixed(4)}`);
    }

    console.log('✅ Positive AI Framework v3.0 validation passed:', {
      dimensions: actualDimensions.length,
      weightSum: totalWeight.toFixed(4),
      dimensions_list: actualDimensions
    });
  }

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

    // Normalize score to ensure it stays within 0-100 range
    const rawScore = totalWeightedScore;
    const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));
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
      justice_fairness: [
        'Mécanismes de détection des biais robustes',
        'Politiques de protection des groupes vulnérables',
        'Équipes diverses et inclusives'
      ],
      transparency_explainability: [
        'Systèmes explicables et transparents',
        'Documentation complète des processus',
        'Communication claire des impacts algorithmiques'
      ],
      human_ai_interaction: [
        'Collaboration humain-IA optimisée',
        'Contrôle utilisateur bien défini',
        'Formation continue des équipes'
      ],
      social_environmental_impact: [
        'Évaluation systématique des impacts sociaux',
        'Stratégies de réduction environnementale',
        'IA à impact positif'
      ],
      responsibility: [
        'Chaîne de responsabilité claire',
        'Mécanismes de recours efficaces',
        'Culture de responsabilisation'
      ],
      data_privacy: [
        'Privacy by design implémenté',
        'Gouvernance des données exemplaire',
        'Gestion proactive des droits individuels'
      ],
      technical_robustness_security: [
        'Haute fiabilité technique',
        'Sécurité avancée contre les attaques',
        'Validation continue et complète'
      ]
    };

    return score >= 60 ? (strengths[domain] || []) : [];
  }

  private getDomainImprovements(domain: string, score: number): string[] {
    const improvements: Record<string, string[]> = {
      justice_fairness: [
        'Implémenter des outils de détection des biais',
        'Développer des politiques de protection inclusive',
        'Diversifier les équipes de développement IA'
      ],
      transparency_explainability: [
        'Améliorer l\'explicabilité des modèles IA',
        'Documenter les sources et traitements de données',
        'Communiquer clairement les impacts algorithmiques'
      ],
      human_ai_interaction: [
        'Optimiser la collaboration humain-IA',
        'Renforcer le contrôle utilisateur',
        'Former les utilisateurs à l\'interaction IA'
      ],
      social_environmental_impact: [
        'Mettre en place l\'évaluation d\'impact social',
        'Mesurer et réduire l\'empreinte environnementale',
        'Aligner l\'IA sur les objectifs sociaux'
      ],
      responsibility: [
        'Clarifier les chaînes de responsabilité',
        'Créer des mécanismes de recours',
        'Renforcer la culture de responsabilisation'
      ],
      data_privacy: [
        'Implémenter Privacy by Design',
        'Formaliser la gouvernance des données',
        'Faciliter l\'exercice des droits individuels'
      ],
      technical_robustness_security: [
        'Améliorer la fiabilité technique',
        'Renforcer les mesures de sécurité IA',
        'Implémenter des tests et validations complètes'
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
      justice_fairness: ['Expert en biais algorithmiques', 'Spécialiste diversité & inclusion', 'Outils de détection de biais'],
      transparency_explainability: ['Expert en explicabilité IA', 'Technical writer', 'Outils de documentation'],
      human_ai_interaction: ['UX designer IA', 'Ergonome', 'Plateforme de formation'],
      social_environmental_impact: ['Analyste impact social', 'Expert développement durable', 'Outils de mesure d\'impact'],
      responsibility: ['Responsable éthique IA', 'Juriste spécialisé', 'Système de recours'],
      data_privacy: ['DPO (Data Protection Officer)', 'Expert RGPD', 'Outils de gestion des consentements'],
      technical_robustness_security: ['Ingénieur sécurité IA', 'Expert en tests adversaires', 'Infrastructure de monitoring']
    };

    return resources[domain] || ['Personnel dédié', 'Budget alloué', 'Formation'];
  }
}

export const maturityService = new MaturityService();