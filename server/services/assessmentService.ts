import { storage } from "../storage";
import { llmService } from "./llmService";
import type { 
  InsertRiskAssessment, 
  InsertAiSystem, 
  RiskAssessmentFormData,
  RiskAssessmentResult
} from "@shared/schema";

// Legacy interface kept for backward compatibility during migration
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

// Legacy interface kept for backward compatibility during migration
export interface LegacyRiskAssessmentResult {
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
  // EU AI Act Classification Engine (4 levels as per Regulation (EU) 2024/1689)
  private classifyEUAIAct(formData: AssessmentFormData): {
    riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
    reasoning: string;
    applicableArticles: string[];
    isHighRiskDomain: boolean;
    highRiskDomains?: string[];
  } {
    // LEVEL 1: UNACCEPTABLE RISK (Article 5) - Prohibited AI practices
    const prohibitedCheck = this.checkProhibitedPractices(formData);
    if (prohibitedCheck.isProhibited) {
      return {
        riskLevel: 'unacceptable',
        reasoning: prohibitedCheck.reasoning,
        applicableArticles: ['Article 5'],
        isHighRiskDomain: false,
      };
    }

    // LEVEL 2: HIGH RISK (Annex III) - 8 high-risk domains 
    const highRiskCheck = this.checkHighRiskDomains(formData);
    if (highRiskCheck.isHighRisk) {
      return {
        riskLevel: 'high',
        reasoning: highRiskCheck.reasoning,
        applicableArticles: ['Article 6', 'Annexe III', 'Titre III Chapitre 2 (Articles 8-51)'],
        isHighRiskDomain: true,
        highRiskDomains: highRiskCheck.domains,
      };
    }

    // LEVEL 3: LIMITED RISK - Transparency obligations
    const limitedRiskCheck = this.checkLimitedRisk(formData);
    if (limitedRiskCheck.isLimitedRisk) {
      return {
        riskLevel: 'limited',
        reasoning: limitedRiskCheck.reasoning,
        applicableArticles: ['Article 50'],
        isHighRiskDomain: false,
      };
    }

    // LEVEL 4: MINIMAL RISK - No specific obligations
    return {
      riskLevel: 'minimal',
      reasoning: 'Le système IA ne présente pas de risques spécifiques identifiés par le Règlement EU AI Act. Aucune obligation légale particulière ne s\'applique.',
      applicableArticles: [],
      isHighRiskDomain: false,
    };
  }

  private checkProhibitedPractices(formData: AssessmentFormData): {
    isProhibited: boolean;
    reasoning: string;
  } {
    const prohibitedScenarios = [];

    // Article 5(1)(a) - Subliminal techniques or manipulative techniques
    if (formData.applicationDomain.toLowerCase().includes('subliminal') ||
        formData.applicationDomain.toLowerCase().includes('manipulation') ||
        formData.applicationDomain.toLowerCase().includes('cognitive behavioral') ||
        (formData.userInformed === 'none' && formData.autonomyLevel === 'high')) {
      prohibitedScenarios.push('Techniques subliminales ou manipulatrices (Article 5(1)(a))');
    }

    // Article 5(1)(b) - Social scoring by public authorities
    if (formData.applicationDomain.toLowerCase().includes('social scoring') ||
        formData.applicationDomain.toLowerCase().includes('social credit') ||
        formData.applicationDomain.toLowerCase().includes('citizen rating') ||
        (formData.sector.toLowerCase().includes('government') && 
         formData.applicationDomain.toLowerCase().includes('scoring'))) {
      prohibitedScenarios.push('Notation sociale par les autorités publiques (Article 5(1)(b))');
    }

    // Article 5(1)(c) - Biometric categorisation based on sensitive characteristics
    if ((formData.applicationDomain.toLowerCase().includes('biometric') &&
         (formData.applicationDomain.toLowerCase().includes('race') ||
          formData.applicationDomain.toLowerCase().includes('religion') ||
          formData.applicationDomain.toLowerCase().includes('sexual') ||
          formData.applicationDomain.toLowerCase().includes('political'))) ||
        (formData.sensitiveData === 'yes' && formData.discriminationRisk === 'high')) {
      prohibitedScenarios.push('Catégorisation biométrique sur des caractéristiques sensibles (Article 5(1)(c))');
    }

    // Article 5(1)(d) - Real-time biometric identification in public spaces (with law enforcement context)
    if (formData.applicationDomain.toLowerCase().includes('real-time biometric') ||
        (formData.applicationDomain.toLowerCase().includes('biometric identification') &&
         formData.geographicalScope !== 'local' &&
         formData.safetyImpact === 'critical' &&
         !formData.sector.toLowerCase().includes('law') &&
         !formData.sector.toLowerCase().includes('security') &&
         !formData.applicationDomain.toLowerCase().includes('law enforcement'))) {
      prohibitedScenarios.push('Identification biométrique en temps réel dans espaces publics (Article 5(1)(d))');
    }

    // Article 5(1)(e) - Exploitation of vulnerabilities due to age, disability, or social/economic situation
    if ((formData.applicationDomain.toLowerCase().includes('children') ||
         formData.applicationDomain.toLowerCase().includes('elderly') ||
         formData.applicationDomain.toLowerCase().includes('disability') ||
         formData.applicationDomain.toLowerCase().includes('vulnerable')) &&
        (formData.discriminationRisk === 'high' || formData.autonomyLevel === 'high')) {
      prohibitedScenarios.push('Exploitation de vulnérabilités liées à l\'âge, handicap ou situation sociale (Article 5(1)(e))');
    }

    // Article 5(1)(f) - Untargeted scraping of facial images
    if (formData.applicationDomain.toLowerCase().includes('facial scraping') ||
        formData.applicationDomain.toLowerCase().includes('facial recognition database') ||
        (formData.applicationDomain.toLowerCase().includes('facial') && 
         formData.applicationDomain.toLowerCase().includes('scraping'))) {
      prohibitedScenarios.push('Collecte non ciblée d\'images faciales (Article 5(1)(f))');
    }

    if (prohibitedScenarios.length > 0) {
      return {
        isProhibited: true,
        reasoning: `PRATIQUE INTERDITE : Ce système IA utilise des pratiques explicitement prohibées par l'Article 5 du Règlement EU AI Act : ${prohibitedScenarios.join('; ')}. L'utilisation de ce système est INTERDITE dans l'Union européenne.`
      };
    }

    return { isProhibited: false, reasoning: '' };
  }

  private checkHighRiskDomains(formData: AssessmentFormData): {
    isHighRisk: boolean;
    reasoning: string;
    domains: string[];
  } {
    const applicableDomains = [];
    
    // Annex III High-risk AI systems (8 domains)
    const domainChecks = [
      {
        domain: 'Biometric identification and categorisation',
        check: () => formData.applicationDomain.toLowerCase().includes('biometric') ||
                     formData.applicationDomain.toLowerCase().includes('identification') ||
                     formData.applicationDomain.toLowerCase().includes('verification')
      },
      {
        domain: 'Management of critical infrastructure',
        check: () => formData.sector.toLowerCase().includes('energy') ||
                     formData.sector.toLowerCase().includes('transport') ||
                     formData.sector.toLowerCase().includes('water') ||
                     formData.sector.toLowerCase().includes('critical_infrastructure') ||
                     formData.safetyImpact === 'critical'
      },
      {
        domain: 'Education and vocational training',
        check: () => formData.sector.toLowerCase().includes('education') ||
                     formData.sector.toLowerCase().includes('training') ||
                     formData.applicationDomain.toLowerCase().includes('student') ||
                     formData.applicationDomain.toLowerCase().includes('learning')
      },
      {
        domain: 'Employment, workers management and access to self-employment',
        check: () => formData.applicationDomain.toLowerCase().includes('recruitment') ||
                     formData.applicationDomain.toLowerCase().includes('employment') ||
                     formData.applicationDomain.toLowerCase().includes('hr') ||
                     formData.applicationDomain.toLowerCase().includes('hiring')
      },
      {
        domain: 'Access to and enjoyment of essential services',
        check: () => formData.sector.toLowerCase().includes('healthcare') ||
                     formData.sector.toLowerCase().includes('finance') ||
                     formData.sector.toLowerCase().includes('banking') ||
                     formData.applicationDomain.toLowerCase().includes('credit') ||
                     formData.applicationDomain.toLowerCase().includes('insurance')
      },
      {
        domain: 'Law enforcement',
        check: () => formData.sector.toLowerCase().includes('law enforcement') ||
                     formData.sector.toLowerCase().includes('police') ||
                     formData.applicationDomain.toLowerCase().includes('crime') ||
                     formData.applicationDomain.toLowerCase().includes('forensic')
      },
      {
        domain: 'Migration, asylum and border control',
        check: () => formData.applicationDomain.toLowerCase().includes('migration') ||
                     formData.applicationDomain.toLowerCase().includes('asylum') ||
                     formData.applicationDomain.toLowerCase().includes('border') ||
                     formData.applicationDomain.toLowerCase().includes('visa')
      },
      {
        domain: 'Administration of justice and democratic processes',
        check: () => formData.sector.toLowerCase().includes('justice') ||
                     formData.sector.toLowerCase().includes('government') ||
                     formData.applicationDomain.toLowerCase().includes('court') ||
                     formData.applicationDomain.toLowerCase().includes('legal')
      }
    ];

    for (const domainCheck of domainChecks) {
      if (domainCheck.check()) {
        applicableDomains.push(domainCheck.domain);
      }
    }

    if (applicableDomains.length > 0) {
      return {
        isHighRisk: true,
        reasoning: `HAUT RISQUE : Ce système IA opère dans ${applicableDomains.length > 1 ? 'les domaines' : 'le domaine'} à haut risque suivant${applicableDomains.length > 1 ? 's' : ''} défini${applicableDomains.length > 1 ? 's' : ''} par l'Annexe III : ${applicableDomains.join(', ')}. Il est soumis aux obligations strictes des Articles 8-15 (avant mise sur le marché) et Articles 16-27 (obligations continues).`,
        domains: applicableDomains
      };
    }

    return { isHighRisk: false, reasoning: '', domains: [] };
  }

  private checkLimitedRisk(formData: AssessmentFormData): {
    isLimitedRisk: boolean;
    reasoning: string;
  } {
    const transparencyTriggers = [];

    // Article 50 - Transparency obligations
    if (formData.applicationDomain.toLowerCase().includes('chatbot') ||
        formData.applicationDomain.toLowerCase().includes('conversational') ||
        formData.userInformed === 'none' ||
        formData.userInformed === 'partial') {
      transparencyTriggers.push('Interaction avec des personnes physiques');
    }

    if (formData.applicationDomain.toLowerCase().includes('emotion') ||
        formData.applicationDomain.toLowerCase().includes('deepfake') ||
        formData.applicationDomain.toLowerCase().includes('synthetic')) {
      transparencyTriggers.push('Reconnaissance d\'émotions ou catégorisation biométrique');
    }

    if (formData.applicationDomain.toLowerCase().includes('content generation') ||
        formData.applicationDomain.toLowerCase().includes('text generation') ||
        formData.applicationDomain.toLowerCase().includes('image generation')) {
      transparencyTriggers.push('Génération de contenu artificiel');
    }

    if (transparencyTriggers.length > 0 || 
        (formData.explainabilityLevel === 'low' && formData.autonomyLevel === 'high')) {
      return {
        isLimitedRisk: true,
        reasoning: `RISQUE LIMITÉ : Ce système IA nécessite des obligations de transparence selon l'Article 50 du fait de : ${transparencyTriggers.length > 0 ? transparencyTriggers.join(', ') : 'son niveau d\'autonomie élevé avec faible explicabilité'}. Les utilisateurs doivent être clairement informés qu'ils interagissent avec un système IA.`
      };
    }

    return { isLimitedRisk: false, reasoning: '' };
  }

  async performRiskAssessment(
    formData: AssessmentFormData,
    userId: string
  ): Promise<LegacyRiskAssessmentResult> {
    // ✅ NEW: Explicit EU AI Act Classification (Tier 1)
    const euAiActClassification = this.classifyEUAIAct(formData);
    
    // ✅ NEW: Calculate Framework risk score (Tier 2) 
    const frameworkRiskScore = this.calculateRiskScore(formData);
    
    // ✅ NEW: Combined assessment - EU AI Act level takes precedence
    const finalRiskLevel = euAiActClassification.riskLevel;
    const combinedRiskScore = Math.max(
      frameworkRiskScore,
      this.mapEUAiActLevelToScore(euAiActClassification.riskLevel)
    );

    // Generate AI-powered assessment with enhanced context
    const enhancedContext = `
    EU AI Act Classification: ${euAiActClassification.riskLevel.toUpperCase()}
    EU AI Act Reasoning: ${euAiActClassification.reasoning}
    Framework Risk Score: ${frameworkRiskScore}/100
    Combined Risk Score: ${combinedRiskScore}/100
    `;
    
    const aiAssessment = await this.generateAIAssessment(
      formData, 
      combinedRiskScore, 
      finalRiskLevel, 
      userId,
      enhancedContext
    );

    // Determine obligations based on EU AI Act classification
    const obligations = this.getEUAiActObligations(euAiActClassification);

    return {
      riskLevel: finalRiskLevel,
      riskScore: combinedRiskScore,
      reasoning: `${euAiActClassification.reasoning}\n\n${aiAssessment.reasoning}`,
      obligations,
      recommendations: aiAssessment.recommendations,
      timeline: aiAssessment.timeline,
    };
  }

  private mapEUAiActLevelToScore(level: 'minimal' | 'limited' | 'high' | 'unacceptable'): number {
    switch (level) {
      case 'unacceptable': return 100;
      case 'high': return 85;
      case 'limited': return 60;
      case 'minimal': return 25;
      default: return 25;
    }
  }

  private getEUAiActObligations(classification: {
    riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
    reasoning: string;
    applicableArticles: string[];
    isHighRiskDomain: boolean;
    highRiskDomains?: string[];
  }): string[] {
    const obligations: string[] = [];

    switch (classification.riskLevel) {
      case 'unacceptable':
        obligations.push(
          "🚫 INTERDICTION ABSOLUE : L'utilisation de ce système est INTERDITE dans l'UE",
          "⚠️ Article 5 : Cessation immédiate de toute utilisation",
          "📋 Notification obligatoire aux autorités compétentes",
          "🏛️ Risque de sanctions pénales et administratives"
        );
        break;

      case 'high':
        obligations.push(
          "📋 Article 17 : Système de gestion de la qualité obligatoire",
          "📊 Article 11 : Documentation technique et tenue de registres",
          "🗂️ Article 12 : Tenue de registres automatiques",
          "🔍 Article 13 : Transparence et information des utilisateurs déployeurs",
          "👥 Article 14 : Supervision humaine appropriée",
          "⚡ Article 15 : Exactitude, robustesse et cybersécurité",
          "🔐 Article 10 : Gestion des données et gouvernance des données",
          "✅ Articles 43-51 : Évaluation de conformité avant mise sur le marché",
          "🏷️ Article 48 : Marquage CE et déclaration de conformité UE"
        );
        if (classification.highRiskDomains) {
          obligations.push(`🎯 Domaines concernés : ${classification.highRiskDomains.join(', ')}`);
        }
        break;

      case 'limited':
        obligations.push(
          "🔔 Article 50 : Information claire des utilisateurs sur l'interaction IA",
          "📝 Conception permettant l'information automatique",
          "👤 Interface utilisateur transparente sur la nature IA",
          "📋 Instructions d'utilisation appropriées"
        );
        break;

      case 'minimal':
      default:
        obligations.push(
          "✅ Aucune obligation spécifique EU AI Act",
          "🔄 Surveillance continue des évolutions réglementaires recommandée",
          "📊 Bonnes pratiques d'IA éthique encouragées"
        );
        break;
    }

    return obligations;
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
    userId: string,
    enhancedContext?: string
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
    
    ${enhancedContext ? `Classification détaillée:\n${enhancedContext}` : ''}
    
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
    result: LegacyRiskAssessmentResult,
    userId: string
  ): Promise<{ aiSystemId: string; assessmentId: string }> {
    // ✅ NEW: Get explicit EU AI Act classification for proper storage
    const euAiActClassification = this.classifyEUAIAct(formData);
    
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

    // ✅ UPDATED: Map data to new risk assessment structure with proper EU AI Act classification
    const assessmentData: InsertRiskAssessment = {
      aiSystemId: aiSystem.id,
      userId,
      // Basic system information
      systemName: formData.systemName,
      organizationName: `Organisation (${formData.systemName})`, // Temporary fallback
      systemDescription: formData.description,
      
      // ✅ NEW: Proper EU AI Act Classification (Tier 1) - FIXED the issue identified by architect
      euAiActRiskLevel: euAiActClassification.riskLevel, // Now using actual EU AI Act classification instead of legacy
      euAiActClassification: {
        reasoning: euAiActClassification.reasoning,
        applicableArticles: euAiActClassification.applicableArticles,
        isHighRiskDomain: euAiActClassification.isHighRiskDomain,
        highRiskDomains: euAiActClassification.highRiskDomains || []
      } as any,
      isHighRiskDomain: euAiActClassification.isHighRiskDomain,
      highRiskDomains: euAiActClassification.highRiskDomains || [],
      
      // Framework v3.0 Assessment (Tier 2) - Empty for now, will be populated with new form
      frameworkResponses: {}, // Will contain responses per dimension when new form is implemented
      dimensionScores: {}, // Will contain scores per dimension when new form is implemented
      overallFrameworkScore: this.calculateRiskScore(formData), // Current framework score
      
      // Combined Assessment Results
      formData: formData as any,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      reasoning: result.reasoning,
      
      // EU AI Act Compliance
      applicableObligations: result.obligations,
      complianceScore: 100 - result.riskScore,
      
      // Recommendations and Timeline
      recommendations: {
        reasoning: result.reasoning,
        obligations: result.obligations,
        recommendations: result.recommendations,
        timeline: result.timeline,
      } as any,
      actionPlan: {
        immediate: result.timeline.immediate,
        short_term: result.timeline.short_term,
        long_term: result.timeline.long_term
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
