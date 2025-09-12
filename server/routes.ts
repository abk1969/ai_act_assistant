import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { assessmentService } from "./services/assessmentService";
import { complianceService } from "./services/complianceService";
import { regulatoryService } from "./services/regulatoryService";
import { llmService } from "./services/llmService";
import { maturityService } from "./services/maturityService";
import { insertAiSystemSchema, insertRiskAssessmentSchema, insertLlmSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize regulatory data
  await regulatoryService.seedInitialData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Initialize LLM configurations from environment variables if not already done
      const existingSettings = await storage.getLlmSettings(userId);
      if (existingSettings.length === 0) {
        await llmService.initializeFromEnvironment(userId);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Systems routes
  app.get('/api/ai-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const systems = await storage.getAiSystemsByUser(userId);
      res.json(systems);
    } catch (error) {
      console.error("Error fetching AI systems:", error);
      res.status(500).json({ message: "Failed to fetch AI systems" });
    }
  });

  app.get('/api/ai-systems/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const system = await storage.getAiSystem(id);
      
      if (!system) {
        return res.status(404).json({ message: "AI system not found" });
      }

      // Check ownership
      if (system.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(system);
    } catch (error) {
      console.error("Error fetching AI system:", error);
      res.status(500).json({ message: "Failed to fetch AI system" });
    }
  });

  app.post('/api/ai-systems', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const systemData = insertAiSystemSchema.parse({
        ...req.body,
        userId
      });
      
      const system = await storage.createAiSystem(systemData);
      res.status(201).json(system);
    } catch (error) {
      console.error("Error creating AI system:", error);
      res.status(500).json({ message: "Failed to create AI system" });
    }
  });

  // Risk Assessment routes
  app.post('/api/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const formData = req.body;
      
      // Perform risk assessment
      const result = await assessmentService.performRiskAssessment(formData, userId);
      
      // Save assessment
      const saved = await assessmentService.saveAssessment(formData, result, userId);
      
      res.status(201).json({
        ...result,
        aiSystemId: saved.aiSystemId,
        assessmentId: saved.assessmentId
      });
    } catch (error) {
      console.error("Error performing risk assessment:", error);
      res.status(500).json({ message: "Failed to perform risk assessment" });
    }
  });

  app.get('/api/assessments/:systemId', isAuthenticated, async (req: any, res) => {
    try {
      const { systemId } = req.params;
      const assessments = await storage.getRiskAssessmentsBySystem(systemId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  // Maturity Assessment routes
  app.get('/api/maturity/framework', async (req, res) => {
    try {
      const framework = maturityService.getMaturityFramework();
      res.json(framework);
    } catch (error) {
      console.error("Error fetching maturity framework:", error);
      res.status(500).json({ message: "Failed to fetch maturity framework" });
    }
  });

  app.post('/api/maturity/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const formData = req.body;
      
      // Perform maturity assessment
      const result = await maturityService.assessOrganizationalMaturity(formData, userId);
      
      // Save assessment
      const saved = await maturityService.saveMaturityAssessment(formData, result, userId);
      
      res.status(201).json({
        ...result,
        assessmentId: saved.assessmentId
      });
    } catch (error) {
      console.error("Error performing maturity assessment:", error);
      res.status(500).json({ message: "Failed to perform maturity assessment" });
    }
  });

  app.get('/api/maturity/assessments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assessments = await storage.getMaturityAssessmentsByUser(userId);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching maturity assessments:", error);
      res.status(500).json({ message: "Failed to fetch maturity assessments" });
    }
  });

  // AI Act Articles routes
  app.get('/api/ai-act/articles', async (req, res) => {
    try {
      const { search, category } = req.query;
      
      let articles;
      if (search) {
        articles = await storage.searchAiActArticles(search as string);
      } else if (category) {
        articles = await storage.getArticlesByRiskCategory(category as string);
      } else {
        articles = await storage.getAiActArticles();
      }
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching AI Act articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get('/api/ai-act/articles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getAiActArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error) {
      console.error("Error fetching AI Act article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  // Compliance routes
  app.get('/api/compliance/overview', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const overview = await complianceService.getComplianceOverview(userId);
      res.json(overview);
    } catch (error) {
      console.error("Error fetching compliance overview:", error);
      res.status(500).json({ message: "Failed to fetch compliance overview" });
    }
  });

  app.get('/api/compliance/matrix', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const matrix = await complianceService.getComplianceMatrix(userId);
      res.json(matrix);
    } catch (error) {
      console.error("Error fetching compliance matrix:", error);
      res.status(500).json({ message: "Failed to fetch compliance matrix" });
    }
  });

  app.post('/api/compliance/report/:systemId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { systemId } = req.params;
      
      const report = await complianceService.generateComplianceReport(systemId, userId);
      res.json(report);
    } catch (error) {
      console.error("Error generating compliance report:", error);
      res.status(500).json({ message: "Failed to generate compliance report" });
    }
  });

  // Document generation routes
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { systemId } = req.query;
      
      let documents;
      if (systemId) {
        // SECURITY: Verify system ownership before getting documents
        const aiSystem = await storage.getAiSystem(systemId as string);
        if (!aiSystem || aiSystem.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        documents = await storage.getDocumentsBySystem(systemId as string);
      } else {
        documents = await storage.getDocumentsByUser(userId);
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { systemId, documentType, title } = req.body;
      
      // Get AI system details and risk assessments for context
      const aiSystem = await storage.getAiSystem(systemId);
      if (!aiSystem) {
        return res.status(404).json({ message: "AI System not found" });
      }
      
      // CRITICAL SECURITY: Verify ownership
      if (aiSystem.userId !== userId) {
        return res.status(403).json({ message: "Access denied - you can only generate documents for your own AI systems" });
      }
      
      const riskAssessments = await storage.getRiskAssessmentsBySystem(systemId);
      const latestAssessment = riskAssessments?.[0]; // Get most recent
      
      // Build comprehensive context for document generation
      const contextData = {
        systemName: aiSystem.name,
        description: aiSystem.description,
        sector: aiSystem.sector,
        riskLevel: aiSystem.riskLevel || 'not_assessed',
        complianceScore: aiSystem.complianceScore,
        lastAssessed: aiSystem.lastAssessed,
        assessmentData: latestAssessment ? {
          riskScore: latestAssessment.riskScore,
          riskLevel: latestAssessment.riskLevel,
          formData: latestAssessment.formData,
          recommendations: latestAssessment.recommendations
        } : null
      };
      
      // Generate specialized prompts based on document type
      let prompt = "";
      let systemPrompt = "Vous êtes un expert en conformité réglementaire EU AI Act (Règlement UE 2024/1689). Générez des documents professionnels, conformes et détaillés en français.";
      
      switch (documentType) {
        case 'technical_documentation':
          prompt = `Générez une DOCUMENTATION TECHNIQUE complète conforme à l'Article 11 du Règlement EU AI Act pour le système IA suivant:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}
NIVEAU DE RISQUE: ${contextData.riskLevel}
SCORE DE CONFORMITÉ: ${contextData.complianceScore || 'Non évalué'}

${contextData.assessmentData ? `DERNIÈRE ÉVALUATION:
- Score de risque: ${contextData.assessmentData.riskScore}/100
- Niveau de risque: ${contextData.assessmentData.riskLevel}
- Recommandations: ${JSON.stringify(contextData.assessmentData.recommendations)}` : ''}

Le document doit inclure:
1. Description générale du système d'IA et de sa finalité prévue
2. Les éléments du système et du processus de développement 
3. Surveillance, fonctionnement et contrôle du système d'IA
4. Gestion des risques et mesures de mitigation
5. Jeux de données d'entraînement, de validation et de test
6. Documentation technique et procédures opérationnelles`;
          break;
          
        case 'impact_assessment':
          prompt = `Générez une ÉVALUATION D'IMPACT SUR LES DROITS FONDAMENTAUX conforme à l'Article 27 du Règlement EU AI Act:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}
NIVEAU DE RISQUE: ${contextData.riskLevel}

${contextData.assessmentData ? `ÉVALUATION TECHNIQUE EXISTANTE:
- Score: ${contextData.assessmentData.riskScore}/100
- Données de formulaire: ${JSON.stringify(contextData.assessmentData.formData)}` : ''}

Le document doit analyser:
1. Les processus auxquels le système d'IA est destiné à être utilisé
2. Les catégories de personnes et groupes de personnes susceptibles d'être affectés
3. Les risques identifiés de préjudices aux droits fondamentaux
4. L'évaluation détaillée des impacts négatifs
5. Les mesures de sauvegarde et de mitigation adoptées
6. La consultation des parties prenantes concernées`;
          break;
          
        case 'conformity_declaration':
          prompt = `Générez une DÉCLARATION UE DE CONFORMITÉ conforme à l'Article 47 du Règlement EU AI Act:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}
NIVEAU DE RISQUE: ${contextData.riskLevel}
SCORE DE CONFORMITÉ: ${contextData.complianceScore || 'Non évalué'}

La déclaration doit contenir:
1. Le nom, la dénomination commerciale du fournisseur et son adresse
2. La désignation du système d'IA à haut risque  
3. La déclaration que le système d'IA à haut risque est conforme au règlement
4. Les références aux normes harmonisées pertinentes appliquées
5. L'identification de l'organisme notifié (si applicable)
6. Le lieu et la date de délivrance de la déclaration
7. La signature du représentant légal`;
          break;
          
        case 'human_oversight_plan':
          prompt = `Générez un PLAN DE SURVEILLANCE HUMAINE conforme à l'Article 14 du Règlement EU AI Act:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}

${contextData.assessmentData?.formData ? `DONNÉES D'ÉVALUATION:
${JSON.stringify(contextData.assessmentData.formData)}` : ''}

Le plan doit définir:
1. Les mesures de surveillance humaine appropriées
2. L'identification des personnes physiques responsables
3. Les compétences et qualifications requises pour les superviseurs
4. Les procédures d'intervention en cas de dysfonctionnement
5. Les modalités de formation et de sensibilisation
6. La fréquence et les modalités de contrôle du système`;
          break;
          
        case 'usage_instructions':
          prompt = `Générez des INSTRUCTIONS D'USAGE complètes conformes à l'Article 13 du Règlement EU AI Act:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}
NIVEAU DE RISQUE: ${contextData.riskLevel}

Les instructions doivent inclure:
1. L'identité et les coordonnées de contact du fournisseur
2. Les caractéristiques, capacités et limitations de performance
3. Les modifications apportées au système et leur impact
4. Les performances attendues et les conditions d'utilisation
5. Les mesures de surveillance humaine requises
6. La formation nécessaire pour les utilisateurs déployeurs`;
          break;
          
        case 'incident_register':
          prompt = `Générez un REGISTRE DES INCIDENTS ET TEMPLATE DE SIGNALEMENT conforme à l'Article 62 du Règlement EU AI Act:

SYSTÈME IA: ${contextData.systemName}
DESCRIPTION: ${contextData.description}
SECTEUR: ${contextData.sector}

Le registre doit contenir:
1. Template de signalement d'incident normalisé
2. Procédures de détection et classification des dysfonctionnements
3. Critères de gravité et d'urgence de signalement
4. Processus de notification aux autorités compétentes
5. Mesures correctives et préventives à adopter
6. Suivi et documentation des incidents`;
          break;
          
        default:
          prompt = `Générez un document de conformité EU AI Act de type "${documentType}" pour le système "${contextData.systemName}".`;
      }
      
      const response = await llmService.generateResponse(prompt, userId, {
        systemPrompt,
        maxTokens: 4000
      });
      
      const document = await storage.createGeneratedDocument({
        aiSystemId: systemId,
        userId,
        documentType,
        title,
        content: response.content
      });
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error generating document:", error);
      res.status(500).json({ message: "Failed to generate document" });
    }
  });

  // Regulatory monitoring routes
  app.get('/api/regulatory/updates', async (req, res) => {
    try {
      const { limit, source, severity } = req.query;
      
      let updates;
      if (source) {
        updates = await regulatoryService.getUpdatesBySource(source as string, parseInt(limit as string) || 20);
      } else if (severity) {
        updates = await regulatoryService.getUpdatesBySeverity(severity as string, parseInt(limit as string) || 20);
      } else {
        updates = await regulatoryService.getRegulatoryUpdates(parseInt(limit as string) || 50);
      }
      
      res.json(updates);
    } catch (error) {
      console.error("Error fetching regulatory updates:", error);
      res.status(500).json({ message: "Failed to fetch regulatory updates" });
    }
  });

  app.get('/api/regulatory/alerts', async (req, res) => {
    try {
      const alerts = await regulatoryService.getCriticalAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching regulatory alerts:", error);
      res.status(500).json({ message: "Failed to fetch regulatory alerts" });
    }
  });

  app.get('/api/regulatory/status', async (req, res) => {
    try {
      const status = await regulatoryService.getMonitoringStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching monitoring status:", error);
      res.status(500).json({ message: "Failed to fetch monitoring status" });
    }
  });

  app.post('/api/regulatory/sync', async (req, res) => {
    try {
      const result = await regulatoryService.performRegulatorySync();
      res.json(result);
    } catch (error) {
      console.error("Error performing regulatory sync:", error);
      res.status(500).json({ message: "Failed to perform regulatory sync" });
    }
  });

  // LLM Settings routes
  app.get('/api/llm/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getLlmSettings(userId);
      
      // Remove API keys from response for security
      const sanitizedSettings = settings.map(setting => ({
        ...setting,
        apiKey: setting.apiKey ? '••••••••••••••••' : null
      }));
      
      res.json(sanitizedSettings);
    } catch (error) {
      console.error("Error fetching LLM settings:", error);
      res.status(500).json({ message: "Failed to fetch LLM settings" });
    }
  });

  app.post('/api/llm/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = insertLlmSettingsSchema.parse({
        ...req.body,
        userId
      });
      
      const settings = await storage.upsertLlmSettings(settingsData);
      
      // Remove API key from response
      const sanitizedSettings = {
        ...settings,
        apiKey: settings.apiKey ? '••••••••••••••••' : null
      };
      
      res.json(sanitizedSettings);
    } catch (error) {
      console.error("Error saving LLM settings:", error);
      res.status(500).json({ message: "Failed to save LLM settings" });
    }
  });

  app.post('/api/llm/test-connection', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider } = req.body;
      
      const isConnected = await llmService.testConnection(userId, provider);
      res.json({ connected: isConnected });
    } catch (error) {
      console.error("Error testing LLM connection:", error);
      res.status(500).json({ message: "Failed to test LLM connection" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const [systems, complianceOverview, criticalAlerts] = await Promise.all([
        storage.getAiSystemsByUser(userId),
        complianceService.getComplianceOverview(userId),
        regulatoryService.getCriticalAlerts()
      ]);

      const metrics = {
        totalSystems: systems.length,
        highRiskSystems: systems.filter(s => s.riskLevel === 'high').length,
        complianceScore: Math.round(
          (complianceOverview.compliantSystems / Math.max(complianceOverview.totalSystems, 1)) * 100
        ),
        pendingActions: complianceOverview.criticalActions + criticalAlerts.length,
        riskDistribution: {
          minimal: systems.filter(s => s.riskLevel === 'minimal').length,
          limited: systems.filter(s => s.riskLevel === 'limited').length,
          high: systems.filter(s => s.riskLevel === 'high').length,
          unacceptable: systems.filter(s => s.riskLevel === 'unacceptable').length,
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Compliance Certificates Routes
  app.get('/api/certificates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { systemId, type, status } = req.query;
      
      let certificates;
      if (systemId) {
        // Get certificates for specific AI system (with security check)
        const aiSystem = await storage.getAiSystem(systemId as string);
        if (!aiSystem || aiSystem.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        certificates = await storage.getCertificatesBySystem(systemId as string);
      } else if (status === 'valid') {
        certificates = await storage.getValidCertificates(userId);
      } else {
        certificates = await storage.getCertificatesByUser(userId);
      }
      
      // Filter by type if specified
      if (type) {
        certificates = certificates.filter(cert => cert.certificateType === type);
      }
      
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post('/api/certificates/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body with Zod
      const generateCertificateSchema = z.object({
        organizationName: z.string().min(1, "Organization name is required"),
        aiSystemId: z.string().optional(),
        maturityAssessmentId: z.string().optional(),
        certificateType: z.enum(['conformity', 'risk_assessment', 'maturity', 'compliance_summary']).optional()
      });
      
      const validation = generateCertificateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validation.error.errors 
        });
      }
      
      const { aiSystemId, maturityAssessmentId, certificateType, organizationName } = validation.data;

      // Get required data for certificate generation
      let aiSystem, riskAssessment, maturityAssessment;
      
      if (aiSystemId) {
        aiSystem = await storage.getAiSystem(aiSystemId);
        if (!aiSystem || aiSystem.userId !== userId) {
          return res.status(403).json({ message: "Access denied to AI system" });
        }
        // Get latest risk assessment for the system
        const riskAssessments = await storage.getRiskAssessmentsBySystem(aiSystemId);
        riskAssessment = riskAssessments[0]; // Most recent
      }
      
      if (maturityAssessmentId) {
        if (maturityAssessmentId === 'latest') {
          maturityAssessment = await storage.getLatestMaturityAssessment(userId);
        } else {
          // Get specific maturity assessment by ID and verify ownership
          const assessments = await storage.getMaturityAssessmentsByUser(userId);
          maturityAssessment = assessments.find(assessment => assessment.id === maturityAssessmentId);
          if (!maturityAssessment) {
            return res.status(404).json({ message: "Maturity assessment not found or access denied" });
          }
        }
      }

      // Validate that we have enough data for certificate generation
      if (!aiSystem && !maturityAssessment) {
        return res.status(400).json({ 
          message: "At least one assessment (AI system or maturity) is required for certificate generation" 
        });
      }

      // Import and use certificate service
      const { certificateService } = await import('./services/certificateService');
      
      const certificateData = await certificateService.generateCertificate({
        userId,
        organizationName,
        aiSystem,
        riskAssessment,
        maturityAssessment,
        certificateType: certificateType || certificateService.determineCertificateType(aiSystem, riskAssessment, maturityAssessment)
      });

      // Validate with schema before persistence
      const validationResult = insertComplianceCertificateSchema.safeParse(certificateData);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Certificate validation failed",
          errors: validationResult.error.errors
        });
      }

      // Save certificate to database
      const certificate = await storage.createComplianceCertificate(validationResult.data);
      
      res.json({
        success: true,
        certificate: {
          id: certificate.id,
          certificateNumber: certificate.certificateNumber,
          certificateType: certificate.certificateType,
          organizationName: certificate.organizationName,
          systemName: certificate.systemName,
          complianceScore: certificate.complianceScore,
          status: certificate.status,
          issuedAt: certificate.issuedAt,
          validUntil: certificate.validUntil
        }
      });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({ message: "Failed to generate certificate" });
    }
  });

  // Certificate verification endpoint (public for verification purposes)
  app.get('/api/certificates/verify/:certificateNumber', async (req, res) => {
    try {
      const { certificateNumber } = req.params;
      const { hash: providedHash } = req.query;
      
      const certificate = await storage.getCertificateByNumber(certificateNumber);
      if (!certificate) {
        return res.status(404).json({ 
          valid: false, 
          message: "Certificate not found" 
        });
      }

      // Import certificate service and verify hash
      const { certificateService } = await import('./services/certificateService');
      const hashValid = certificateService.verifyCertificationHash(certificate);
      
      // Check expiry and status
      const isExpired = new Date() > new Date(certificate.validUntil || 0);
      const statusValid = certificate.status === 'valid';
      
      // If external hash provided, validate it against stored hash
      let externalHashValid = true;
      if (providedHash) {
        externalHashValid = providedHash === certificate.certificationHash;
      }

      const isFullyValid = hashValid && statusValid && !isExpired && externalHashValid;

      res.json({
        valid: isFullyValid,
        certificate: isFullyValid ? {
          certificateNumber: certificate.certificateNumber,
          organizationName: certificate.organizationName,
          systemName: certificate.systemName,
          certificateType: certificate.certificateType,
          complianceScore: certificate.complianceScore,
          issuedAt: certificate.issuedAt,
          validUntil: certificate.validUntil,
          status: certificate.status
        } : null,
        message: !hashValid ? "Certificate integrity check failed" :
                isExpired ? "Certificate has expired" :
                !statusValid ? "Certificate is not valid" :
                !externalHashValid ? "Provided hash does not match" :
                "Certificate is valid"
      });
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).json({ 
        valid: false, 
        message: "Verification failed" 
      });
    }
  });

  app.get('/api/certificates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const certificate = await storage.getCertificate(id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }
      
      // Security check: user can only access their own certificates
      if (certificate.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(certificate);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ message: "Failed to fetch certificate" });
    }
  });


  app.patch('/api/certificates/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['valid', 'expired', 'revoked', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Check certificate ownership
      const certificate = await storage.getCertificate(id);
      if (!certificate || certificate.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedCertificate = await storage.updateCertificateStatus(id, status);
      res.json(updatedCertificate);
    } catch (error) {
      console.error("Error updating certificate status:", error);
      res.status(500).json({ message: "Failed to update certificate status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
