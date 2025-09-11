import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { assessmentService } from "./services/assessmentService";
import { complianceService } from "./services/complianceService";
import { regulatoryService } from "./services/regulatoryService";
import { llmService } from "./services/llmService";
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
      
      // Generate document content using LLM
      const prompt = `Générez un document de type "${documentType}" pour le système IA spécifié. Le document doit être conforme au Règlement (UE) 2024/1689 et rédigé en français professionnel.`;
      
      const response = await llmService.generateResponse(prompt, userId, {
        systemPrompt: "Vous êtes un expert en conformité réglementaire EU AI Act. Générez des documents professionnels et conformes.",
        maxTokens: 3000
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

  const httpServer = createServer(app);
  return httpServer;
}
