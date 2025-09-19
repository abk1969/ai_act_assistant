import { storage } from "../storage";
import { llmService } from "./llmService";
import type { 
  InsertRiskAssessment, 
  InsertAiSystem, 
  RiskAssessmentFormData,
  RiskAssessmentResult,
  FrameworkAssessmentData,
  FrameworkAssessmentResult
} from "@shared/schema";

// Normalized input interface for EU AI Act classification
export interface EUAiActInput {
  // System context
  systemName: string;
  sector: string;
  applicationDomain: string;
  userCategories: string[];
  geographicalScope: 'eu' | 'national' | 'local';
  
  // Risk assessment signals
  sensitiveData: 'yes' | 'limited' | 'no';
  discriminationRisk: 'high' | 'medium' | 'low';
  userInformed: 'full' | 'partial' | 'none';
  explainabilityLevel: 'high' | 'medium' | 'low';
  humanOversight: 'full' | 'intermittent' | 'minimal';
  overrideCapability: 'yes' | 'limited' | 'no';
  autonomyLevel: 'high' | 'medium' | 'low';
  safetyImpact: 'critical' | 'significant' | 'minimal';
  decisionConsequences: 'irreversible' | 'reversible' | 'advisory';
}

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
  // Adaptateurs pour convertir vers EUAiActInput normalisé
  private adaptFromLegacyFormat(formData: AssessmentFormData): EUAiActInput {
    return {
      systemName: formData.systemName,
      sector: formData.sector,
      applicationDomain: formData.applicationDomain,
      userCategories: formData.userCategories,
      geographicalScope: formData.geographicalScope,
      sensitiveData: formData.sensitiveData,
      discriminationRisk: formData.discriminationRisk,
      userInformed: formData.userInformed,
      explainabilityLevel: formData.explainabilityLevel,
      humanOversight: formData.humanOversight,
      overrideCapability: formData.overrideCapability,
      autonomyLevel: formData.autonomyLevel,
      safetyImpact: formData.safetyImpact,
      decisionConsequences: formData.decisionConsequences,
    };
  }

  private adaptFromFrameworkV3(formData: RiskAssessmentFormData): EUAiActInput {
    // Dériver les signaux EU AI Act des réponses Framework v3.0
    const transparencyScore = this.getDimensionScoreFromResponses(formData.frameworkResponses, 'transparency_explainability');
    const oversightScore = this.getDimensionScoreFromResponses(formData.frameworkResponses, 'human_ai_interaction');
    const robustnessScore = this.getDimensionScoreFromResponses(formData.frameworkResponses, 'technical_robustness_security');
    const fairnessScore = this.getDimensionScoreFromResponses(formData.frameworkResponses, 'justice_fairness');
    
    // Mapper les scores Framework v3.0 vers niveaux catégoriels EU AI Act (≥70 → high, 40–69 → medium, else low)
    const scoreToLevel = (score: number): 'high' | 'medium' | 'low' => {
      if (score >= 70) return 'high';
      if (score >= 40) return 'medium';
      return 'low';
    };
    
    const scoreToRisk = (score: number): 'high' | 'medium' | 'low' => {
      if (score < 40) return 'high';  // Inversé pour le risque
      if (score < 70) return 'medium';
      return 'low';
    };
    
    return {
      systemName: formData.systemName,
      sector: formData.industrySector || 'technology_software',
      applicationDomain: formData.applicationDomain,
      userCategories: formData.userCategories,
      geographicalScope: formData.geographicalScope,
      
      // Dériver des Framework v3.0 responses avec mapping intelligent
      sensitiveData: formData.sensitiveData || (fairnessScore < 50 ? 'yes' : 'limited'),
      discriminationRisk: scoreToRisk(fairnessScore),
      userInformed: formData.userInformed || (transparencyScore >= 70 ? 'full' : transparencyScore >= 40 ? 'partial' : 'none'),
      explainabilityLevel: scoreToLevel(transparencyScore),
      humanOversight: formData.humanOversight || (oversightScore >= 70 ? 'full' : oversightScore >= 40 ? 'intermittent' : 'minimal'),
      overrideCapability: formData.overrideCapability || (oversightScore >= 60 ? 'yes' : 'limited'),
      autonomyLevel: formData.autonomyLevel || scoreToLevel(100 - oversightScore), // Autonomie inversement corrélée à la supervision
      safetyImpact: formData.safetyImpact || (robustnessScore < 40 ? 'critical' : robustnessScore < 70 ? 'significant' : 'minimal'),
      decisionConsequences: formData.decisionConsequences || (fairnessScore < 40 ? 'irreversible' : 'reversible'),
    };
  }

  private getDimensionScoreFromResponses(responses: Record<string, number>, dimension: string): number {
    // Calculer le score moyen pour une dimension à partir des réponses
    if (!responses || typeof responses !== 'object') {
      return 50; // Score par défaut si responses n'est pas valide
    }
    const dimensionQuestions = Object.keys(responses).filter(key => key.startsWith(dimension));
    if (dimensionQuestions.length === 0) return 50; // Score par défaut
    
    const totalScore = dimensionQuestions.reduce((sum, key) => sum + (responses[key] || 0), 0);
    return Math.round((totalScore / dimensionQuestions.length) * 20); // Convert 1-5 scale to 0-100
  }

  // EU AI Act Classification Engine (4 levels as per Regulation (EU) 2024/1689)
  private classifyEUAIAct(input: EUAiActInput): {
    riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
    reasoning: string;
    applicableArticles: string[];
    isHighRiskDomain: boolean;
    highRiskDomains?: string[];
  } {
    // LEVEL 1: UNACCEPTABLE RISK (Article 5) - Prohibited AI practices
    const prohibitedCheck = this.checkProhibitedPractices(input);
    if (prohibitedCheck.isProhibited) {
      return {
        riskLevel: 'unacceptable',
        reasoning: prohibitedCheck.reasoning,
        applicableArticles: ['Article 5'],
        isHighRiskDomain: false,
      };
    }

    // LEVEL 2: HIGH RISK (Annex III) - 8 high-risk domains 
    const highRiskCheck = this.checkHighRiskDomains(input);
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
    const limitedRiskCheck = this.checkLimitedRisk(input);
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

  private checkProhibitedPractices(input: EUAiActInput): {
    isProhibited: boolean;
    reasoning: string;
  } {
    const prohibitedScenarios = [];

    // Article 5(1)(a) - Subliminal techniques or manipulative techniques
    if (input.applicationDomain.toLowerCase().includes('subliminal') ||
        input.applicationDomain.toLowerCase().includes('manipulation') ||
        input.applicationDomain.toLowerCase().includes('cognitive behavioral') ||
        (input.userInformed === 'none' && input.autonomyLevel === 'high')) {
      prohibitedScenarios.push('Techniques subliminales ou manipulatrices (Article 5(1)(a))');
    }

    // Article 5(1)(b) - Social scoring by public authorities
    if (input.applicationDomain.toLowerCase().includes('social scoring') ||
        input.applicationDomain.toLowerCase().includes('social credit') ||
        input.applicationDomain.toLowerCase().includes('citizen rating') ||
        (input.sector.toLowerCase().includes('government') && 
         input.applicationDomain.toLowerCase().includes('scoring'))) {
      prohibitedScenarios.push('Notation sociale par les autorités publiques (Article 5(1)(b))');
    }

    // Article 5(1)(c) - Biometric categorisation based on sensitive characteristics
    if ((input.applicationDomain.toLowerCase().includes('biometric') &&
         (input.applicationDomain.toLowerCase().includes('race') ||
          input.applicationDomain.toLowerCase().includes('religion') ||
          input.applicationDomain.toLowerCase().includes('sexual') ||
          input.applicationDomain.toLowerCase().includes('political'))) ||
        (input.sensitiveData === 'yes' && input.discriminationRisk === 'high')) {
      prohibitedScenarios.push('Catégorisation biométrique sur des caractéristiques sensibles (Article 5(1)(c))');
    }

    // Article 5(1)(d) - Real-time biometric identification in public spaces (with law enforcement context)
    if (input.applicationDomain.toLowerCase().includes('real-time biometric') ||
        (input.applicationDomain.toLowerCase().includes('biometric identification') &&
         input.geographicalScope !== 'local' &&
         input.safetyImpact === 'critical' &&
         !input.sector.toLowerCase().includes('law') &&
         !input.sector.toLowerCase().includes('security') &&
         !input.applicationDomain.toLowerCase().includes('law enforcement'))) {
      prohibitedScenarios.push('Identification biométrique en temps réel dans espaces publics (Article 5(1)(d))');
    }

    // Article 5(1)(e) - Exploitation of vulnerabilities due to age, disability, or social/economic situation
    if ((input.applicationDomain.toLowerCase().includes('children') ||
         input.applicationDomain.toLowerCase().includes('elderly') ||
         input.applicationDomain.toLowerCase().includes('disability') ||
         input.applicationDomain.toLowerCase().includes('vulnerable')) &&
        (input.discriminationRisk === 'high' || input.autonomyLevel === 'high')) {
      prohibitedScenarios.push('Exploitation de vulnérabilités liées à l\'âge, handicap ou situation sociale (Article 5(1)(e))');
    }

    // Article 5(1)(f) - Untargeted scraping of facial images
    if (input.applicationDomain.toLowerCase().includes('facial scraping') ||
        input.applicationDomain.toLowerCase().includes('facial recognition database') ||
        (input.applicationDomain.toLowerCase().includes('facial') && 
         input.applicationDomain.toLowerCase().includes('scraping'))) {
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

  private checkHighRiskDomains(input: EUAiActInput): {
    isHighRisk: boolean;
    reasoning: string;
    domains: string[];
  } {
    const applicableDomains = [];
    
    // Annex III High-risk AI systems (8 domains)
    const domainChecks = [
      {
        domain: 'Biometric identification and categorisation',
        check: () => input.applicationDomain.toLowerCase().includes('biometric') ||
                     input.applicationDomain.toLowerCase().includes('identification') ||
                     input.applicationDomain.toLowerCase().includes('verification')
      },
      {
        domain: 'Management of critical infrastructure',
        check: () => input.sector.toLowerCase().includes('energy') ||
                     input.sector.toLowerCase().includes('transport') ||
                     input.sector.toLowerCase().includes('water') ||
                     input.sector.toLowerCase().includes('critical_infrastructure') ||
                     input.safetyImpact === 'critical'
      },
      {
        domain: 'Education and vocational training',
        check: () => input.sector.toLowerCase().includes('education') ||
                     input.sector.toLowerCase().includes('training') ||
                     input.applicationDomain.toLowerCase().includes('student') ||
                     input.applicationDomain.toLowerCase().includes('learning')
      },
      {
        domain: 'Employment, workers management and access to self-employment',
        check: () => input.applicationDomain.toLowerCase().includes('recruitment') ||
                     input.applicationDomain.toLowerCase().includes('employment') ||
                     input.applicationDomain.toLowerCase().includes('hr') ||
                     input.applicationDomain.toLowerCase().includes('hiring')
      },
      {
        domain: 'Access to and enjoyment of essential services',
        check: () => input.sector.toLowerCase().includes('healthcare') ||
                     input.sector.toLowerCase().includes('finance') ||
                     input.sector.toLowerCase().includes('banking') ||
                     input.applicationDomain.toLowerCase().includes('credit') ||
                     input.applicationDomain.toLowerCase().includes('insurance')
      },
      {
        domain: 'Law enforcement',
        check: () => input.sector.toLowerCase().includes('law enforcement') ||
                     input.sector.toLowerCase().includes('police') ||
                     input.applicationDomain.toLowerCase().includes('crime') ||
                     input.applicationDomain.toLowerCase().includes('forensic')
      },
      {
        domain: 'Migration, asylum and border control',
        check: () => input.applicationDomain.toLowerCase().includes('migration') ||
                     input.applicationDomain.toLowerCase().includes('asylum') ||
                     input.applicationDomain.toLowerCase().includes('border') ||
                     input.applicationDomain.toLowerCase().includes('visa')
      },
      {
        domain: 'Administration of justice and democratic processes',
        check: () => input.sector.toLowerCase().includes('justice') ||
                     input.sector.toLowerCase().includes('government') ||
                     input.applicationDomain.toLowerCase().includes('court') ||
                     input.applicationDomain.toLowerCase().includes('legal')
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

  private checkLimitedRisk(input: EUAiActInput): {
    isLimitedRisk: boolean;
    reasoning: string;
  } {
    const transparencyTriggers = [];

    // Article 50 - Transparency obligations
    if (input.applicationDomain.toLowerCase().includes('chatbot') ||
        input.applicationDomain.toLowerCase().includes('conversational') ||
        input.userInformed === 'none' ||
        input.userInformed === 'partial') {
      transparencyTriggers.push('Interaction avec des personnes physiques');
    }

    if (input.applicationDomain.toLowerCase().includes('emotion') ||
        input.applicationDomain.toLowerCase().includes('deepfake') ||
        input.applicationDomain.toLowerCase().includes('synthetic')) {
      transparencyTriggers.push('Reconnaissance d\'émotions ou catégorisation biométrique');
    }

    if (input.applicationDomain.toLowerCase().includes('content generation') ||
        input.applicationDomain.toLowerCase().includes('text generation') ||
        input.applicationDomain.toLowerCase().includes('image generation')) {
      transparencyTriggers.push('Génération de contenu artificiel');
    }

    if (transparencyTriggers.length > 0 || 
        (input.explainabilityLevel === 'low' && input.autonomyLevel === 'high')) {
      return {
        isLimitedRisk: true,
        reasoning: `RISQUE LIMITÉ : Ce système IA nécessite des obligations de transparence selon l'Article 50 du fait de : ${transparencyTriggers.length > 0 ? transparencyTriggers.join(', ') : 'son niveau d\'autonomie élevé avec faible explicabilité'}. Les utilisateurs doivent être clairement informés qu'ils interagissent avec un système IA.`
      };
    }

    return { isLimitedRisk: false, reasoning: '' };
  }

  // ✅ ENHANCED: Now supports both legacy and Framework v3.0 formats
  async performRiskAssessment(
    formData: AssessmentFormData | RiskAssessmentFormData,
    userId: string
  ): Promise<LegacyRiskAssessmentResult | RiskAssessmentResult> {
    // Check if this is Framework v3.0 format
    if (this.isFrameworkV3Format(formData)) {
      return await this.assessCombined(formData as RiskAssessmentFormData);
    }
    
    // Legacy assessment for backward compatibility
    return await this.performLegacyAssessment(formData as AssessmentFormData, userId);
  }

  private isFrameworkV3Format(formData: any): boolean {
    return formData.frameworkResponses !== undefined || 
           formData.organizationName !== undefined ||
           (formData.systemName !== undefined && formData.sector === undefined);
  }

  private async performLegacyAssessment(
    formData: AssessmentFormData,
    userId: string
  ): Promise<LegacyRiskAssessmentResult> {
    // ✅ NEW: Explicit EU AI Act Classification (Tier 1)
    const euAiActClassification = this.classifyEUAIAct(this.adaptFromLegacyFormat(formData));
    
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
    formData: RiskAssessmentFormData
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
    const euAiActClassification = this.classifyEUAIAct(this.adaptFromLegacyFormat(formData));
    
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

  // ✅ NEW: Positive AI Framework v3.0 Assessment Engine
  async assessFrameworkV3(assessmentData: FrameworkAssessmentData): Promise<FrameworkAssessmentResult> {
    // Framework v3.0 - 7 dimensions scoring
    const dimensionResults: Record<string, any> = {};
    
    // 1. Calculate scores for each dimension
    for (const dimension of this.getFrameworkDimensions()) {
      dimensionResults[dimension.id] = await this.calculateDimensionScore(
        dimension,
        assessmentData.responses[dimension.id] || {}
      );
    }
    
    // 2. Calculate overall weighted score
    const overallScore = this.calculateOverallFrameworkScore(dimensionResults);
    const overallLevel = this.getPerformanceLevel(overallScore);
    
    // 3. Assess risk levels
    const { customerRisk, employeeRisk } = this.assessFrameworkRisks(dimensionResults);
    
    // 4. Generate priority actions
    const priorityActions = this.generatePriorityActions(dimensionResults);
    
    // 5. Generate recommendations
    const recommendations = this.generateFrameworkRecommendations(dimensionResults);
    
    return {
      dimensionResults,
      overallScore,
      overallLevel,
      customerRisk,
      employeeRisk,
      priorityActions,
      recommendations,
      assessmentVersion: '3.0'
    };
  }

  private getFrameworkDimensions() {
    return [
      {
        id: 'justice_fairness',
        name: 'Justice & Fairness',
        weight: 20, // Higher weight for critical dimension
        strategies: [
          'data_biases_identified_mitigated',
          'design_biases_identified_mitigated', 
          'biased_results_identified_mitigated',
          'bias_monitoring',
          'stakeholder_engagement'
        ]
      },
      {
        id: 'transparency_explainability',
        name: 'Transparency & Explainability',
        weight: 18,
        strategies: [
          'algorithmic_transparency',
          'decision_transparency',
          'process_transparency'
        ]
      },
      {
        id: 'human_ai_interaction',
        name: 'Human-AI Interaction',
        weight: 16,
        strategies: [
          'human_oversight_control',
          'meaningful_human_control',
          'user_empowerment'
        ]
      },
      {
        id: 'social_environmental_impact',
        name: 'Social & Environmental Impact',
        weight: 15,
        strategies: [
          'sustainably_developed_by_design',
          'promoting_positive_outcomes',
          'avoidance_of_societal_harms'
        ]
      },
      {
        id: 'responsibility',
        name: 'Responsibility',
        weight: 12,
        strategies: [
          'collection_data_traceable_requirements',
          'license_of_data',
          'protected_from_disclosure',
          'approaches_privacy_preservation',
          'accountability_governance'
        ]
      },
      {
        id: 'data_privacy',
        name: 'Data & Privacy',
        weight: 10,
        strategies: [
          'data_minimization',
          'purpose_limitation',
          'consent_management',
          'security_protection',
          'rights_management'
        ]
      },
      {
        id: 'technical_robustness_security',
        name: 'Technical Robustness & Security',
        weight: 9,
        strategies: [
          'accuracy_reliability',
          'fallback_procedures',
          'security_resilience'
        ]
      }
    ];
  }

  private async calculateDimensionScore(
    dimension: any,
    responses: Record<string, number>
  ): Promise<any> {
    let totalScore = 0;
    let totalWeight = 0;
    const strategyResults: Record<string, any> = {};
    
    // Calculate score for each strategy in the dimension
    for (const strategy of dimension.strategies) {
      const strategyScore = this.calculateStrategyScore(strategy, responses);
      const strategyWeight = 100 / dimension.strategies.length; // Equal weight for now
      
      strategyResults[strategy] = {
        score: strategyScore,
        level: this.getPerformanceLevel(strategyScore),
        strengths: this.getStrategyStrengths(strategy, strategyScore),
        improvements: this.getStrategyImprovements(strategy, strategyScore)
      };
      
      totalScore += strategyScore * strategyWeight;
      totalWeight += strategyWeight;
    }
    
    const dimensionScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    return {
      score: Math.round(dimensionScore),
      level: this.getPerformanceLevel(dimensionScore),
      strategyResults,
      overallStrengths: this.getDimensionStrengths(dimension.id, dimensionScore),
      overallImprovements: this.getDimensionImprovements(dimension.id, dimensionScore)
    };
  }

  private calculateStrategyScore(strategy: string, responses: Record<string, number>): number {
    // Get questions for this strategy (simplified - in real implementation would query database)
    const strategyQuestions = this.getStrategyQuestions(strategy);
    
    let totalScore = 0;
    let questionCount = 0;
    
    for (const questionId of strategyQuestions) {
      if (responses[questionId] !== undefined) {
        // Convert 1-5 scale to 0-100
        totalScore += ((responses[questionId] - 1) / 4) * 100;
        questionCount++;
      }
    }
    
    return questionCount > 0 ? totalScore / questionCount : 0;
  }

  private getStrategyQuestions(strategy: string): string[] {
    // Simplified mapping - in real implementation would query framework_questions table
    const strategyQuestionMap: Record<string, string[]> = {
      'data_biases_identified_mitigated': ['justice_1_1', 'justice_1_2', 'justice_1_3'],
      'design_biases_identified_mitigated': ['justice_2_1', 'justice_2_2'],
      'biased_results_identified_mitigated': ['justice_3_1', 'justice_3_2'],
      'bias_monitoring': ['justice_4_1', 'justice_4_2'],
      'stakeholder_engagement': ['justice_5_1'],
      // Add other strategies...
    };
    
    return strategyQuestionMap[strategy] || [];
  }

  private calculateOverallFrameworkScore(dimensionResults: Record<string, any>): number {
    const dimensions = this.getFrameworkDimensions();
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const dimension of dimensions) {
      const result = dimensionResults[dimension.id];
      if (result) {
        totalWeightedScore += result.score * dimension.weight;
        totalWeight += dimension.weight;
      }
    }
    
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  private assessFrameworkRisks(dimensionResults: Record<string, any>): {
    customerRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
    employeeRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  } {
    // Assess risk based on dimension scores
    const criticalDimensions = ['justice_fairness', 'transparency_explainability', 'human_ai_interaction'];
    let maxCustomerRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical' = 'none';
    let maxEmployeeRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical' = 'none';
    
    for (const [dimId, result] of Object.entries(dimensionResults)) {
      const riskLevel = this.scoreToRiskLevel(result.score);
      
      // Higher risk for critical dimensions
      if (criticalDimensions.includes(dimId)) {
        if (this.riskLevelToNumber(riskLevel) > this.riskLevelToNumber(maxCustomerRisk)) {
          maxCustomerRisk = riskLevel;
        }
      }
      
      if (this.riskLevelToNumber(riskLevel) > this.riskLevelToNumber(maxEmployeeRisk)) {
        maxEmployeeRisk = riskLevel;
      }
    }
    
    return { customerRisk: maxCustomerRisk, employeeRisk: maxEmployeeRisk };
  }

  private scoreToRiskLevel(score: number): 'none' | 'minimal' | 'moderate' | 'high' | 'critical' {
    if (score >= 90) return 'none';
    if (score >= 75) return 'minimal';
    if (score >= 60) return 'moderate';
    if (score >= 40) return 'high';
    return 'critical';
  }

  private riskLevelToNumber(level: string): number {
    const map = { 'none': 0, 'minimal': 1, 'moderate': 2, 'high': 3, 'critical': 4 };
    return map[level as keyof typeof map] || 0;
  }

  private getPerformanceLevel(score: number): 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'adequate';
    if (score >= 40) return 'needs_improvement';
    return 'critical';
  }

  private generatePriorityActions(dimensionResults: Record<string, any>): Array<{
    dimension: string;
    strategy: string;
    action: string;
    priority: 'critical' | 'high' | 'medium';
    timeline: string;
  }> {
    const actions: Array<any> = [];
    
    for (const [dimId, result] of Object.entries(dimensionResults)) {
      if (result.score < 60) { // Needs improvement
        const priority = result.score < 40 ? 'critical' : 'high';
        const timeline = priority === 'critical' ? 'Immédiat' : '1-3 mois';
        
        // Find worst performing strategies
        for (const [strategyId, strategyResult] of Object.entries(result.strategyResults || {})) {
          const strategyData = strategyResult as any;
          if (strategyData && strategyData.score < 60) {
            actions.push({
              dimension: dimId,
              strategy: strategyId,
              action: this.getActionForStrategy(strategyId),
              priority,
              timeline
            });
          }
        }
      }
    }
    
    return actions.slice(0, 10); // Top 10 priority actions
  }

  private getActionForStrategy(strategy: string): string {
    const actionMap: Record<string, string> = {
      'data_biases_identified_mitigated': 'Conduire une analyse approfondie des biais dans les données',
      'design_biases_identified_mitigated': 'Revoir la conception du modèle pour éliminer les biais',
      'bias_monitoring': 'Mettre en place une surveillance continue des biais',
      'algorithmic_transparency': 'Documenter et expliquer les algorithmes utilisés',
      'human_oversight_control': 'Renforcer la supervision humaine',
      // Add more strategies...
    };
    
    return actionMap[strategy] || 'Améliorer cette dimension selon les bonnes pratiques';
  }

  private generateFrameworkRecommendations(dimensionResults: Record<string, any>): string[] {
    const recommendations: string[] = [];
    
    // General recommendations based on overall performance
    const avgScore = Object.values(dimensionResults).reduce((sum: number, result: any) => sum + result.score, 0) / 
                     Object.keys(dimensionResults).length;
    
    if (avgScore < 60) {
      recommendations.push(
        'Amélioration globale requise : Score Framework v3.0 en dessous du seuil recommandé',
        'Priorité sur les dimensions Justice & Équité et Transparence',
        'Formation des équipes sur les principes de l\'IA responsable'
      );
    }
    
    // Dimension-specific recommendations
    for (const [dimId, result] of Object.entries(dimensionResults)) {
      if (result.score < 70) {
        recommendations.push(...result.overallImprovements);
      }
    }
    
    return recommendations.slice(0, 8); // Top 8 recommendations
  }

  private getStrategyStrengths(strategy: string, score: number): string[] {
    if (score < 60) return [];
    
    const strengthsMap: Record<string, string[]> = {
      'data_biases_identified_mitigated': ['Processus d\'identification des biais fonctionnel', 'Documentation des biais existante'],
      'algorithmic_transparency': ['Algorithmes documentés', 'Processus transparent'],
      // Add more...
    };
    
    return strengthsMap[strategy] || ['Performance satisfaisante'];
  }

  private getStrategyImprovements(strategy: string, score: number): string[] {
    if (score >= 80) return [];
    
    const improvementsMap: Record<string, string[]> = {
      'data_biases_identified_mitigated': ['Automatiser la détection de biais', 'Élargir l\'analyse à plus de variables'],
      'algorithmic_transparency': ['Améliorer la documentation technique', 'Ajouter des explications pour les non-experts'],
      // Add more...
    };
    
    return improvementsMap[strategy] || ['Améliorer selon les bonnes pratiques'];
  }

  private getDimensionStrengths(dimensionId: string, score: number): string[] {
    if (score < 70) return [];
    
    const strengthsMap: Record<string, string[]> = {
      'justice_fairness': ['Processus équitables en place', 'Sensibilisation aux biais'],
      'transparency_explainability': ['Documentation accessible', 'Processus transparent'],
      // Add more...
    };
    
    return strengthsMap[dimensionId] || ['Performance dimensionnelle satisfaisante'];
  }

  private getDimensionImprovements(dimensionId: string, score: number): string[] {
    if (score >= 80) return [];
    
    const improvementsMap: Record<string, string[]> = {
      'justice_fairness': ['Renforcer la surveillance des biais', 'Améliorer l\'engagement des parties prenantes'],
      'transparency_explainability': ['Développer des explications automatiques', 'Former les utilisateurs'],
      // Add more...
    };
    
    return improvementsMap[dimensionId] || ['Améliorer cette dimension'];
  }

  // Enhanced assessment combining EU AI Act + Framework v3.0
  async assessCombined(formData: RiskAssessmentFormData): Promise<RiskAssessmentResult> {
    // 1. EU AI Act Classification (Tier 1)
    const euAiActClassification = this.classifyEUAIAct(this.adaptFromFrameworkV3(formData));
    
    // 2. Framework v3.0 Assessment (Tier 2)
    const frameworkData: FrameworkAssessmentData = {
      systemName: formData.systemName,
      organizationName: formData.organizationName,
      industrySector: formData.industrySector,
      primaryUseCase: formData.primaryUseCase,
      systemDescription: formData.systemDescription,
      responses: (formData.frameworkResponses as Record<string, Record<string, number>>) || {}
    };
    
    const frameworkResult = await this.assessFrameworkV3(frameworkData);
    
    // 3. Combine results
    const riskScore = this.calculateCombinedRiskScore(euAiActClassification.riskLevel, frameworkResult.overallScore);
    const riskLevel = this.determineFinalRiskLevel(euAiActClassification.riskLevel, frameworkResult.customerRisk);
    
    // 4. Generate combined reasoning
    const reasoning = await this.generateCombinedReasoning(euAiActClassification, frameworkResult);
    
    return {
      euAiActRiskLevel: euAiActClassification.riskLevel,
      euAiActClassification: {
        reasoning: euAiActClassification.reasoning,
        applicableArticles: euAiActClassification.applicableArticles,
        isHighRiskDomain: euAiActClassification.isHighRiskDomain,
        highRiskDomains: euAiActClassification.highRiskDomains
      },
      dimensionScores: this.transformDimensionResults(frameworkResult.dimensionResults),
      overallFrameworkScore: frameworkResult.overallScore,
      riskLevel,
      riskScore,
      reasoning,
      applicableObligations: this.getObligations(euAiActClassification.riskLevel, formData),
      complianceGaps: this.identifyComplianceGaps(euAiActClassification, frameworkResult),
      complianceScore: this.calculateComplianceScore(euAiActClassification, frameworkResult),
      recommendations: [...frameworkResult.recommendations],
      actionPlan: this.generateCombinedActionPlan(euAiActClassification, frameworkResult),
      priorityActions: frameworkResult.priorityActions.map(action => action.action),
      assessmentVersion: '3.0'
    };
  }

  private convertToLegacyFormat(formData: RiskAssessmentFormData): AssessmentFormData {
    return {
      systemName: formData.systemName,
      sector: formData.industrySector || 'technology_software',
      description: formData.systemDescription,
      sensitiveData: formData.sensitiveData,
      discriminationRisk: formData.discriminationRisk,
      userInformed: formData.userInformed,
      explainabilityLevel: formData.explainabilityLevel,
      humanOversight: formData.humanOversight,
      overrideCapability: formData.overrideCapability,
      autonomyLevel: formData.autonomyLevel,
      safetyImpact: formData.safetyImpact,
      decisionConsequences: formData.decisionConsequences,
      applicationDomain: formData.applicationDomain,
      userCategories: formData.userCategories,
      geographicalScope: formData.geographicalScope
    };
  }

  private calculateCombinedRiskScore(euLevel: string, frameworkScore: number): number {
    const euWeight = 0.6; // EU AI Act gets 60% weight
    const frameworkWeight = 0.4; // Framework gets 40% weight
    
    const euScore = this.euLevelToScore(euLevel);
    return Math.round(euScore * euWeight + (100 - frameworkScore) * frameworkWeight);
  }

  private euLevelToScore(level: string): number {
    const map = { 'minimal': 20, 'limited': 40, 'high': 70, 'unacceptable': 100 };
    return map[level as keyof typeof map] || 20;
  }

  private transformDimensionResults(dimensionResults: Record<string, any>): Record<string, {
    score: number;
    level: 'critical' | 'excellent' | 'good' | 'adequate' | 'needs_improvement';
    strengths: string[];
    improvements: string[];
  }> {
    const transformed: Record<string, {
      score: number;
      level: 'critical' | 'excellent' | 'good' | 'adequate' | 'needs_improvement';
      strengths: string[];
      improvements: string[];
    }> = {};
    
    for (const [key, value] of Object.entries(dimensionResults)) {
      const result = value as any;
      const score = result?.score || 0;
      
      // Map score to level
      let level: 'critical' | 'excellent' | 'good' | 'adequate' | 'needs_improvement';
      if (score >= 90) level = 'excellent';
      else if (score >= 75) level = 'good';
      else if (score >= 60) level = 'adequate';
      else if (score >= 40) level = 'needs_improvement';
      else level = 'critical';
      
      transformed[key] = {
        score,
        level,
        strengths: this.getDimensionStrengths(key, score),
        improvements: this.getDimensionImprovements(key, score)
      };
    }
    
    return transformed;
  }

  private determineFinalRiskLevel(euLevel: string, frameworkRisk: string): 'minimal' | 'limited' | 'high' | 'unacceptable' {
    // EU AI Act classification takes precedence
    if (euLevel === 'unacceptable') return 'unacceptable';
    if (euLevel === 'high') return 'high';
    
    // For lower EU levels, consider framework risk
    if (frameworkRisk === 'critical') return euLevel === 'limited' ? 'high' : 'limited';
    if (frameworkRisk === 'high') return euLevel === 'minimal' ? 'limited' : euLevel as any;
    
    return euLevel as any;
  }

  private async generateCombinedReasoning(euClassification: any, frameworkResult: FrameworkAssessmentResult): Promise<string> {
    return `Classification EU AI Act: ${euClassification.reasoning}\n\nÉvaluation Framework Positive AI v3.0: Score global de ${frameworkResult.overallScore}/100 (${frameworkResult.overallLevel}). Les dimensions nécessitant une attention particulière sont celles avec des scores inférieurs à 70/100.`;
  }

  private identifyComplianceGaps(euClassification: any, frameworkResult: FrameworkAssessmentResult): Array<{
    gap: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }> {
    const gaps: Array<any> = [];
    
    // EU AI Act compliance gaps
    if (euClassification.riskLevel === 'high') {
      gaps.push({
        gap: 'Système haute risque - Conformité EU AI Act requise',
        severity: 'critical' as const,
        recommendation: 'Mettre en place toutes les obligations du Titre III Chapitre 2'
      });
    }
    
    // Framework gaps based on low scores
    for (const [dimId, result] of Object.entries(frameworkResult.dimensionResults)) {
      if (result.score < 60) {
        gaps.push({
          gap: `Dimension ${dimId}: Score ${result.score}/100`,
          severity: result.score < 40 ? 'critical' as const : 'high' as const,
          recommendation: `Améliorer les pratiques de ${dimId}`
        });
      }
    }
    
    return gaps;
  }

  private calculateComplianceScore(euClassification: any, frameworkResult: FrameworkAssessmentResult): number {
    // Compliance score based on EU level and framework performance
    const euCompliance = euClassification.riskLevel === 'unacceptable' ? 0 : 
                        euClassification.riskLevel === 'high' ? 40 :
                        euClassification.riskLevel === 'limited' ? 70 : 90;
    
    return Math.round((euCompliance + frameworkResult.overallScore) / 2);
  }

  private generateCombinedActionPlan(euClassification: any, frameworkResult: FrameworkAssessmentResult): {
    immediate: Array<{ action: string; priority: 'critical' | 'high' | 'medium'; timeline: string }>;
    short_term: Array<{ action: string; priority: 'critical' | 'high' | 'medium'; timeline: string }>;
    long_term: Array<{ action: string; priority: 'critical' | 'high' | 'medium'; timeline: string }>;
  } {
    const immediate: Array<any> = [];
    const short_term: Array<any> = [];
    const long_term: Array<any> = [];
    
    // EU AI Act immediate actions
    if (euClassification.riskLevel === 'unacceptable') {
      immediate.push({
        action: 'Cessation immédiate du système',
        priority: 'critical' as const,
        timeline: 'Immédiat'
      });
    } else if (euClassification.riskLevel === 'high') {
      immediate.push({
        action: 'Évaluation de conformité EU AI Act',
        priority: 'critical' as const,
        timeline: '2 semaines'
      });
    }
    
    // Framework priority actions
    for (const action of frameworkResult.priorityActions) {
      if (action.priority === 'critical') {
        immediate.push(action);
      } else if (action.priority === 'high') {
        short_term.push(action);
      } else {
        long_term.push(action);
      }
    }
    
    return { immediate, short_term, long_term };
  }

  // ✅ NEW: Enhanced save for Framework v3.0 assessments
  async saveEnhancedAssessment(
    formData: RiskAssessmentFormData,
    result: RiskAssessmentResult,
    userId: string
  ): Promise<{ aiSystemId: string; assessmentId: string }> {
    // Create or update AI system
    const aiSystemData: InsertAiSystem = {
      userId,
      name: formData.systemName,
      description: formData.systemDescription,
      sector: formData.industrySector,
      riskLevel: result.riskLevel,
      status: 'draft',
      assessmentData: formData as any,
      complianceScore: result.complianceScore,
      lastAssessed: new Date(),
    };

    const aiSystem = await storage.createAiSystem(aiSystemData);

    // Create enhanced risk assessment record
    const assessmentData: InsertRiskAssessment = {
      aiSystemId: aiSystem.id,
      userId,
      systemName: formData.systemName,
      organizationName: formData.organizationName,
      industrySector: formData.industrySector as any,
      primaryUseCase: formData.primaryUseCase as any,
      systemDescription: formData.systemDescription,
      
      // EU AI Act data
      euAiActRiskLevel: result.euAiActRiskLevel,
      euAiActClassification: result.euAiActClassification,
      isHighRiskDomain: result.euAiActClassification.isHighRiskDomain,
      highRiskDomains: result.euAiActClassification.highRiskDomains,
      
      // Framework v3.0 data
      frameworkResponses: formData.frameworkResponses || {},
      dimensionScores: result.dimensionScores,
      overallFrameworkScore: result.overallFrameworkScore,
      
      // Combined results
      formData: formData as any,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      reasoning: result.reasoning,
      
      // Compliance data
      applicableObligations: result.applicableObligations,
      complianceGaps: result.complianceGaps,
      complianceScore: result.complianceScore,
      
      // Recommendations
      recommendations: result.recommendations,
      actionPlan: result.actionPlan,
      priorityActions: result.priorityActions,
      
      assessmentVersion: result.assessmentVersion
    };

    const assessment = await storage.createRiskAssessment(assessmentData);

    return {
      aiSystemId: aiSystem.id,
      assessmentId: assessment.id,
    };
  }

  // Enhanced assessment method for enriched UI questionnaires (Framework v3.0)
  async assessEnrichedRiskV3(formData: {
    systemName: string;
    industrySector?: string;
    primaryUseCase?: string;
    responses: Record<string, number>;
  }): Promise<{
    riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
    riskScore: number;
    reasoning: string;
    obligations: string[];
    recommendations: string[];
    dimensionScores: Record<string, {
      score: number;
      riskLevel: string;
      recommendations: string[];
    }>;
    timeline: {
      immediate: string[];
      short_term: string[];
      long_term: string[];
    };
  }> {
    // Calculate dimension scores from responses
    const dimensionScores = this.calculateEnrichedDimensionScores(formData.responses);
    
    // Calculate overall risk score
    const overallScore = this.calculateEnrichedRiskScore(dimensionScores);
    
    // Determine risk level
    const riskLevel = this.determineEnrichedRiskLevel(overallScore);
    
    // Generate reasoning
    const reasoning = await this.generateEnrichedReasoning(dimensionScores, riskLevel, formData);
    
    // Get obligations based on risk level
    const obligations = this.getObligationsForRiskLevel(riskLevel);
    
    // Generate recommendations based on dimension scores
    const recommendations = this.generateDimensionRecommendationsV3(dimensionScores);
    
    // Generate action timeline
    const timeline = this.generateActionTimelineV3(dimensionScores, riskLevel);
    
    return {
      riskLevel,
      riskScore: overallScore,
      reasoning,
      obligations,
      recommendations,
      dimensionScores,
      timeline
    };
  }

  private calculateEnrichedDimensionScores(responses: Record<string, number>): Record<string, {
    score: number;
    riskLevel: string;
    recommendations: string[];
  }> {
    const dimensions = [
      'justice_fairness',
      'transparency_explainability', 
      'human_ai_interaction',
      'social_environmental_impact',
      'responsibility',
      'data_privacy',
      'technical_robustness_security'
    ];
    
    const dimensionScores: Record<string, {
      score: number;
      riskLevel: string;
      recommendations: string[];
    }> = {};
    
    for (const dimension of dimensions) {
      // Find responses for this dimension
      const dimensionResponses = Object.entries(responses)
        .filter(([key]) => key.includes(dimension.split('_')[0]))
        .map(([, value]) => value);
      
      if (dimensionResponses.length > 0) {
        // Calculate average score for this dimension (convert risk values to performance scores)
        const avgRiskValue = dimensionResponses.reduce((sum, val) => sum + val, 0) / dimensionResponses.length;
        const performanceScore = Math.max(0, 100 - avgRiskValue); // Invert risk to performance
        
        const riskLevel = this.scoreToRiskLevelV3(avgRiskValue);
        const recommendations = this.getDimensionRecommendationsForScore(dimension, performanceScore);
        
        dimensionScores[dimension] = {
          score: Math.round(performanceScore),
          riskLevel,
          recommendations
        };
      }
    }
    
    return dimensionScores;
  }
  
  private calculateEnrichedRiskScore(dimensionScores: Record<string, { score: number }>): number {
    const scores = Object.values(dimensionScores).map(d => 100 - d.score); // Convert back to risk
    if (scores.length === 0) return 0;
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
  
  private determineEnrichedRiskLevel(riskScore: number): 'minimal' | 'limited' | 'high' | 'unacceptable' {
    if (riskScore >= 80) return 'unacceptable';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'limited';
    return 'minimal';
  }
  
  private scoreToRiskLevelV3(riskValue: number): string {
    if (riskValue >= 80) return 'unacceptable';
    if (riskValue >= 60) return 'high';
    if (riskValue >= 30) return 'limited';
    return 'minimal';
  }
  
  private async generateEnrichedReasoning(
    dimensionScores: Record<string, { score: number; riskLevel: string }>, 
    riskLevel: string, 
    formData: any
  ): Promise<string> {
    const highRiskDimensions = Object.entries(dimensionScores)
      .filter(([, score]) => score.riskLevel === 'high' || score.riskLevel === 'unacceptable')
      .map(([dim]) => this.getDimensionDisplayName(dim));
    
    let reasoning = `Évaluation basée sur le Technical Framework v3.0 - Positive AI. `;
    
    if (riskLevel === 'unacceptable') {
      reasoning += `Le système présente un risque inacceptable principalement dû à : ${highRiskDimensions.join(', ')}. `;
      reasoning += `Des mesures correctives immédiates sont requises avant toute mise en production.`;
    } else if (riskLevel === 'high') {
      reasoning += `Le système présente un risque élevé nécessitant des obligations de conformité strictes. `;
      reasoning += `Dimensions critiques : ${highRiskDimensions.join(', ')}.`;
    } else if (riskLevel === 'limited') {
      reasoning += `Le système présente un risque limité avec obligations de transparence. `;
      reasoning += `Améliorations recommandées sur certaines dimensions.`;
    } else {
      reasoning += `Le système présente un risque minimal selon les critères d'évaluation. `;
      reasoning += `Maintenir les bonnes pratiques actuelles.`;
    }
    
    return reasoning;
  }
  
  private getObligationsForRiskLevel(riskLevel: string): string[] {
    const obligationsMap: Record<string, string[]> = {
      'unacceptable': [
        'INTERDICTION de mise sur le marché (Article 5 AI Act)',
        'Arrêt immédiat de tout développement',
        'Révision complète de la conception du système'
      ],
      'high': [
        'Système de gestion de la qualité (Article 17)',
        'Documentation technique détaillée (Article 18)',
        'Conservation automatique des logs (Article 19)',
        'Transparence et information aux utilisateurs (Article 20)',
        'Supervision humaine appropriée (Article 21)',
        'Robustesse, exactitude et cybersécurité (Article 22)'
      ],
      'limited': [
        'Obligation d\'information sur l\'usage de l\'IA (Article 50)',
        'Transparence pour les utilisateurs finaux',
        'Documentation des capacités et limitations'
      ],
      'minimal': [
        'Respect des principes généraux de l\'IA éthique',
        'Surveillance des impacts potentiels'
      ]
    };
    
    return obligationsMap[riskLevel] || [];
  }
  
  private generateDimensionRecommendationsV3(dimensionScores: Record<string, { score: number; riskLevel: string }>): string[] {
    const recommendations: string[] = [];
    
    for (const [dimension, scoreData] of Object.entries(dimensionScores)) {
      if (scoreData.score < 70) {
        const dimensionName = this.getDimensionDisplayName(dimension);
        recommendations.push(`Améliorer la dimension "${dimensionName}" (score: ${scoreData.score}/100)`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintenir les bonnes pratiques actuelles');
      recommendations.push('Surveillance continue des performances');
    }
    
    return recommendations;
  }
  
  private getDimensionRecommendationsForScore(dimension: string, score: number): string[] {
    const recommendationsMap: Record<string, Record<string, string[]>> = {
      'justice_fairness': {
        'low': ['Audit complet des biais', 'Formation des équipes', 'Diversification des données'],
        'medium': ['Tests réguliers d\'équité', 'Monitoring des biais'],
        'high': ['Maintenir la surveillance', 'Optimiser les métriques']
      },
      'transparency_explainability': {
        'low': ['Développer l\'explicabilité', 'Documentation utilisateur', 'Formation à l\'IA'],
        'medium': ['Améliorer les explications', 'Interface utilisateur'],
        'high': ['Maintenir la transparence', 'Optimiser l\'UX']
      }
      // Ajouter d'autres dimensions...
    };
    
    const level = score < 50 ? 'low' : score < 80 ? 'medium' : 'high';
    return recommendationsMap[dimension]?.[level] || ['Améliorer cette dimension'];
  }
  
  private getDimensionDisplayName(dimension: string): string {
    const nameMap: Record<string, string> = {
      'justice_fairness': 'Justice et équité',
      'transparency_explainability': 'Transparence et explicabilité',
      'human_ai_interaction': 'Interaction humaine-IA',
      'social_environmental_impact': 'Impact social et environnemental',
      'responsibility': 'Responsabilité',
      'data_privacy': 'Données et vie privée',
      'technical_robustness_security': 'Robustesse technique et sécurité'
    };
    
    return nameMap[dimension] || dimension;
  }
  
  private generateActionTimelineV3(
    dimensionScores: Record<string, { score: number; riskLevel: string }>, 
    riskLevel: string
  ): {
    immediate: string[];
    short_term: string[];
    long_term: string[];
  } {
    const timeline = {
      immediate: [] as string[],
      short_term: [] as string[],
      long_term: [] as string[]
    };
    
    if (riskLevel === 'unacceptable' || riskLevel === 'high') {
      timeline.immediate.push('Évaluation de conformité obligatoire');
      timeline.immediate.push('Mise en place de la supervision humaine');
      timeline.short_term.push('Documentation technique complète');
      timeline.short_term.push('Tests de robustesse et sécurité');
      timeline.long_term.push('Audit de conformité périodique');
    } else if (riskLevel === 'limited') {
      timeline.short_term.push('Améliorer la transparence utilisateur');
      timeline.short_term.push('Documentation des limitations');
      timeline.long_term.push('Monitoring des performances');
    } else {
      timeline.long_term.push('Surveillance continue des bonnes pratiques');
      timeline.long_term.push('Veille réglementaire');
    }
    
    return timeline;
  }
}

export const assessmentService = new AssessmentService();
