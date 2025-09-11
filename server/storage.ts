import {
  users,
  aiSystems,
  riskAssessments,
  aiActArticles,
  complianceRecords,
  generatedDocuments,
  regulatoryUpdates,
  llmSettings,
  type User,
  type UpsertUser,
  type AiSystem,
  type InsertAiSystem,
  type RiskAssessment,
  type InsertRiskAssessment,
  type AiActArticle,
  type ComplianceRecord,
  type InsertComplianceRecord,
  type GeneratedDocument,
  type InsertGeneratedDocument,
  type RegulatoryUpdate,
  type LlmSettings,
  type InsertLlmSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // AI Systems
  createAiSystem(aiSystem: InsertAiSystem): Promise<AiSystem>;
  getAiSystemsByUser(userId: string): Promise<AiSystem[]>;
  getAiSystem(id: string): Promise<AiSystem | undefined>;
  updateAiSystem(id: string, updates: Partial<InsertAiSystem>): Promise<AiSystem>;
  deleteAiSystem(id: string): Promise<void>;

  // Risk Assessments
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
  getRiskAssessmentsBySystem(aiSystemId: string): Promise<RiskAssessment[]>;
  getLatestRiskAssessment(aiSystemId: string): Promise<RiskAssessment | undefined>;

  // AI Act Articles
  getAiActArticles(): Promise<AiActArticle[]>;
  getAiActArticle(id: string): Promise<AiActArticle | undefined>;
  searchAiActArticles(query: string): Promise<AiActArticle[]>;
  getArticlesByRiskCategory(category: string): Promise<AiActArticle[]>;

  // Compliance Records
  getComplianceRecordsBySystem(aiSystemId: string): Promise<ComplianceRecord[]>;
  upsertComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord>;
  getComplianceOverview(userId: string): Promise<{
    total: number;
    compliant: number;
    pending: number;
    overdue: number;
  }>;

  // Document Generation
  createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument>;
  getDocumentsBySystem(aiSystemId: string): Promise<GeneratedDocument[]>;
  getDocumentsByUser(userId: string): Promise<GeneratedDocument[]>;

  // Regulatory Monitoring
  getRegulatoryUpdates(limit?: number): Promise<RegulatoryUpdate[]>;
  createRegulatoryUpdate(update: Omit<RegulatoryUpdate, 'id' | 'createdAt'>): Promise<RegulatoryUpdate>;

  // LLM Settings
  getLlmSettings(userId: string): Promise<LlmSettings[]>;
  upsertLlmSettings(settings: InsertLlmSettings): Promise<LlmSettings>;
  getActiveLlmSettings(userId: string): Promise<LlmSettings | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // AI Systems
  async createAiSystem(aiSystem: InsertAiSystem): Promise<AiSystem> {
    const [system] = await db.insert(aiSystems).values(aiSystem).returning();
    return system;
  }

  async getAiSystemsByUser(userId: string): Promise<AiSystem[]> {
    return await db
      .select()
      .from(aiSystems)
      .where(eq(aiSystems.userId, userId))
      .orderBy(desc(aiSystems.createdAt));
  }

  async getAiSystem(id: string): Promise<AiSystem | undefined> {
    const [system] = await db.select().from(aiSystems).where(eq(aiSystems.id, id));
    return system;
  }

  async updateAiSystem(id: string, updates: Partial<InsertAiSystem>): Promise<AiSystem> {
    const [system] = await db
      .update(aiSystems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiSystems.id, id))
      .returning();
    return system;
  }

  async deleteAiSystem(id: string): Promise<void> {
    await db.delete(aiSystems).where(eq(aiSystems.id, id));
  }

  // Risk Assessments
  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [result] = await db.insert(riskAssessments).values(assessment).returning();
    return result;
  }

  async getRiskAssessmentsBySystem(aiSystemId: string): Promise<RiskAssessment[]> {
    return await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.aiSystemId, aiSystemId))
      .orderBy(desc(riskAssessments.createdAt));
  }

  async getLatestRiskAssessment(aiSystemId: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.aiSystemId, aiSystemId))
      .orderBy(desc(riskAssessments.createdAt))
      .limit(1);
    return assessment;
  }

  // AI Act Articles
  async getAiActArticles(): Promise<AiActArticle[]> {
    return await db.select().from(aiActArticles).orderBy(aiActArticles.articleNumber);
  }

  async getAiActArticle(id: string): Promise<AiActArticle | undefined> {
    const [article] = await db.select().from(aiActArticles).where(eq(aiActArticles.id, id));
    return article;
  }

  async searchAiActArticles(query: string): Promise<AiActArticle[]> {
    return await db
      .select()
      .from(aiActArticles)
      .where(
        sql`${aiActArticles.title} ILIKE ${`%${query}%`} OR ${aiActArticles.content} ILIKE ${`%${query}%`}`
      )
      .orderBy(aiActArticles.articleNumber);
  }

  async getArticlesByRiskCategory(category: string): Promise<AiActArticle[]> {
    return await db
      .select()
      .from(aiActArticles)
      .where(eq(aiActArticles.riskCategory, category))
      .orderBy(aiActArticles.articleNumber);
  }

  // Compliance Records
  async getComplianceRecordsBySystem(aiSystemId: string): Promise<ComplianceRecord[]> {
    return await db
      .select()
      .from(complianceRecords)
      .where(eq(complianceRecords.aiSystemId, aiSystemId))
      .orderBy(desc(complianceRecords.createdAt));
  }

  async upsertComplianceRecord(record: InsertComplianceRecord): Promise<ComplianceRecord> {
    const [result] = await db
      .insert(complianceRecords)
      .values(record)
      .onConflictDoUpdate({
        target: [complianceRecords.aiSystemId, complianceRecords.articleId],
        set: {
          ...record,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getComplianceOverview(userId: string): Promise<{
    total: number;
    compliant: number;
    pending: number;
    overdue: number;
  }> {
    const now = new Date();
    
    // Get all compliance records for user's systems
    const records = await db
      .select({
        compliant: complianceRecords.compliant,
        dueDate: complianceRecords.dueDate,
        completedAt: complianceRecords.completedAt,
      })
      .from(complianceRecords)
      .innerJoin(aiSystems, eq(complianceRecords.aiSystemId, aiSystems.id))
      .where(eq(aiSystems.userId, userId));

    const total = records.length;
    const compliant = records.filter(r => r.compliant).length;
    const overdue = records.filter(r => r.dueDate && r.dueDate < now && !r.completedAt).length;
    const pending = total - compliant - overdue;

    return { total, compliant, pending, overdue };
  }

  // Document Generation
  async createGeneratedDocument(document: InsertGeneratedDocument): Promise<GeneratedDocument> {
    const [result] = await db.insert(generatedDocuments).values(document).returning();
    return result;
  }

  async getDocumentsBySystem(aiSystemId: string): Promise<GeneratedDocument[]> {
    return await db
      .select()
      .from(generatedDocuments)
      .where(eq(generatedDocuments.aiSystemId, aiSystemId))
      .orderBy(desc(generatedDocuments.generatedAt));
  }

  async getDocumentsByUser(userId: string): Promise<GeneratedDocument[]> {
    return await db
      .select()
      .from(generatedDocuments)
      .where(eq(generatedDocuments.userId, userId))
      .orderBy(desc(generatedDocuments.generatedAt));
  }

  // Regulatory Monitoring
  async getRegulatoryUpdates(limit = 50): Promise<RegulatoryUpdate[]> {
    return await db
      .select()
      .from(regulatoryUpdates)
      .orderBy(desc(regulatoryUpdates.publishedAt))
      .limit(limit);
  }

  async createRegulatoryUpdate(update: Omit<RegulatoryUpdate, 'id' | 'createdAt'>): Promise<RegulatoryUpdate> {
    const [result] = await db.insert(regulatoryUpdates).values(update).returning();
    return result;
  }

  // LLM Settings
  async getLlmSettings(userId: string): Promise<LlmSettings[]> {
    return await db
      .select()
      .from(llmSettings)
      .where(eq(llmSettings.userId, userId))
      .orderBy(desc(llmSettings.createdAt));
  }

  async upsertLlmSettings(settings: InsertLlmSettings): Promise<LlmSettings> {
    const [result] = await db
      .insert(llmSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: [llmSettings.userId, llmSettings.provider],
        set: {
          ...settings,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getActiveLlmSettings(userId: string): Promise<LlmSettings | undefined> {
    const [settings] = await db
      .select()
      .from(llmSettings)
      .where(and(eq(llmSettings.userId, userId), eq(llmSettings.isActive, true)))
      .limit(1);
    return settings;
  }
}

export const storage = new DatabaseStorage();
