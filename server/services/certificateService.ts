import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { 
  ComplianceCertificate, 
  InsertComplianceCertificate,
  AiSystem, 
  RiskAssessment, 
  MaturityAssessment 
} from '@shared/schema';

export interface CertificateGenerationData {
  userId: string;
  organizationName: string;
  aiSystem?: AiSystem;
  riskAssessment?: RiskAssessment;
  maturityAssessment?: MaturityAssessment;
  certificateType: 'conformity' | 'risk_assessment' | 'maturity' | 'compliance_summary';
}

export interface CertificateData {
  certificateNumber: string;
  organizationName: string;
  systemName?: string;
  certificateType: string;
  issuedAt: Date;
  validUntil: Date;
  riskLevel?: string | null;
  complianceScore?: number;
  maturityLevel?: string | null;
  certificationCriteria: {
    evaluatedDomains: string[];
    complianceChecks: string[];
    assessmentMethods: string[];
  };
  complianceDetails: {
    overallStatus: 'compliant' | 'partially_compliant' | 'non_compliant';
    riskMitigation: string[];
    recommendations: string[];
    nextReviewDate: Date;
  };
  certification: {
    authority: string;
    standard: string;
    version: string;
    hash: string;
  };
}

export class CertificateService {
  
  /**
   * Generate personalized recommendations using LLM
   */
  private async generatePersonalizedRecommendations(
    data: CertificateGenerationData
  ): Promise<string[]> {
    try {
      // Import LLM service dynamically
      const { llmService } = await import('./llmService');
      
      // Build context for LLM
      const contextData = {
        organizationName: data.organizationName,
        systemName: data.aiSystem?.name,
        riskLevel: data.riskAssessment?.riskLevel,
        riskScore: data.riskAssessment?.riskScore,
        maturityLevel: data.maturityAssessment?.overallMaturity,
        maturityScore: data.maturityAssessment?.overallScore,
        certificateType: data.certificateType
      };

      const prompt = `En tant qu'expert en conformité EU AI Act, générez 5 recommandations spécifiques et actionables pour améliorer la conformité de cette organisation :

Organisation: ${data.organizationName}
${data.aiSystem ? `Système IA: ${data.aiSystem.name}` : ''}
${data.riskAssessment ? `Niveau de risque: ${data.riskAssessment.riskLevel}` : ''}
${data.maturityAssessment ? `Maturité organisationnelle: ${data.maturityAssessment.overallMaturity}` : ''}

Fournissez des recommandations concrètes en français, chacune sur une ligne séparée.`;

      const recommendations = await llmService.generateResponse(data.userId, prompt);

      if (recommendations && recommendations.content) {
        return recommendations.content
          .split('\n')
          .filter((line: string) => line.trim().length > 0)
          .map((line: string) => line.replace(/^\d+\.?\s*/, '').trim())
          .slice(0, 5);
      }
    } catch (error) {
      console.warn('Failed to generate personalized recommendations with LLM:', error);
    }

    // Fallback to deterministic recommendations
    return this.generateDeterministicRecommendations(data);
  }

  /**
   * Generate deterministic recommendations as fallback
   */
  private generateDeterministicRecommendations(data: CertificateGenerationData): string[] {
    const recommendations: string[] = [];

    if (data.riskAssessment) {
      if (data.riskAssessment.riskLevel === 'high' || data.riskAssessment.riskLevel === 'unacceptable') {
        recommendations.push('Mettre en place une surveillance humaine renforcée');
        recommendations.push('Effectuer des tests de robustesse approfondis');
        recommendations.push('Documenter tous les processus de décision IA');
      }
    }

    if (data.maturityAssessment && data.maturityAssessment.overallScore) {
      if (data.maturityAssessment.overallScore < 60) {
        recommendations.push('Développer une stratégie IA claire et formalisée');
        recommendations.push('Renforcer les compétences techniques de l\'équipe');
      }
    }

    recommendations.push('Maintenir une veille réglementaire continue');
    recommendations.push('Effectuer des audits de conformité réguliers');

    return recommendations.slice(0, 5);
  }

  /**
   * Generate a unique certificate number
   */
  private generateCertificateNumber(type: string): string {
    const prefix = {
      'conformity': 'CF',
      'risk_assessment': 'RA', 
      'maturity': 'MA',
      'compliance_summary': 'CS'
    }[type] || 'CC';
    
    const year = new Date().getFullYear();
    const uniqueId = nanoid(8).toUpperCase();
    return `${prefix}-${year}-${uniqueId}`;
  }

  /**
   * Calculate compliance score based on available assessments
   */
  private calculateComplianceScore(data: CertificateGenerationData): number {
    let totalScore = 0;
    let components = 0;

    // Risk assessment component (40% weight)
    if (data.riskAssessment?.riskScore) {
      // Convert risk score (higher = more risk) to compliance score (higher = more compliant)
      const riskCompliance = Math.max(0, 100 - (data.riskAssessment.riskScore || 0));
      totalScore += riskCompliance * 0.4;
      components++;
    }

    // Maturity assessment component (60% weight)
    if (data.maturityAssessment?.overallScore) {
      totalScore += data.maturityAssessment.overallScore * 0.6;
      components++;
    }

    // AI System status component (if no other assessments)
    if (components === 0 && data.aiSystem?.complianceScore) {
      totalScore = data.aiSystem.complianceScore;
      components = 1;
    }

    return components > 0 ? Math.round(totalScore) : 50; // Default to 50 if no data
  }

  /**
   * Determine overall compliance status
   */
  private determineComplianceStatus(score: number): 'compliant' | 'partially_compliant' | 'non_compliant' {
    if (score >= 80) return 'compliant';
    if (score >= 60) return 'partially_compliant';
    return 'non_compliant';
  }

  /**
   * Generate certification criteria based on assessments
   */
  private generateCertificationCriteria(data: CertificateGenerationData) {
    const criteria = {
      evaluatedDomains: [] as string[],
      complianceChecks: [] as string[],
      assessmentMethods: [] as string[]
    };

    if (data.riskAssessment) {
      criteria.evaluatedDomains.push('Évaluation des risques IA');
      criteria.complianceChecks.push('Classification du niveau de risque');
      criteria.complianceChecks.push('Mesures de mitigation identifiées');
      criteria.assessmentMethods.push('Questionnaire EU AI Act');
    }

    if (data.maturityAssessment) {
      criteria.evaluatedDomains.push('Maturité organisationnelle IA');
      criteria.complianceChecks.push('Stratégie et leadership IA');
      criteria.complianceChecks.push('Gouvernance et gestion des risques');
      criteria.complianceChecks.push('Éthique et IA responsable');
      criteria.complianceChecks.push('Capacités techniques et humaines');
      criteria.assessmentMethods.push('Positive AI Framework');
    }

    if (data.aiSystem) {
      criteria.evaluatedDomains.push('Système IA spécifique');
      criteria.complianceChecks.push('Documentation technique');
      criteria.complianceChecks.push('Surveillance humaine');
      criteria.assessmentMethods.push('Audit de conformité');
    }

    return criteria;
  }

  /**
   * Generate compliance details and recommendations
   */
  private async generateComplianceDetails(data: CertificateGenerationData, score: number) {
    const status = this.determineComplianceStatus(score);
    const details = {
      overallStatus: status,
      riskMitigation: [] as string[],
      recommendations: [] as string[],
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };

    // Risk mitigation measures
    if (data.riskAssessment) {
      const riskLevel = data.riskAssessment.riskLevel;
      if (riskLevel === 'high' || riskLevel === 'unacceptable') {
        details.riskMitigation.push('Surveillance humaine renforcée');
        details.riskMitigation.push('Tests de robustesse étendus');
        details.riskMitigation.push('Documentation technique complète');
      }
      if (riskLevel === 'limited') {
        details.riskMitigation.push('Information des utilisateurs');
        details.riskMitigation.push('Traçabilité des décisions');
      }
    }

    // Generate personalized recommendations using LLM
    details.recommendations = await this.generatePersonalizedRecommendations(data);

    // Set review date based on score
    if (score < 60) {
      details.nextReviewDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 6 months
    } else if (score < 80) {
      details.nextReviewDate = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000); // 9 months
    } else {
      details.nextReviewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    return details;
  }

  /**
   * Generate hash for certificate verification
   */
  private generateCertificationHash(certificateData: CertificateData): string {
    const dataString = JSON.stringify({
      certificateNumber: certificateData.certificateNumber,
      organizationName: certificateData.organizationName,
      systemName: certificateData.systemName,
      issuedAt: certificateData.issuedAt,
      complianceScore: certificateData.complianceScore
    });
    
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Generate a compliance certificate
   */
  async generateCertificate(data: CertificateGenerationData): Promise<InsertComplianceCertificate> {
    const certificateNumber = this.generateCertificateNumber(data.certificateType);
    const complianceScore = this.calculateComplianceScore(data);
    const issuedAt = new Date();
    const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year validity
    
    // Generate compliance details first to ensure async completion
    const complianceDetails = await this.generateComplianceDetails(data, complianceScore);
    const certificationCriteria = this.generateCertificationCriteria(data);

    const certificateData: CertificateData = {
      certificateNumber,
      organizationName: data.organizationName,
      systemName: data.aiSystem?.name,
      certificateType: data.certificateType,
      issuedAt,
      validUntil,
      riskLevel: data.riskAssessment?.riskLevel,
      complianceScore,
      maturityLevel: data.maturityAssessment?.overallMaturity,
      certificationCriteria,
      complianceDetails,
      certification: {
        authority: 'IA-ACT-NAVIGATOR',
        standard: 'EU AI Act (Règlement UE 2024/1689)',
        version: '1.0',
        hash: '' // Will be set after hash generation
      }
    };

    // Generate hash for verification after all data is materialized
    certificateData.certification.hash = this.generateCertificationHash(certificateData);

    const certificate: InsertComplianceCertificate = {
      userId: data.userId,
      aiSystemId: data.aiSystem?.id,
      maturityAssessmentId: data.maturityAssessment?.id,
      certificateType: data.certificateType,
      certificateNumber,
      organizationName: data.organizationName,
      systemName: data.aiSystem?.name,
      riskLevel: data.riskAssessment?.riskLevel || undefined,
      complianceScore,
      maturityLevel: data.maturityAssessment?.overallMaturity || undefined,
      certificationCriteria,
      complianceDetails,
      validUntil,
      certificateData: certificateData,
      certificationHash: certificateData.certification.hash
    };

    return certificate;
  }

  /**
   * Verify certificate integrity using hash
   */
  verifyCertificationHash(certificate: any): boolean {
    try {
      if (!certificate.certificateData || !certificate.certificationHash) {
        return false;
      }
      
      const expectedHash = this.generateCertificationHash(certificate.certificateData);
      return expectedHash === certificate.certificationHash;
    } catch (error) {
      console.error('Error verifying certificate hash:', error);
      return false;
    }
  }

  /**
   * Check if certificate should be automatically generated
   */
  shouldGenerateAutomaticCertificate(
    riskAssessment?: RiskAssessment, 
    maturityAssessment?: MaturityAssessment
  ): boolean {
    // Generate certificate if either assessment is completed with good score
    if (riskAssessment && riskAssessment.riskScore !== null) {
      return true; // Always generate for completed risk assessments
    }
    
    if (maturityAssessment && maturityAssessment.overallScore !== null) {
      return maturityAssessment.overallScore >= 40; // Generate if maturity score >= 40
    }

    return false;
  }

  /**
   * Determine appropriate certificate type based on available data
   */
  determineCertificateType(
    aiSystem?: AiSystem,
    riskAssessment?: RiskAssessment, 
    maturityAssessment?: MaturityAssessment
  ): 'conformity' | 'risk_assessment' | 'maturity' | 'compliance_summary' {
    if (riskAssessment && maturityAssessment) {
      return 'compliance_summary';
    }
    if (riskAssessment && aiSystem) {
      return 'conformity';
    }
    if (riskAssessment) {
      return 'risk_assessment';
    }
    if (maturityAssessment) {
      return 'maturity';
    }
    return 'compliance_summary';
  }
}

export const certificateService = new CertificateService();