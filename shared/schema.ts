import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk levels enum
export const riskLevelEnum = pgEnum('risk_level', ['minimal', 'limited', 'high', 'unacceptable']);

// AI system status enum
export const systemStatusEnum = pgEnum('system_status', ['draft', 'active', 'archived', 'non_compliant']);

// AI systems table
export const aiSystems = pgTable("ai_systems", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  sector: varchar("sector"),
  riskLevel: riskLevelEnum("risk_level"),
  status: systemStatusEnum("status").default('draft'),
  assessmentData: jsonb("assessment_data"),
  complianceScore: integer("compliance_score"),
  lastAssessed: timestamp("last_assessed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk assessments table
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiSystemId: varchar("ai_system_id").notNull().references(() => aiSystems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  formData: jsonb("form_data").notNull(),
  riskScore: integer("risk_score"),
  riskLevel: riskLevelEnum("risk_level"),
  recommendations: jsonb("recommendations"),
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// EU AI Act articles database
export const aiActArticles = pgTable("ai_act_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleNumber: varchar("article_number").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  chapter: varchar("chapter"),
  riskCategory: varchar("risk_category"),
  obligations: jsonb("obligations"),
  effectiveDate: timestamp("effective_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Compliance records table
export const complianceRecords = pgTable("compliance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiSystemId: varchar("ai_system_id").notNull().references(() => aiSystems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  articleId: varchar("article_id").notNull().references(() => aiActArticles.id),
  compliant: boolean("compliant").default(false),
  evidence: text("evidence"),
  notes: text("notes"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Generated documents table
export const generatedDocuments = pgTable("generated_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiSystemId: varchar("ai_system_id").notNull().references(() => aiSystems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  documentType: varchar("document_type").notNull(),
  title: varchar("title").notNull(),
  content: text("content"),
  filePath: varchar("file_path"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Regulatory monitoring feed
export const regulatoryUpdates = pgTable("regulatory_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  url: varchar("url"),
  severity: varchar("severity"), // critical, important, info
  category: varchar("category"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// LLM configuration settings
export const llmSettings = pgTable("llm_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  model: varchar("model"),
  apiKey: text("api_key"), // encrypted
  endpoint: varchar("endpoint"),
  temperature: integer("temperature").default(30), // stored as int (0.3 * 100)
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  aiSystems: many(aiSystems),
  riskAssessments: many(riskAssessments),
  complianceRecords: many(complianceRecords),
  generatedDocuments: many(generatedDocuments),
  llmSettings: many(llmSettings),
}));

export const aiSystemsRelations = relations(aiSystems, ({ one, many }) => ({
  user: one(users, {
    fields: [aiSystems.userId],
    references: [users.id],
  }),
  riskAssessments: many(riskAssessments),
  complianceRecords: many(complianceRecords),
  generatedDocuments: many(generatedDocuments),
}));

export const riskAssessmentsRelations = relations(riskAssessments, ({ one }) => ({
  aiSystem: one(aiSystems, {
    fields: [riskAssessments.aiSystemId],
    references: [aiSystems.id],
  }),
  user: one(users, {
    fields: [riskAssessments.userId],
    references: [users.id],
  }),
}));

export const complianceRecordsRelations = relations(complianceRecords, ({ one }) => ({
  aiSystem: one(aiSystems, {
    fields: [complianceRecords.aiSystemId],
    references: [aiSystems.id],
  }),
  user: one(users, {
    fields: [complianceRecords.userId],
    references: [users.id],
  }),
  article: one(aiActArticles, {
    fields: [complianceRecords.articleId],
    references: [aiActArticles.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiSystemSchema = createInsertSchema(aiSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  createdAt: true,
});

export const insertComplianceRecordSchema = createInsertSchema(complianceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedDocumentSchema = createInsertSchema(generatedDocuments).omit({
  id: true,
  generatedAt: true,
});

export const insertLlmSettingsSchema = createInsertSchema(llmSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AiSystem = typeof aiSystems.$inferSelect;
export type InsertAiSystem = z.infer<typeof insertAiSystemSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;
export type AiActArticle = typeof aiActArticles.$inferSelect;
export type ComplianceRecord = typeof complianceRecords.$inferSelect;
export type InsertComplianceRecord = z.infer<typeof insertComplianceRecordSchema>;
export type GeneratedDocument = typeof generatedDocuments.$inferSelect;
export type InsertGeneratedDocument = z.infer<typeof insertGeneratedDocumentSchema>;
export type RegulatoryUpdate = typeof regulatoryUpdates.$inferSelect;
export type LlmSettings = typeof llmSettings.$inferSelect;
export type InsertLlmSettings = z.infer<typeof insertLlmSettingsSchema>;
