import { storage } from "../storage";
import { llmService } from "./llmService";
import type { InsertRiskAssessment, InsertAiSystem } from "@shared/schema";

export interface AssessmentFormData {
  // Basic Information
  systemName: string;
  sector: string;
  description?: string;

  // Justice and Equity
  sensitiveData: 'yes' | 'limited' | 'no';
  discriminationRisk: 'high' | 'medium' | 'low';

  // Transparency
  userInformed: 'full' | 'partial' | 'none';
  explainabilityLevel: 'high' | 'medium' | 'low';

  // Human Interaction
  humanOversight: 'full' | 'intermittent' | 'minimal';
  overrideCapability: 'yes' | 'limited' | 'no';

  // Technical Characteristics
  autonomyLevel: 'high' | 'medium' | 'low';
  safetyImpact: 'critical' | 'significant' | 'minimal';
  decisionConsequences: 'irreversible' | 'reversible' | 'advisory';

  // Domain Specific
  applicationDomain: string;
  userCategories: string[];
  geographicalScope: 'eu' | 'national' | 'local';
}

export interface RiskAssessmentResult {
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  riskScore: number; // 0-100
  reasoning: string;
  obligations: string[];
  recommendations: string[];
  timeline: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  };
}

class AssessmentService {
  async performRiskAssessment(
    formData: AssessmentFormData,
    userId: string
  ): Promise<RiskAssessmentResult> {
    // Calculate base risk score using Technical Framework v3.0 criteria
    const riskScore = this.calculateRiskScore(formData);
    const riskLevel = this.determineRiskLevel(riskScore, formData);

    // Generate AI-powered assessment using LLM
    const aiAssessment = await this.generateAIAssessment(formData, riskScore, riskLevel, userId);

    // Determine obligations based on risk level and EU AI Act
    const obligations = this.getObligations(riskLevel, formData);

    return {
      riskLevel,
      riskScore,
      reasoning: aiAssessment.reasoning,
      obligations,
      recommendations: aiAssessment.recommendations,
      timeline: aiAssessment.timeline,
    };
  }

  private calculateRiskScore(formData: AssessmentFormData): number {
    let score = 0;

    // Sensitive data handling (0-25 points)
    if (formData.sensitiveData === 'yes') score += 25;
    else if (formData.sensitiveData === 'limited') score += 15;
    else score += 5;

    // Discrimination risk (0-20 points)
    if (formData.discriminationRisk === 'high') score += 20;
    else if (formData.discriminationRisk === 'medium') score += 12;
    else score += 4;

    // Human oversight (0-20 points)
    if (formData.humanOversight === 'minimal') score += 20;
    else if (formData.humanOversight === 'intermittent') score += 12;
    else score += 4;

    // Autonomy level (0-15 points)
    if (formData.autonomyLevel === 'high') score += 15;
    else if (formData.autonomyLevel === 'medium') score += 10;
    else score += 3;

    // Safety impact (0-20 points)
    if (formData.safetyImpact === 'critical') score += 20;
    else if (formData.safetyImpact === 'significant') score += 12;
    else score += 3;

    return Math.min(score, 100);
  }

  private determineRiskLevel(
    score: number,
    formData: AssessmentFormData
  ): 'minimal' | 'limited' | 'high' | 'unacceptable' {
    // Check for unacceptable practices first (Article 5)
    if (this.isUnacceptablePractice(formData)) {
      return 'unacceptable';
    }

    // High risk systems (Annex III)
    if (this.isHighRiskDomain(formData) || score >= 70) {
      return 'high';
    }

    // Limited risk (transparency obligations)
    if (score >= 40 || formData.userInformed === 'none') {
      return 'limited';
    }

    // Minimal risk
    return 'minimal';
  }

  private isUnacceptablePractice(formData: AssessmentFormData): boolean {
    // Article 5 - Prohibited AI practices
    const prohibitedScenarios = [
      // Subliminal techniques
      formData.applicationDomain.includes('subliminal') ||
      formData.applicationDomain.includes('manipulation'),
      
      // Social scoring
      formData.applicationDomain.includes('social_scoring') ||
      formData.applicationDomain.includes('citizen_rating'),
      
      // Real-time biometric identification in public spaces
      formData.applicationDomain.includes('biometric_identification') &&
      formData.geographicalScope !== 'local' &&
      formData.safetyImpact === 'critical'
    ];

    return prohibitedScenarios.some(condition => condition);
  }

  private isHighRiskDomain(formData: AssessmentFormData): boolean {
    // Annex III high-risk AI systems
    const highRiskDomains = [
      'biometric_identification',
      'critical_infrastructure',
      'education_training',
      'employment',
      'essential_services',
      'law_enforcement',
      'migration_asylum',
      'justice_democracy',
      'safety_components'
    ];

    return highRiskDomains.some(domain => 
      formData.applicationDomain.includes(domain) ||
      formData.sector.toLowerCase().includes(domain)
    );
  }

  private async generateAIAssessment(
    formData: AssessmentFormData,
    riskScore: number,
    riskLevel: string,
    userId: string
  ): Promise<{
    reasoning: string;
    recommendations: string[];
    timeline: { immediate: string[]; short_term: string[]; long_term: string[] };
  }> {
    const systemPrompt = `Vous êtes un expert en conformité au Règlement (UE) 2024/1689 sur l'intelligence artificielle. 
    Analysez l'évaluation des risques suivante et fournissez une explication détaillée, des recommandations et un calendrier d'actions.
    
    Utilisez uniquement les informations du règlement EU AI Act et du Technical Framework v3.0 - Positive AI.
    Répondez en français et soyez précis sur les obligations légales.`;

    const prompt = `
    Système IA évalué:
    - Nom: ${formData.systemName}
    - Secteur: ${formData.sector}
    - Score de risque calculé: ${riskScore}/100
    - Niveau de risque déterminé: ${riskLevel}
    
    Données sensibles: ${formData.sensitiveData}
    Risque de discrimination: ${formData.discriminationRisk}
    Information des utilisateurs: ${formData.userInformed}
    Supervision humaine: ${formData.humanOversight}
    Impact sécurité: ${formData.safetyImpact}
    Domaine d'application: ${formData.applicationDomain}
    
    Veuillez fournir:
    1. Une explication détaillée du niveau de risque
    2. Les recommandations spécifiques pour la conformité
    3. Un calendrier d'actions (immédiat, court terme, long terme)
    
    Format de réponse JSON:
    {
      "reasoning": "Explication détaillée...",
      "recommendations": ["Recommandation 1", "Recommandation 2", ...],
      "timeline": {
        "immediate": ["Action immédiate 1", ...],
        "short_term": ["Action court terme 1", ...],
        "long_term": ["Action long terme 1", ...]
      }
    }`;

    let response = null;
    try {
      response = await llmService.generateResponse(prompt, userId, {
        systemPrompt,
        maxTokens: 2000
      });

      console.log('LLM response content:', response.content); // Debug log
      
      // Validate response content
      if (!response.content || response.content.trim().length === 0) {
        console.error('Empty LLM response received');
        return this.getFallbackAssessment(riskLevel, formData);
      }

      // Try to extract JSON from the response (LLM might wrap it in text)
      let jsonContent = response.content.trim();
      
      // Find JSON block if wrapped in code blocks or other text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonContent);
      
      // Validate structure
      if (!parsed.reasoning || !parsed.recommendations || !parsed.timeline) {
        console.error('Invalid LLM response structure:', parsed);
        return this.getFallbackAssessment(riskLevel, formData);
      }
      
      return parsed;
    } catch (error) {
      console.error('AI assessment generation failed:', error);
      console.log('Raw LLM response:', response?.content || 'No response content');
      
      // Fallback to predefined assessment
      return this.getFallbackAssessment(riskLevel, formData);
    }
  }

  private getFallbackAssessment(
    riskLevel: string,
    formData: AssessmentFormData
  ): {
    reasoning: string;
    recommendations: string[];
    timeline: { immediate: string[]; short_term: string[]; long_term: string[] };
  } {
    const assessments = {
      unacceptable: {
        reasoning: "Ce système présente des caractéristiques interdites par l'Article 5 du Règlement EU AI Act. L'utilisation de tels systèmes est prohibée dans l'UE.",
        recommendations: [
          "Cessation immédiate de l'utilisation du système",
          "Consultation juridique urgente",
          "Évaluation des alternatives conformes"
        ],
        timeline: {
          immediate: ["Arrêter le système", "Contacter un conseil juridique"],
          short_term: ["Documenter les mesures prises"],
          long_term: ["Développer une solution alternative conforme"]
        }
      },
      high: {
        reasoning: "Ce système est classé comme haut risque selon l'Annexe III du Règlement EU AI Act. Il nécessite une conformité stricte avec les obligations renforcées.",
        recommendations: [
          "Établir un système de gestion de la qualité (Article 17)",
          "Mettre en place une surveillance humaine (Article 14)",
          "Procéder à l'évaluation de conformité et marquage CE",
          "Documenter techniquement le système (Article 11)"
        ],
        timeline: {
          immediate: ["Évaluation DPIA", "Formation des équipes"],
          short_term: ["Documentation technique", "Tests et validation"],
          long_term: ["Certification CE", "Surveillance continue"]
        }
      },
      limited: {
        reasoning: "Ce système présente un risque limité nécessitant principalement des obligations de transparence selon l'Article 50.",
        recommendations: [
          "Informer clairement les utilisateurs de l'utilisation d'IA",
          "Fournir des instructions d'utilisation appropriées",
          "Documenter les capacités et limitations"
        ],
        timeline: {
          immediate: ["Mise en place de la transparence"],
          short_term: ["Documentation utilisateur"],
          long_term: ["Surveillance des performances"]
        }
      },
      minimal: {
        reasoning: "Ce système présente un risque minimal avec des obligations limitées mais doit respecter les principes généraux de l'IA éthique.",
        recommendations: [
          "Appliquer les bonnes pratiques d'IA responsable",
          "Surveiller les performances et biais potentiels",
          "Maintenir une documentation de base"
        ],
        timeline: {
          immediate: ["Vérification des bonnes pratiques"],
          short_term: ["Documentation de base"],
          long_term: ["Évaluation périodique"]
        }
      }
    };

    return assessments[riskLevel as keyof typeof assessments] || assessments.minimal;
  }

  private getObligations(
    riskLevel: string,
    formData: AssessmentFormData
  ): string[] {
    const baseObligations = [
      "Respecter les principes d'IA éthique et responsable",
      "Surveiller les performances et les biais potentiels"
    ];

    switch (riskLevel) {
      case 'unacceptable':
        return [
          "Cessation immédiate de l'utilisation (Article 5)",
          "Notification aux autorités compétentes",
          "Consultation juridique obligatoire"
        ];

      case 'high':
        return [
          ...baseObligations,
          "Système de gestion de la qualité (Article 17)",
          "Documentation technique complète (Article 11 + Annexe IV)",
          "Tenue de registres automatiques (Article 12)",
          "Transparence et informations aux déployeurs (Article 13)",
          "Surveillance humaine appropriée (Article 14)",
          "Exactitude, robustesse et cybersécurité (Article 15)",
          "Évaluation de conformité (Article 43)",
          "Marquage CE et déclaration UE de conformité (Articles 47-48)",
          "Enregistrement dans la base de données UE (Article 51)"
        ];

      case 'limited':
        return [
          ...baseObligations,
          "Information claire des utilisateurs (Article 50)",
          "Conception transparente des interactions",
          "Instructions d'utilisation appropriées"
        ];

      case 'minimal':
      default:
        return baseObligations;
    }
  }

  async saveAssessment(
    formData: AssessmentFormData,
    result: RiskAssessmentResult,
    userId: string
  ): Promise<{ aiSystemId: string; assessmentId: string }> {
    // Create or update AI system
    const aiSystemData: InsertAiSystem = {
      userId,
      name: formData.systemName,
      description: formData.description,
      sector: formData.sector,
      riskLevel: result.riskLevel,
      status: 'active',
      assessmentData: formData as any,
      complianceScore: 100 - result.riskScore, // Invert score for compliance
      lastAssessed: new Date(),
    };

    const aiSystem = await storage.createAiSystem(aiSystemData);

    // Save detailed assessment
    const assessmentData: InsertRiskAssessment = {
      aiSystemId: aiSystem.id,
      userId,
      formData: formData as any,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      recommendations: {
        reasoning: result.reasoning,
        obligations: result.obligations,
        recommendations: result.recommendations,
        timeline: result.timeline,
      } as any,
    };

    const assessment = await storage.createRiskAssessment(assessmentData);

    return {
      aiSystemId: aiSystem.id,
      assessmentId: assessment.id,
    };
  }
}

export const assessmentService = new AssessmentService();
