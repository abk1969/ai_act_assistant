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
  unique,
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

// User storage table (autonomous authentication)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
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

// Positive AI Framework v3.0 dimensions enum
export const aiFrameworkDimensionEnum = pgEnum('ai_framework_dimension', [
  'justice_fairness',
  'transparency_explainability', 
  'human_ai_interaction',
  'social_environmental_impact',
  'responsibility',
  'data_privacy',
  'technical_robustness_security'
]);

// Framework v3.0 strategies enum for each dimension
export const frameworkStrategyEnum = pgEnum('framework_strategy', [
  // Justice & Fairness strategies
  'data_biases_identified_mitigated',
  'design_biases_identified_mitigated',
  'biased_results_identified_mitigated',
  'bias_monitoring',
  'stakeholder_engagement',
  // Transparency & Explainability strategies
  'algorithmic_transparency',
  'decision_transparency',
  'process_transparency',
  // Human-AI Interaction strategies
  'human_oversight_control',
  'meaningful_human_control',
  'user_empowerment',
  // Social & Environmental Impact strategies
  'sustainably_developed_by_design',
  'promoting_positive_outcomes',
  'avoidance_of_societal_harms',
  // Responsibility strategies
  'collection_data_traceable_requirements',
  'license_of_data',
  'protected_from_disclosure',
  'approaches_privacy_preservation',
  'accountability_governance',
  // Data & Privacy strategies
  'data_minimization',
  'purpose_limitation',
  'consent_management',
  'security_protection',
  'rights_management',
  // Technical Robustness & Security strategies
  'accuracy_reliability',
  'fallback_procedures',
  'security_resilience'
]);

// Risk assessment levels for framework dimensions (0 to 4 stars)
export const frameworkRiskLevelEnum = pgEnum('framework_risk_level', ['none', 'minimal', 'moderate', 'high', 'critical']);

// Industry sectors enum based on EU AI Act and Positive AI framework
export const industrySectorEnum = pgEnum('industry_sector', [
  'finance_banking',
  'healthcare_medical',
  'education_training',
  'transportation_automotive',
  'retail_ecommerce',
  'manufacturing_industrial',
  'energy_utilities',
  'telecommunications',
  'insurance',
  'real_estate',
  'agriculture',
  'legal_services',
  'media_entertainment',
  'government_public_sector',
  'defense_security',
  'research_development',
  'consulting_professional_services',
  'technology_software',
  'logistics_supply_chain',
  'hospitality_tourism',
  'non_profit',
  'other'
]);

// Use case types from Positive AI framework
export const aiUseCaseEnum = pgEnum('ai_use_case', [
  'claims_management',
  'talent_acquisition_recruitment',
  'pricing_personalization',
  'marketing_personalization',
  'customer_service_chatbot',
  'fraud_detection',
  'risk_assessment',
  'decision_support',
  'predictive_analytics',
  'image_recognition',
  'natural_language_processing',
  'recommendation_systems',
  'automated_decision_making',
  'biometric_identification',
  'content_moderation',
  'quality_control',
  'supply_chain_optimization',
  'medical_diagnosis',
  'financial_trading',
  'other'
]);

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

// Risk assessments table (Extended for Positive AI Framework v3.0 + EU AI Act)
export const riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  aiSystemId: varchar("ai_system_id").notNull().references(() => aiSystems.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  // Basic system information
  systemName: varchar("system_name").notNull().default('System IA'),
  organizationName: varchar("organization_name").notNull().default('Organisation'),
  industrySector: industrySectorEnum("industry_sector"),
  primaryUseCase: aiUseCaseEnum("primary_use_case"),
  systemDescription: text("system_description"),
  
  // EU AI Act Classification (Tier 1)
  euAiActRiskLevel: riskLevelEnum("eu_ai_act_risk_level").notNull().default('minimal'),
  euAiActClassification: jsonb("eu_ai_act_classification"), // Details on why classified as this level
  isHighRiskDomain: boolean("is_high_risk_domain").default(false),
  highRiskDomains: jsonb("high_risk_domains"), // Array of applicable domains from Annex III
  
  // Positive AI Framework v3.0 Assessment (Tier 2) 
  frameworkResponses: jsonb("framework_responses").notNull().default('{}'), // Question responses per dimension
  dimensionScores: jsonb("dimension_scores").notNull().default('{}'), // Score 0-100 for each of 7 dimensions  
  overallFrameworkScore: integer("overall_framework_score"), // Weighted average 0-100
  
  // Combined Risk Assessment Result
  formData: jsonb("form_data").notNull(), // Full form data for reference
  riskScore: integer("risk_score"), // Combined risk score 0-100
  riskLevel: riskLevelEnum("risk_level"), // Final risk level considering both tiers
  reasoning: text("reasoning"), // AI-generated explanation
  
  // EU AI Act Compliance
  applicableObligations: jsonb("applicable_obligations"), // Array of obligations
  complianceGaps: jsonb("compliance_gaps"), // Identified non-compliance issues
  complianceScore: integer("compliance_score"), // 0-100 compliance rating
  
  // Recommendations and Action Plan
  recommendations: jsonb("recommendations"),
  actionPlan: jsonb("action_plan"), // Structured timeline: immediate, short_term, long_term
  priorityActions: jsonb("priority_actions"), // High-priority items
  
  // Assessment Metadata
  assessmentVersion: varchar("assessment_version").default('3.0'), // Framework version used
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
}, (table) => ({
  // Contrainte unique : un seul provider par utilisateur
  uniqueUserProvider: unique().on(table.userId, table.provider),
}));

// Organizational maturity assessments table (Extended for Positive AI Framework v3.0)
export const maturityAssessments = pgTable("maturity_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  organizationName: varchar("organization_name").notNull(),
  industrySector: industrySectorEnum("industry_sector"),
  primaryUseCase: aiUseCaseEnum("primary_use_case"),
  assessmentData: jsonb("assessment_data").notNull(),
  // Framework v3.0 dimension scores (0-100 each)
  dimensionScores: jsonb("dimension_scores"), // 7 dimensions with detailed scoring
  // Risk levels per dimension (for customer and employee impact)
  customerRiskLevels: jsonb("customer_risk_levels"), // Risk levels for customer-facing AI
  employeeRiskLevels: jsonb("employee_risk_levels"), // Risk levels for employee-facing AI
  // Legacy fields (preserved for compatibility)
  overallMaturity: maturityLevelEnum("overall_maturity"),
  domainScores: jsonb("domain_scores"), // Legacy: AI Strategy, Governance, Ethics, Risk Management, etc.
  recommendations: jsonb("recommendations"),
  actionPlan: jsonb("action_plan"),
  overallScore: integer("overall_score"), // 0-100
  // EU AI Act compliance status
  euAiActCompliance: jsonb("eu_ai_act_compliance"), // Compliance mapping per article
  complianceGaps: jsonb("compliance_gaps"), // Identified gaps and action items
  completedAt: timestamp("completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Framework questions and criteria table (Positive AI v3.0)
export const frameworkQuestions = pgTable("framework_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dimension: aiFrameworkDimensionEnum("dimension").notNull(),
  strategyKey: frameworkStrategyEnum("strategy_key").notNull(), // Strategy identifier
  questionId: varchar("question_id").notNull().unique(), // e.g., "justice_1", "transparency_3" 
  strategy: text("strategy").notNull(), // Strategy name from framework
  question: text("question").notNull(), // Evaluation question
  correspondingAction: text("corresponding_action"), // Required action
  tools: jsonb("tools"), // Suggested tools (array)
  customerRiskLevel: frameworkRiskLevelEnum("customer_risk_level"), // Risk level for customer-facing
  employeeRiskLevel: frameworkRiskLevelEnum("employee_risk_level"), // Risk level for employee-facing  
  projectPhase: varchar("project_phase"), // When to implement
  weight: integer("weight").default(10), // Question weight (1-100)
  isActive: boolean("is_active").default(true),
  frameworkVersion: varchar("framework_version").default('3.0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Use case risk mapping (from Positive AI framework)
export const useCaseRiskMapping = pgTable("use_case_risk_mapping", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  useCase: aiUseCaseEnum("use_case").notNull(),
  industrySector: industrySectorEnum("industry_sector"),
  // Risk levels per dimension (customer and employee)
  customerRiskLevels: jsonb("customer_risk_levels").notNull(), // 7 dimensions
  employeeRiskLevels: jsonb("employee_risk_levels").notNull(), // 7 dimensions  
  description: text("description"),
  remarks: text("remarks"),
  frameworkVersion: varchar("framework_version").default('3.0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const frameworkQuestionsRelations = relations(frameworkQuestions, ({ one }) => ({}));

export const useCaseRiskMappingRelations = relations(useCaseRiskMapping, ({ one }) => ({}));

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

// Safe schemas for user registration/login (excludes passwordHash from responses)
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")).optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const safeUserSchema = createInsertSchema(users).omit({
  passwordHash: true,
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
  completedAt: true,
  createdAt: true,
  updatedAt: true,
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

export const insertFrameworkQuestionSchema = createInsertSchema(frameworkQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUseCaseRiskMappingSchema = createInsertSchema(useCaseRiskMapping).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'passwordHash'>; // Never expose password hash
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type AiSystem = typeof aiSystems.$inferSelect;
export type InsertAiSystem = z.infer<typeof insertAiSystemSchema>;
export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

// New interfaces for Enhanced Risk Assessment (EU AI Act + Framework v3.0)
export interface RiskAssessmentFormData {
  // Basic Information (Required)
  systemName: string;
  organizationName: string;
  industrySector?: string;
  primaryUseCase?: string;
  systemDescription?: string;
  
  // Framework Questions (Per dimension - 7 dimensions x ~3 questions each)
  frameworkResponses: Record<string, number>; // questionId -> response (1-5)
  
  // EU AI Act Specific Questions
  sensitiveData: 'yes' | 'limited' | 'no';
  discriminationRisk: 'high' | 'medium' | 'low';
  userInformed: 'full' | 'partial' | 'none';
  explainabilityLevel: 'high' | 'medium' | 'low';
  humanOversight: 'full' | 'intermittent' | 'minimal';
  overrideCapability: 'yes' | 'limited' | 'no';
  autonomyLevel: 'high' | 'medium' | 'low';
  safetyImpact: 'critical' | 'significant' | 'minimal';
  decisionConsequences: 'irreversible' | 'reversible' | 'advisory';
  applicationDomain: string;
  userCategories: string[];
  geographicalScope: 'eu' | 'national' | 'local';
}

export interface RiskAssessmentResult {
  // EU AI Act Classification (Tier 1)
  euAiActRiskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  euAiActClassification: {
    reasoning: string;
    applicableArticles: string[];
    isHighRiskDomain: boolean;
    highRiskDomains?: string[];
  };
  
  // Framework Scoring (Tier 2) 
  dimensionScores: Record<string, {
    score: number; // 0-100
    level: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical';
    strengths: string[];
    improvements: string[];
  }>;
  overallFrameworkScore: number; // 0-100
  
  // Combined Assessment
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  riskScore: number; // 0-100 combined score
  reasoning: string;
  
  // Compliance and Obligations
  applicableObligations: string[];
  complianceGaps: Array<{
    gap: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  complianceScore: number; // 0-100
  
  // Action Plan
  recommendations: string[];
  actionPlan: {
    immediate: Array<{
      action: string;
      priority: 'critical' | 'high' | 'medium';
      timeline: string;
    }>;
    short_term: Array<{
      action: string;
      priority: 'critical' | 'high' | 'medium';
      timeline: string;
    }>;
    long_term: Array<{
      action: string;
      priority: 'critical' | 'high' | 'medium';
      timeline: string;
    }>;
  };
  priorityActions: string[];
  
  // Metadata
  assessmentVersion: string;
  aiSystemId?: string;
  assessmentId?: string;
}
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
export type FrameworkQuestion = typeof frameworkQuestions.$inferSelect;
export type InsertFrameworkQuestion = z.infer<typeof insertFrameworkQuestionSchema>;
export type UseCaseRiskMapping = typeof useCaseRiskMapping.$inferSelect;
export type InsertUseCaseRiskMapping = z.infer<typeof insertUseCaseRiskMappingSchema>;

// Enhanced Framework v3.0 types
export interface FrameworkDimension {
  id: string;
  name: string;
  description: string;
  strategies: FrameworkStrategy[];
}

export interface FrameworkStrategy {
  id: string;
  key: string;
  name: string;
  description: string;
  questions: FrameworkQuestionData[];
}

export interface FrameworkQuestionData {
  id: string;
  questionId: string;
  text: string;
  correspondingAction: string;
  tools: string[];
  customerRiskLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  employeeRiskLevel: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  projectPhase: string;
  weight: number;
}

export interface FrameworkAssessmentData {
  systemName: string;
  organizationName: string;
  industrySector?: string;
  primaryUseCase?: string;
  systemDescription?: string;
  // Responses per dimension and strategy
  responses: Record<string, Record<string, number>>; // dimension -> questionId -> response (1-5)
}

export interface FrameworkAssessmentResult {
  // Dimension scores and analysis
  dimensionResults: Record<string, {
    score: number; // 0-100
    level: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical';
    strategyResults: Record<string, {
      score: number;
      level: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical';
      strengths: string[];
      improvements: string[];
    }>;
    overallStrengths: string[];
    overallImprovements: string[];
  }>;
  
  // Overall assessment
  overallScore: number; // 0-100 weighted average
  overallLevel: 'excellent' | 'good' | 'adequate' | 'needs_improvement' | 'critical';
  
  // Risk analysis
  customerRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  employeeRisk: 'none' | 'minimal' | 'moderate' | 'high' | 'critical';
  
  // Recommendations
  priorityActions: Array<{
    dimension: string;
    strategy: string;
    action: string;
    priority: 'critical' | 'high' | 'medium';
    timeline: string;
  }>;
  
  recommendations: string[];
  assessmentVersion: string;
}
