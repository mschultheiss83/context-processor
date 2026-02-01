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
  HealthCheckRequest,
  MetricsRequest,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";
import { logger, LogLevel } from "./logger.js";
import { metrics } from "./metrics.js";
import { healthChecker } from "./health.js";

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

    logger.info("Initializing Context MCP Server", {
      component: "server",
      version: "1.0.0",
    });

    this.storage = new ContextStorage("./contexts");
    this.preprocessor = new ContextPreprocessor();

    this.loadModels();
    this.setupTools();

    // Initialize metrics with current context count
    const contexts = this.storage.list();
    metrics.setTotalContexts(contexts.length);

    logger.info("Context MCP Server initialized", {
      component: "server",
      contextsLoaded: contexts.length,
      modelsLoaded: this.models.size,
    });
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

    // Register health_check tool
    this.server.registerTool(
      "health_check",
      {
        description: "Perform a health check on the server and its components",
        inputSchema: z.object({
          detailed: z
            .boolean()
            .optional()
            .describe("Include detailed component information"),
        }),
      },
      async (args) => {
        try {
          const result = await this.handleHealthCheck(
            args as HealthCheckRequest
          );
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

    // Register get_metrics tool
    this.server.registerTool(
      "get_metrics",
      {
        description: "Get metrics and monitoring data",
        inputSchema: z.object({
          operation: z
            .string()
            .optional()
            .describe("Get metrics for a specific operation"),
        }),
      },
      async (args) => {
        try {
          const result = this.handleGetMetrics(args as MetricsRequest);
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
  }

  private async handleSaveContext(
    request: SaveContextRequest
  ): Promise<string> {
    const endTimer = metrics.startOperation("tool.save_context");

    logger.info("Saving context", {
      component: "server",
      title: request.title,
      tags: request.tags?.join(", "),
      modelName: request.modelName,
    });

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

    endTimer();

    const response: SaveContextResponse = {
      success: true,
      contextId,
      processedContent: appliedStrategies.length > 0 ? processedContent : undefined,
      appliedStrategies,
      timestamp: now,
    };

    logger.info("Context saved successfully", {
      component: "server",
      contextId,
      appliedStrategies: appliedStrategies.length,
    });

    return JSON.stringify(response, null, 2);
  }

  private async handleLoadContext(
    request: LoadContextRequest
  ): Promise<string> {
    const endTimer = metrics.startOperation("tool.load_context");

    logger.debug("Loading context", {
      component: "server",
      contextId: request.contextId,
    });

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

    endTimer();

    const response: LoadContextResponse = {
      context,
      relatedContexts,
    };

    logger.debug("Context loaded successfully", {
      component: "server",
      contextId: request.contextId,
      relatedCount: relatedContexts.length,
    });

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

  private async handleHealthCheck(
    request: HealthCheckRequest
  ): Promise<string> {
    logger.info("Performing health check", {
      component: "server",
      detailed: request.detailed,
    });

    const healthResult = await healthChecker.performHealthCheck();

    if (!request.detailed) {
      // Return simplified health status
      return JSON.stringify(
        {
          status: healthResult.status,
          timestamp: healthResult.timestamp,
          uptime: healthResult.uptime,
        },
        null,
        2
      );
    }

    return JSON.stringify(healthResult, null, 2);
  }

  private handleGetMetrics(request: MetricsRequest): string {
    logger.debug("Getting metrics", {
      component: "server",
      operation: request.operation,
    });

    if (request.operation) {
      const operationMetrics = metrics.getOperationMetrics(request.operation);
      if (!operationMetrics) {
        return JSON.stringify({
          error: "Operation not found",
          message: `No metrics available for operation: ${request.operation}`,
        });
      }
      return JSON.stringify(
        {
          operation: request.operation,
          metrics: operationMetrics,
        },
        null,
        2
      );
    }

    const summary = metrics.getSummary();
    return JSON.stringify(summary, null, 2);
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

        logger.info("Loaded custom models from config", {
          component: "server",
          count: this.models.size,
          path: configPath,
        });
      } catch (error) {
        logger.error("Failed to load context models", error as Error, {
          component: "server",
          path: configPath,
        });
        console.error("Failed to load context models:", error);
      }
    } else {
      // Load default models
      this.loadDefaultModels();
      logger.info("Loaded default models", {
        component: "server",
        count: this.models.size,
      });
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

    logger.info("Context Processor MCP Server started", {
      component: "server",
      transport: "stdio",
    });

    // Perform initial health check
    await healthChecker.performHealthCheck();

    console.error("Context Processor started");
  }
}

// Start the server
const server = new ContextMCPServer();
server.start().catch((error) => {
  logger.error("Server startup failed", error as Error, {
    component: "server",
  });
  console.error("Server error:", error);
  process.exit(1);
});
