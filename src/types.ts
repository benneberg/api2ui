export interface Capability {
  id: string;
  path: string;
  method: string;
  summary: string;
  isRead: boolean;
  operationId?: string;
  inputSchema?: any;
  outputSchema?: any;
  safetyClassification: 'READ_ONLY' | 'MUTATES_DATA' | 'REQUIRES_AUTH';
}

export interface IntentMap {
  goal: string;
  targetEntity?: string;
  steps: {
    capabilityId: string;
    actionType: 'READ' | 'FILTER' | 'TRANSFORM' | 'MUTATE';
    inferredParams: Record<string, any>;
  }[];
}

export interface JDCard {
  id: string;
  version: string;
  metadata: {
    title: string;
    targetDomain?: string;
    compiledAt: string;
  };
  capabilitiesMode: 'READ_ONLY' | 'WRITE_SESSION_REQUIRED' | 'WRITE_ALLOWED';
  contracts: {
    inboundIntent: string;
    expectedEntity: string;
    acceptanceTests?: string[];
  };
  executionGraph: {
    rootNode: string;
    nodes: Record<string, ExecutionNode>;
  };
  uiProjection: {
    layout: 'SINGLE_PAGE' | 'STEPPER' | 'DASHBOARD' | 'vertical-stack';
    components: UIComponentSchema[];
    componentRegistryVersion: string;
  };
}

export interface ExecutionNode {
  id: string;
  operationId?: string;
  verb: string;
  path?: string;
  type?: 'READ' | 'MUTATION' | 'TRANSFORM' | 'LOCAL_LOG';
  capability?: Capability; // Reference to original capability definition
  parameters: Record<string, any>;
  exports?: Record<string, string>; // name -> path in response
  onSuccess: string | 'END' | 'TRIGGER_SAGA_ROLLBACK';
  onFailure: string | 'END' | 'TRIGGER_SAGA_ROLLBACK' | null;
  compensation?: {
    verb: string;
    path: string;
    parameters: Record<string, any>;
  };
  iterator?: string; // If this node should iterate over a previous export
}

export interface UIComponentSchema {
  id: string;
  type: 'TABLE' | 'FILTER_BAR' | 'ACTION_PANEL' | 'DIFF_VIEW' | 'CHART' | 'FORM' | 'STATUS_LOG' | 'Metric-Card' | 'Data-Table' | 'Action-Trigger-Button';
  title?: string;
  bindings: Record<string, any>;
  properties?: Record<string, any>;
  events?: Record<string, string>;
  bindsTo?: string; // For legacy compatibility or simplified mapping
}

export type ViewType = 'spec' | 'intent' | 'plan' | 'test' | 'preview' | 'lab' | 'history' | 'versions';

export type AIProvider = 'gemini' | 'openrouter' | 'groq';

export interface Project {
  id: string;
  name: string;
  jdCard: JDCard | null;
  versionHistory?: JDCard[];
  updatedAt: string;
}

export interface RepairIssue {
  type: 'BROKEN_REF' | 'MISSING_TYPE' | 'MISSING_SUMMARY' | 'MALFORMED_SPEC' | 'INVALID_JSON';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  location: string;
  message: string;
  heuristic?: string;
  suggestion?: any;
}

export interface RepairReport {
  timestamp: string;
  issues: RepairIssue[];
  fixedIssues: number;
}

export interface TestResult {
  capabilityId: string;
  status: 'SUCCESS' | 'FAILURE';
  latency: number;
  statusCode?: number;
  error?: string;
}
