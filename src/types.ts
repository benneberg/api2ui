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

export interface Intent {
  goal: string;
  selectedCapabilities: string[];
}

export interface ExecutionNode {
  id: string;
  capabilityId: string;
  capability: Capability;
  type: 'READ' | 'MUTATION';
  bindings: Record<string, any>;
}

export interface ExecutionEdge {
  from: string;
  to: string;
}

export interface jdCard {
  version: string;
  intent: Intent;
  capabilities: {
    mode: 'READ_ONLY' | 'WRITE_ALLOWED';
    requiredEndpoints: string[];
  };
  execution: {
    nodes: ExecutionNode[];
    edges: ExecutionEdge[];
  };
  ui: {
    layout: any[];
    componentRegistryVersion: string;
  };
  metadata: {
    specUrl: string;
    createdAt: string;
  };
}

export type ViewType = 'spec' | 'intent' | 'plan' | 'test' | 'lab' | 'preview' | 'library';

export type AIProvider = 'gemini' | 'openrouter' | 'groq';

export interface TestResult {
  capabilityId: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  latency: number;
  statusCode?: number;
  error?: string;
}

export interface Project {
  id: string;
  name: string;
  jdCard: jdCard | null;
  updatedAt: string;
}
