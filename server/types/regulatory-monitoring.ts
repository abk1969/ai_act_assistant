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
