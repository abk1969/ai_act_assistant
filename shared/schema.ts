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

// Maturity levels enum for organizational assessment
export const maturityLevelEnum = pgEnum('maturity_level', ['initial', 'developing', 'defined', 'managed', 'optimizing']);

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

// Organizational maturity assessments table
export const maturityAssessments = pgTable("maturity_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationName: varchar("organization_name").notNull(),
  assessmentData: jsonb("assessment_data").notNull(),
  overallMaturity: maturityLevelEnum("overall_maturity"),
  domainScores: jsonb("domain_scores"), // AI Strategy, Governance, Ethics, Risk Management, etc.
  recommendations: jsonb("recommendations"),
  actionPlan: jsonb("action_plan"),
  overallScore: integer("overall_score"), // 0-100
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificate status enum
export const certificateStatusEnum = pgEnum('certificate_status', ['valid', 'expired', 'revoked', 'pending']);

// Certificate type enum  
export const certificateTypeEnum = pgEnum('certificate_type', ['conformity', 'risk_assessment', 'maturity', 'compliance_summary']);

// Compliance certificates table
export const complianceCertificates = pgTable("compliance_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  aiSystemId: varchar("ai_system_id").references(() => aiSystems.id),
  maturityAssessmentId: varchar("maturity_assessment_id").references(() => maturityAssessments.id),
  certificateType: certificateTypeEnum("certificate_type").notNull(),
  certificateNumber: varchar("certificate_number").notNull().unique(),
  status: certificateStatusEnum("status").default('valid'),
  organizationName: varchar("organization_name").notNull(),
  systemName: varchar("system_name"),
  riskLevel: riskLevelEnum("risk_level"),
  complianceScore: integer("compliance_score"), // 0-100
  maturityLevel: maturityLevelEnum("maturity_level"),
  certificationCriteria: jsonb("certification_criteria"), // What criteria were evaluated
  complianceDetails: jsonb("compliance_details"), // Detailed compliance status
  issuedBy: varchar("issued_by").default('IA-ACT-NAVIGATOR'),
  issuedAt: timestamp("issued_at").defaultNow(),
  validUntil: timestamp("valid_until"), // 1 year validity
  certificateData: jsonb("certificate_data"), // Full certificate content for PDF generation
  certificationHash: varchar("certification_hash"), // Hash for verification
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
  maturityAssessments: many(maturityAssessments),
  complianceCertificates: many(complianceCertificates),
}));

export const aiSystemsRelations = relations(aiSystems, ({ one, many }) => ({
  user: one(users, {
    fields: [aiSystems.userId],
    references: [users.id],
  }),
  riskAssessments: many(riskAssessments),
  complianceRecords: many(complianceRecords),
  generatedDocuments: many(generatedDocuments),
  complianceCertificates: many(complianceCertificates),
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

export const maturityAssessmentsRelations = relations(maturityAssessments, ({ one, many }) => ({
  user: one(users, {
    fields: [maturityAssessments.userId],
    references: [users.id],
  }),
  complianceCertificates: many(complianceCertificates),
}));

export const complianceCertificatesRelations = relations(complianceCertificates, ({ one }) => ({
  user: one(users, {
    fields: [complianceCertificates.userId],
    references: [users.id],
  }),
  aiSystem: one(aiSystems, {
    fields: [complianceCertificates.aiSystemId],
    references: [aiSystems.id],
  }),
  maturityAssessment: one(maturityAssessments, {
    fields: [complianceCertificates.maturityAssessmentId],
    references: [maturityAssessments.id],
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

export const insertMaturityAssessmentSchema = createInsertSchema(maturityAssessments).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertComplianceCertificateSchema = createInsertSchema(complianceCertificates).omit({
  id: true,
  issuedAt: true,
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
export type MaturityAssessment = typeof maturityAssessments.$inferSelect;
export type InsertMaturityAssessment = z.infer<typeof insertMaturityAssessmentSchema>;
export type ComplianceCertificate = typeof complianceCertificates.$inferSelect;
export type InsertComplianceCertificate = z.infer<typeof insertComplianceCertificateSchema>;
