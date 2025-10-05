/**
 * Types et interfaces pour le système de veille réglementaire
 * Architecture multi-agents avec MCP et A2A
 */

export type OfficialSourceType = 'official_eu' | 'national_fr' | 'national_other' | 'standards';
export type DocumentType = 'regulation' | 'directive' | 'decision' | 'guidance' | 'consultation' | 'faq' | 'case_law';
export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';
export type Severity = 'critique' | 'important' | 'info';

export interface OfficialSource {
  id: string;
  name: string;
  url: string;
  type: OfficialSourceType;
  checkFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  credibilityScore: number; // 0-100
}

export interface RawRegulatoryData {
  sourceId: string;
  source: string;
  url: string;
  title: string;
  rawContent: string;
  publishedDate: Date;
  documentType: DocumentType;
  language: string;
  metadata: {
    celex?: string; // EUR-Lex CELEX number
    documentNumber?: string;
    authors?: string[];
    keywords?: string[];
    attachments?: string[];
  };
}

export interface AnalyzedUpdate {
  rawData: RawRegulatoryData;
  analysis: {
    relevanceScore: number; // 0-100
    aiActRelevance: boolean;
    impactLevel: ImpactLevel;
    affectedStakeholders: string[];
    keyTopics: string[];
    deadlines: Date[];
    actionRequired: boolean;
    confidenceScore: number; // 0-100
  };
}

export interface ClassifiedUpdate {
  analyzedData: AnalyzedUpdate;
  classification: {
    updateType: 'amendment' | 'delegated_act' | 'implementing_act' | 'guidance' | 'faq' | 'enforcement';
    impactedDomains: string[]; // e.g., ["Annexe III", "GPAI", "Transparence"]
    concernedActors: ('providers' | 'deployers' | 'distributors' | 'importers' | 'authorities')[];
    temporalUrgency: 'immediate' | '3_months' | '6_months' | '1_year' | 'future';
    relatedArticles: string[]; // AI Act article numbers
    detectsContradiction: boolean;
    contradictionDetails?: string;
  };
  enrichment: {
    extractedEntities: {
      dates: Date[];
      articles: string[];
      annexes: string[];
      organizations: string[];
    };
    linkedAiActArticles: string[];
    normativeChanges: string[];
  };
}

export interface RegulatoryInsight {
  classifiedData: ClassifiedUpdate;
  synthesis: {
    executiveSummary: string;
    keyPoints: string[];
    practicalImplications: string[];
    recommendedActions: Action[];
    complianceChecklist: ChecklistItem[];
    estimatedImpactScore: number; // 0-100
  };
}

export interface Action {
  id: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  deadline?: Date;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ChecklistItem {
  id: string;
  task: string;
  required: boolean;
  deadline?: Date;
  relatedArticle?: string;
  completed: boolean;
}

export interface NotificationPreference {
  userId: string;
  channels: ('email' | 'in_app' | 'webhook')[];
  frequency: 'realtime' | 'daily_digest' | 'weekly_digest';
  filters: {
    minRelevanceScore?: number;
    impactLevels?: ImpactLevel[];
    concernedActors?: string[];
    topics?: string[];
  };
}

export interface AgentCard {
  agent_id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  communication: {
    protocols: ('http' | 'sse' | 'webhook' | 'grpc')[];
    formats: ('json' | 'xml' | 'protobuf')[];
  };
  status: 'online' | 'offline' | 'maintenance';
}

export interface AgentCapability {
  action: string;
  description: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
}

export interface AgentMessage {
  from_agent_id: string;
  to_agent_id: string;
  message_id: string;
  timestamp: Date;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  endpoint: string;
  capabilities: {
    resources: boolean;
    tools: boolean;
    prompts: boolean;
  };
  tools: MCPTool[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface MonitoringMetrics {
  totalSources: number;
  activeSources: number;
  totalUpdates: number;
  criticalAlerts: number;
  lastSync: Date;
  averageRelevanceScore: number;
  processingLatency: number; // milliseconds
  errorRate: number; // percentage
}

// ===== NOUVEAUX TYPES POUR LA VEILLE PROACTIVE =====

/**
 * Insight réglementaire personnalisé avec contexte utilisateur
 */
export interface PersonalizedRegulatoryInsight extends RegulatoryInsight {
  userContext: {
    impactedSystems: import('@shared/schema').AiSystem[];
    relevanceScore: number; // 0-100 personnalisé
    urgencyLevel: 'immediate' | 'high' | 'medium' | 'low';
    maturityGaps: string[];
    complianceGaps: string[];
    estimatedImpact: number; // 0-100
    riskAmplification: number; // Facteur d'amplification du risque
  };
}

/**
 * Insight réglementaire avec plan d'actions concret
 */
export interface ActionableRegulatoryInsight extends PersonalizedRegulatoryInsight {
  actionPlan: {
    priorityActions: PersonalizedAction[];
    systemSpecificActions: Record<string, PersonalizedAction[]>;
    complianceChecklist: PersonalizedChecklistItem[];
    timeline: ActionTimeline;
    estimatedEffort: string;
    budgetImpact?: string;
    riskMitigation: RiskMitigationPlan;
  };
}

/**
 * Action personnalisée avec détails d'exécution
 */
export interface PersonalizedAction extends Action {
  systemId?: string;
  systemName?: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  estimatedHours?: number;
  requiredSkills?: string[];
  dependencies?: string[];
  category: 'compliance' | 'documentation' | 'technical' | 'governance' | 'training';
  dueDate?: Date;
  owner?: string;
  resources?: string[];
}

/**
 * Item de checklist personnalisé
 */
export interface PersonalizedChecklistItem extends ChecklistItem {
  systemId?: string;
  systemName?: string;
  category: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  estimatedHours?: number;
  prerequisites?: string[];
  validationCriteria?: string[];
}

/**
 * Timeline des actions par période
 */
export interface ActionTimeline {
  immediate: PersonalizedAction[]; // 0-30 jours
  short_term: PersonalizedAction[]; // 1-3 mois
  medium_term: PersonalizedAction[]; // 3-6 mois
  long_term: PersonalizedAction[]; // 6+ mois
}

/**
 * Plan de mitigation des risques
 */
export interface RiskMitigationPlan {
  identifiedRisks: string[];
  mitigationActions: PersonalizedAction[];
  contingencyPlans: string[];
  monitoringRequirements: string[];
}

/**
 * Contexte utilisateur pour personnalisation
 */
export interface UserContext {
  userId: string;
  aiSystems: import('@shared/schema').AiSystem[];
  maturityAssessment?: import('@shared/schema').MaturityAssessment;
  complianceRecords: import('@shared/schema').ComplianceRecord[];
  organizationProfile: {
    sector?: string;
    maturityLevel: string;
    riskTolerance: 'low' | 'medium' | 'high';
    complianceScore: number;
  };
}

/**
 * Résultat du workflow étendu avec personnalisation
 */
export interface EnhancedWorkflowResult {
  actionableInsights: ActionableRegulatoryInsight[];
  metrics: {
    totalCollected: number;
    totalAnalyzed: number;
    totalPersonalized: number;
    totalActionable: number;
    sourceStatus: Record<string, { success: boolean; count: number; error?: string }>;
    executionTime: number;
    timestamp: Date;
    personalizationMetrics: {
      averageRelevanceScore: number;
      highUrgencyCount: number;
      totalActionsGenerated: number;
      averageActionsPerInsight: number;
    };
  };
}

/**
 * Dashboard d'impact personnalisé
 */
export interface ImpactDashboard {
  userId: string;
  summary: {
    totalInsights: number;
    highPriorityActions: number;
    impactedSystems: number;
    urgentDeadlines: number;
    complianceGaps: number;
    estimatedEffort: string;
  };
  riskAnalysis: {
    riskAmplificationFactor: number;
    criticalSystems: import('@shared/schema').AiSystem[];
    riskTrends: {
      increasing: number;
      stable: number;
      decreasing: number;
    };
  };
  actionBreakdown: {
    byCategory: Record<PersonalizedAction['category'], number>;
    byPriority: Record<PersonalizedAction['priority'], number>;
    byTimeline: Record<keyof ActionTimeline, number>;
  };
  complianceStatus: {
    overallScore: number;
    gapsBySystem: Record<string, string[]>;
    upcomingDeadlines: Array<{
      action: PersonalizedAction;
      daysRemaining: number;
    }>;
  };
}
