import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { ContextStorage } from "./storage.js";
import { ContextPreprocessor } from "./preprocessor.js";
import {
  ContextItem,
  SaveContextRequest,
  SaveContextResponse,
  LoadContextRequest,
  LoadContextResponse,
  ListContextsRequest,
  ListContextsResponse,
  ContextModel,
  PreProcessingStrategy,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";

class ContextMCPServer {
  private server: McpServer;
  private storage: ContextStorage;
  private preprocessor: ContextPreprocessor;
  private models: Map<string, ContextModel> = new Map();

  constructor() {
    this.server = new McpServer({
      name: "context-processor",
      version: "1.0.0",
    });

    this.storage = new ContextStorage("./contexts");
    this.preprocessor = new ContextPreprocessor();

    this.loadModels();
    this.setupTools();
  }

  private setupTools(): void {
    // Register save_context tool
    this.server.registerTool(
      "save_context",
      {
        description:
          "Save content as context with optional pre-processing using a model",
        inputSchema: z.object({
          title: z.string().describe("Title for the context"),
          content: z.string().describe("Content to save"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Tags for organizing context"),
          metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
          modelName: z
            .string()
            .optional()
            .describe("Name of the context model to use for pre-processing"),
        }),
      },
      async (args) => {
        try {
          const result = await this.handleSaveContext(args as SaveContextRequest);
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register load_context tool
    this.server.registerTool(
      "load_context",
      {
        description: "Load a previously saved context by ID",
        inputSchema: z.object({
          contextId: z.string().describe("ID of the context to load"),
        }),
      },
      async (args) => {
        try {
          const result = await this.handleLoadContext(args as LoadContextRequest);
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register list_contexts tool
    this.server.registerTool(
      "list_contexts",
      {
        description: "List all saved contexts with optional filtering",
        inputSchema: z.object({
          tags: z
            .array(z.string())
            .optional()
            .describe("Filter by tags"),
          limit: z
            .number()
            .optional()
            .describe("Maximum number of contexts to return"),
          offset: z
            .number()
            .optional()
            .describe("Number of contexts to skip"),
        }),
      },
      async (args) => {
        try {
          const result = await this.handleListContexts(args as ListContextsRequest);
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register list_models tool
    this.server.registerTool(
      "list_models",
      {
        description: "List available context models for pre-processing",
        inputSchema: z.object({}),
      },
      async () => {
        try {
          const result = this.handleListModels();
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register delete_context tool
    this.server.registerTool(
      "delete_context",
      {
        description: "Delete a context by ID",
        inputSchema: z.object({
          contextId: z.string().describe("ID of the context to delete"),
        }),
      },
      async (args) => {
        try {
          const result = this.handleDeleteContext(args as { contextId: string });
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register get_model_info tool
    this.server.registerTool(
      "get_model_info",
      {
        description: "Get detailed information about a context model",
        inputSchema: z.object({
          modelName: z.string().describe("Name of the model"),
        }),
      },
      async (args) => {
        try {
          const result = this.handleGetModelInfo(args as { modelName: string });
          return {
            content: [{ type: "text", text: result }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register search_contexts_fulltext tool
    this.server.registerTool(
      "search_contexts_fulltext",
      {
        description: "Search contexts by keywords in title and content",
        inputSchema: z.object({
          query: z.string().describe("Search query (e.g., 'typescript async')"),
          limit: z.number().optional().describe("Max results (default: 50)"),
        }),
      },
      async (args) => {
        try {
          const results = this.storage.searchFullText(args.query, {
            limit: args.limit || 50,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query: args.query,
                    count: results.length,
                    results: results.map((c) => ({
                      id: c.id,
                      title: c.title,
                      tags: c.tags,
                      preview: c.content.substring(0, 200) + (c.content.length > 200 ? "..." : ""),
                      createdAt: c.createdAt,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private async handleSaveContext(
    request: SaveContextRequest
  ): Promise<string> {
    const contextId = randomUUID();
    const now = Date.now();

    let processedContent = request.content;
    const appliedStrategies: string[] = [];

    // Apply pre-processing if model is specified
    if (request.modelName) {
      const model = this.models.get(request.modelName);
      if (model) {
        const enabledStrategies = model.strategies.filter((s) => s.enabled);
        if (enabledStrategies.length > 0) {
          const { processed, results } =
            await this.preprocessor.processContent(
              request.content,
              enabledStrategies
            );
          processedContent = processed;
          appliedStrategies.push(
            ...results
              .filter((r) => r.processed)
              .map((r) => r.strategy)
          );
        }
      }
    }

    const context: ContextItem = {
      id: contextId,
      title: request.title,
      content: processedContent,
      metadata: request.metadata || {},
      createdAt: now,
      updatedAt: now,
      tags: request.tags || [],
    };

    this.storage.save(context);

    const response: SaveContextResponse = {
      success: true,
      contextId,
      processedContent: appliedStrategies.length > 0 ? processedContent : undefined,
      appliedStrategies,
      timestamp: now,
    };

    return JSON.stringify(response, null, 2);
  }

  private async handleLoadContext(
    request: LoadContextRequest
  ): Promise<string> {
    const context = this.storage.load(request.contextId);
    if (!context) {
      return JSON.stringify({
        success: false,
        error: "Context not found",
      });
    }

    const allContexts = this.storage.list();
    const relatedContexts = allContexts
      .filter((c) => {
        if (c.id === context.id) return false;
        const commonTags = c.tags.filter((tag) => context.tags.includes(tag));
        return commonTags.length > 0;
      })
      .slice(0, 5);

    const response: LoadContextResponse = {
      context,
      relatedContexts,
    };

    return JSON.stringify(response, null, 2);
  }

  private async handleListContexts(
    request: ListContextsRequest
  ): Promise<string> {
    const contexts = this.storage.search(request.tags, request.limit, request.offset);

    const response: ListContextsResponse = {
      contexts,
      total: this.storage.list().length,
    };

    return JSON.stringify(response, null, 2);
  }

  private handleListModels(): string {
    const modelsList = Array.from(this.models.values()).map((m) => ({
      name: m.name,
      description: m.description,
      strategyCount: m.strategies.length,
    }));

    return JSON.stringify(
      {
        models: modelsList,
        total: modelsList.length,
      },
      null,
      2
    );
  }

  private handleDeleteContext(args: { contextId: string }): string {
    const success = this.storage.delete(args.contextId);
    return JSON.stringify({
      success,
      contextId: args.contextId,
      message: success ? "Context deleted" : "Context not found",
    });
  }

  private handleGetModelInfo(args: { modelName: string }): string {
    const model = this.models.get(args.modelName);
    if (!model) {
      return JSON.stringify({
        error: "Model not found",
        available: Array.from(this.models.keys()),
      });
    }

    return JSON.stringify(model, null, 2);
  }

  private loadModels(): void {
    const configPath = path.join(process.cwd(), "context-models.json");

    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData);

        if (config.models && Array.isArray(config.models)) {
          config.models.forEach((modelConfig: ContextModel) => {
            this.models.set(modelConfig.name, modelConfig);
          });
        }
      } catch (error) {
        console.error("Failed to load context models:", error);
      }
    } else {
      // Load default models
      this.loadDefaultModels();
    }
  }

  private loadDefaultModels(): void {
    const defaultModels: ContextModel[] = [
      {
        name: "clarify",
        description: "Model focused on clarifying and improving content clarity",
        strategies: [
          {
            name: "clarify",
            type: "clarify",
            enabled: true,
          },
        ],
      },
      {
        name: "enhance_search",
        description: "Model for enhancing searchability of content",
        strategies: [
          {
            name: "extract_keywords",
            type: "search",
            enabled: true,
          },
        ],
      },
      {
        name: "comprehensive",
        description:
          "Comprehensive model with multiple processing strategies",
        strategies: [
          {
            name: "clarify",
            type: "clarify",
            enabled: true,
          },
          {
            name: "analyze",
            type: "analyze",
            enabled: true,
          },
          {
            name: "search",
            type: "search",
            enabled: true,
          },
        ],
      },
    ];

    defaultModels.forEach((model) => {
      this.models.set(model.name, model);
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Context Processor started");
  }
}

// Start the server
const server = new ContextMCPServer();
server.start().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
