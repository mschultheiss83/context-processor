# Context Processor

> ⚠️ **DISCLAIMER**: This MCP server is entirely written and maintained by AI (Claude/Gemini) with manual supervision. It is a **personal test project** created to explore AI-assisted development. Use at your own discretion.

An intelligent Model Context Protocol (MCP) server for saving, managing, and enhancing context with pre-processing strategies. This server helps you organize information efficiently by applying smart transformations like clarification, analysis, and search optimization.

## Features

- **Intelligent Context Storage**: Save and organize contexts with metadata and tags
- **Pre-processing Strategies**: Multiple configurable strategies to enhance context quality:
  - **Clarify**: Improve content clarity by detecting and fixing ambiguous language
  - **Analyze**: Comprehensive content analysis (word count, complexity, structure)
  - **Search**: Extract keywords and enhance searchability
  - **Fetch**: Detect and manage URLs and external data references
  - **Custom**: Support for custom processing strategies

- **Context Models**: Pre-configured models combining multiple strategies:
  - `clarify`: Focus on clarity improvement
  - `search_optimized`: Optimize for searchability
  - `analysis`: Detailed content analysis
  - `comprehensive`: All strategies enabled
  - `web_enhanced`: For web content with URL handling

- **Context Management Tools**:
  - Save contexts with automatic or model-based processing
  - Load contexts and discover related content
  - List contexts with filtering by tags
  - Delete contexts
  - Query available models

- **Production Observability**:
  - **Structured Logging**: JSON-formatted logs with configurable levels (DEBUG, INFO, WARN, ERROR)
  - **Metrics & Monitoring**: Track operation performance, duration, error rates, and storage metrics
  - **Health Checks**: Comprehensive component health monitoring for server, storage, and preprocessor

## Installation

```bash
npm install context-processor
```

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

Or in development mode:

```bash
npm run dev
```

## Configuration

### Logging Configuration

The logging system can be configured via environment variables:

```bash
# Set log level (DEBUG, INFO, WARN, ERROR)
export LOG_LEVEL=INFO

# Run the server
npm start
```

Log levels:
- `DEBUG`: Detailed diagnostic information
- `INFO`: General informational messages (default)
- `WARN`: Warning messages for potentially harmful situations
- `ERROR`: Error messages for serious problems

Logs are output to stderr in JSON format:
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "Context saved successfully",
  "context": {
    "component": "storage",
    "contextId": "abc-123",
    "title": "My Context"
  }
}
```

### Models Configuration

Create a `context-models.json` file in the project root to define custom models:

```json
{
  "models": [
    {
      "name": "my_model",
      "description": "My custom context model",
      "strategies": [
        {
          "name": "clarify",
          "type": "clarify",
          "enabled": true,
          "config": {}
        },
        {
          "name": "search",
          "type": "search",
          "enabled": true,
          "config": {
            "maxKeywords": 10
          }
        }
      ]
    }
  ]
}
```

## Available Tools

### save_context

Save content as context with optional pre-processing.

**Parameters:**
- `title` (string, required): Title for the context
- `content` (string, required): Content to save
- `tags` (string[], optional): Tags for organizing context
- `metadata` (object, optional): Additional metadata
- `modelName` (string, optional): Context model to use for pre-processing

**Example:**
```json
{
  "title": "API Documentation",
  "content": "This is an API with multiple endpoints...",
  "tags": ["api", "documentation"],
  "metadata": { "version": "1.0" },
  "modelName": "comprehensive"
}
```

**Note:** All operations are automatically logged and tracked for monitoring.

### load_context

Load a previously saved context and discover related contexts.

**Parameters:**
- `contextId` (string, required): ID of the context to load

**Response:**
```json
{
  "context": { /* ContextItem */ },
  "relatedContexts": [ /* ContextItem[] */ ]
}
```

### list_contexts

List all saved contexts with optional filtering.

**Parameters:**
- `tags` (string[], optional): Filter by tags
- `limit` (number, optional): Maximum number of contexts
- `offset` (number, optional): Number of contexts to skip

### list_models

List all available context models.

**Response:**
```json
{
  "models": [
    {
      "name": "clarify",
      "description": "Model focused on clarifying content",
      "strategyCount": 1
    }
  ],
  "total": 5
}
```

### get_model_info

Get detailed information about a specific model.

**Parameters:**
- `modelName` (string, required): Name of the model

### delete_context

Delete a context by ID.

**Parameters:**
- `contextId` (string, required): ID of the context to delete

### health_check

Perform a comprehensive health check on the server and its components.

**Parameters:**
- `detailed` (boolean, optional): Include detailed component information

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890000,
  "uptime": 60000,
  "components": {
    "server": {
      "status": "healthy",
      "message": "Server is running",
      "lastCheck": 1234567890000,
      "details": {
        "pid": 12345,
        "nodeVersion": "v18.0.0",
        "platform": "linux"
      }
    },
    "storage": {
      "status": "healthy",
      "message": "Storage is accessible",
      "lastCheck": 1234567890000,
      "details": {
        "directory": "./contexts",
        "contextCount": 42
      }
    },
    "preprocessor": {
      "status": "healthy",
      "message": "Preprocessor is operational",
      "lastCheck": 1234567890000
    }
  },
  "metrics": {
    "totalOperations": 150,
    "totalErrors": 2,
    "avgResponseTime": 45.5
  }
}
```

### get_metrics

Get metrics and monitoring data for operations.

**Parameters:**
- `operation` (string, optional): Get metrics for a specific operation (e.g., "storage.save", "preprocess")

**Response (full metrics):**
```json
{
  "uptime": 3600000,
  "operations": {
    "storage.save": {
      "count": 50,
      "totalDuration": 1250,
      "avgDuration": 25,
      "errors": 1,
      "lastExecuted": 1234567890000
    },
    "preprocess": {
      "count": 30,
      "totalDuration": 4500,
      "avgDuration": 150,
      "errors": 0,
      "lastExecuted": 1234567890000
    }
  },
  "storage": {
    "totalContexts": 42,
    "lastSaved": 1234567890000,
    "lastLoaded": 1234567889000
  },
  "errors": {
    "total": 5,
    "byType": {
      "validation_error": 3,
      "timeout_error": 2
    }
  }
}
```

**Response (specific operation):**
```json
{
  "operation": "storage.save",
  "metrics": {
    "count": 50,
    "totalDuration": 1250,
    "avgDuration": 25,
    "errors": 1,
    "lastExecuted": 1234567890000
  }
}
```

## Processing Strategies

### Clarify Strategy
Analyzes content for:
- Ambiguous pronouns (it, this, that)
- Passive voice usage
- Vague language (basically, kind of, sort of)

Provides a clarity score and suggestions for improvement.

### Search Strategy
- Extracts 10 most frequent meaningful keywords
- Filters out common stop words
- Recommends search queries for the content

### Analyze Strategy
Provides metrics:
- Word count and average word length
- Sentence and paragraph counts
- Content complexity assessment (low/medium/high)

### Fetch Strategy
- Detects URLs in content
- Identifies up to 5 external references
- Metadata about data sources

## Storage

Contexts are stored as JSON files in the `./contexts` directory. Each context file is named using its UUID:

```
contexts/
├── a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p.json
├── b2c3d4e5-f6g7-h8i9-j0k1-l2m3n4o5p6q.json
└── ...
```

## Example Usage

### Saving a context with comprehensive processing:

```json
{
  "title": "User Authentication Design",
  "content": "The authentication system basically allows users to log in with their credentials. This approach is generally more secure than storing passwords in plain text. That said, the system needs better error handling.",
  "tags": ["security", "authentication"],
  "modelName": "comprehensive"
}
```

This will:
1. Clarify the vague language
2. Analyze the content structure
3. Extract key topics (authentication, security, passwords, etc.)
4. Save all results to context storage

### Loading and discovering related contexts:

```json
{
  "contextId": "a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p"
}
```

Returns the saved context plus up to 5 related contexts that share tags.

## Architecture

```
ContextMCPServer
├── ContextStorage: File-based persistence
├── ContextPreprocessor: Strategy execution engine
└── MCP Protocol Handler: Tool definitions and execution
```

### Data Flow

```
User Request
    ↓
MCP Server (Tool Handler)
    ↓
ContextPreprocessor (if model specified)
    ├─→ Strategy 1 (Clarify)
    ├─→ Strategy 2 (Analyze)
    └─→ Strategy 3 (Search)
    ↓
ContextStorage (Save/Load)
    ↓
Response
```

## Development

### Type Definitions

All types are defined in `src/types.ts`:
- `ContextItem`: Core context data structure
- `PreProcessingStrategy`: Strategy configuration
- `ContextModel`: Model definition
- Request/Response types for each tool

### Adding Custom Strategies

1. Define the strategy type in `types.ts`
2. Add a handler method in `ContextPreprocessor`
3. Add the strategy to a model in `context-models.json`

Example:

```typescript
private customStrategy(
  content: string,
  config?: Record<string, unknown>
): PreProcessingResult {
  // Your custom logic here
  return {
    strategy: "custom",
    processed: true,
    result: transformedContent,
  };
}
```

## Observability & Monitoring

The Context Processor includes comprehensive observability features for production use:

### Structured Logging

All components emit structured JSON logs with contextual information:
- Operation lifecycle tracking (start, completion, errors)
- Component-level logging (storage, preprocessor, server)
- Configurable log levels via `LOG_LEVEL` environment variable
- Error details including stack traces

### Metrics Collection

Built-in metrics tracking for:
- **Operation metrics**: Count, duration, average response time, error count
- **Storage metrics**: Total contexts, last saved/loaded timestamps
- **Error tracking**: Total errors and breakdown by error type
- **System metrics**: Uptime, process information

Use the `get_metrics` tool to retrieve real-time metrics data.

### Health Checks

The `health_check` tool provides:
- Overall system health status (healthy/degraded/unhealthy)
- Component-level health checks (server, storage, preprocessor)
- Storage accessibility verification
- Performance metrics summary

Health checks can be used for:
- Kubernetes liveness/readiness probes
- Monitoring system integration
- Automated alerting
- Troubleshooting and diagnostics

## File Structure

```
.
├── src/
│   ├── index.ts           # Main MCP server
│   ├── types.ts           # Type definitions
│   ├── storage.ts         # Context persistence
│   ├── preprocessor.ts    # Processing strategies
│   ├── logger.ts          # Structured logging system
│   ├── metrics.ts         # Metrics collection
│   └── health.ts          # Health check system
├── tests/
│   ├── observability.test.ts  # Observability tests
│   └── ...                    # Other test files
├── contexts/              # Stored contexts (auto-created)
├── dist/                  # Compiled output
├── context-models.json    # Model configurations
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

## Testing

Run the built-in tests:

```bash
npm test
```

## Future Enhancements

- Database backend support (MongoDB, PostgreSQL)
- Vector embeddings for semantic search
- Machine learning-based categorization
- Multi-user context sharing
- Version control for contexts
- Integration with external APIs
- Real-time collaboration features

## License

MIT
