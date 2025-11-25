# Context Processor

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

## Installation

```bash
npm install
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

## File Structure

```
.
├── src/
│   ├── index.ts           # Main MCP server
│   ├── types.ts           # Type definitions
│   ├── storage.ts         # Context persistence
│   └── preprocessor.ts    # Processing strategies
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
