import {
  Server,
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequest,
  ListToolsRequest,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
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
  private server: Server;
  private storage: ContextStorage;
  private preprocessor: ContextPreprocessor;
  private models: Map<string, ContextModel> = new Map();

  constructor() {
    this.server = new Server({
      name: "context-processor",
      version: "1.0.0",
    });

    this.storage = new ContextStorage("./contexts");
    this.preprocessor = new ContextPreprocessor();

    this.setupHandlers();
    this.loadModels();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequest, async () => {
      return {
        tools: this.getAvailableTools(),
      };
    });

    this.server.setRequestHandler(CallToolRequest, async (request) => {
      return this.handleToolCall(request);
    });
  }

  private getAvailableTools(): Tool[] {
    return [
      {
        name: "save_context",
        description:
          "Save content as context with optional pre-processing using a model",
        inputSchema: {
          type: "object" as const,
          properties: {
            title: {
              type: "string",
              description: "Title for the context",
            },
            content: {
              type: "string",
              description: "Content to save",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for organizing context",
            },
            metadata: {
              type: "object",
              description: "Additional metadata",
            },
            modelName: {
              type: "string",
              description:
                "Name of the context model to use for pre-processing",
            },
          },
          required: ["title", "content"],
        },
      },
      {
        name: "load_context",
        description: "Load a previously saved context by ID",
        inputSchema: {
          type: "object" as const,
          properties: {
            contextId: {
              type: "string",
              description: "ID of the context to load",
            },
          },
          required: ["contextId"],
        },
      },
      {
        name: "list_contexts",
        description: "List all saved contexts with optional filtering",
        inputSchema: {
          type: "object" as const,
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Filter by tags",
            },
            limit: {
              type: "number",
              description: "Maximum number of contexts to return",
            },
            offset: {
              type: "number",
              description: "Number of contexts to skip",
            },
          },
        },
      },
      {
        name: "list_models",
        description: "List available context models for pre-processing",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "delete_context",
        description: "Delete a context by ID",
        inputSchema: {
          type: "object" as const,
          properties: {
            contextId: {
              type: "string",
              description: "ID of the context to delete",
            },
          },
          required: ["contextId"],
        },
      },
      {
        name: "get_model_info",
        description: "Get detailed information about a context model",
        inputSchema: {
          type: "object" as const,
          properties: {
            modelName: {
              type: "string",
              description: "Name of the model",
            },
          },
          required: ["modelName"],
        },
      },
    ];
  }

  private async handleToolCall(
    request: CallToolRequest
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const { name, arguments: args } = request;

    try {
      let result: string;

      switch (name) {
        case "save_context":
          result = await this.handleSaveContext(args as SaveContextRequest);
          break;
        case "load_context":
          result = await this.handleLoadContext(args as LoadContextRequest);
          break;
        case "list_contexts":
          result = await this.handleListContexts(
            args as ListContextsRequest
          );
          break;
        case "list_models":
          result = this.handleListModels();
          break;
        case "delete_context":
          result = this.handleDeleteContext(args as { contextId: string });
          break;
        case "get_model_info":
          result = this.handleGetModelInfo(args as { modelName: string });
          break;
        default:
          result = `Unknown tool: ${name}`;
      }

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
      };
    }
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
