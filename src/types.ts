/**
 * Types for the Context MCP Server
 */

export interface ContextItem {
  id: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface PreProcessingStrategy {
  name: string;
  type: "clarify" | "search" | "analyze" | "fetch" | "custom";
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface ContextModel {
  name: string;
  description: string;
  strategies: PreProcessingStrategy[];
  storageLocation?: string;
}

export interface SaveContextRequest {
  title: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  modelName?: string;
}

export interface SaveContextResponse {
  success: boolean;
  contextId: string;
  processedContent?: string;
  appliedStrategies: string[];
  timestamp: number;
}

export interface LoadContextRequest {
  contextId: string;
}

export interface LoadContextResponse {
  context: ContextItem;
  relatedContexts: ContextItem[];
}

export interface ListContextsRequest {
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface ListContextsResponse {
  contexts: ContextItem[];
  total: number;
}

export interface PreProcessingResult {
  strategy: string;
  processed: boolean;
  result?: string;
  error?: string;
}
