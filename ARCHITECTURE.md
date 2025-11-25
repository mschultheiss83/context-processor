# Context MCP Server - Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Claude Code / MCP Client                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ MCP Protocol (JSON-RPC)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Context MCP Server                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Request Handler (index.ts)                │   │
│  │  - Tool listing & discovery                          │   │
│  │  - Request routing                                   │   │
│  │  - Response formatting                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│        ┌────────────┼────────────┬──────────────┐            │
│        ▼            ▼            ▼              ▼            │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐│
│  │save_context │ │load_context │ │list_*      │ │get_model ││
│  └──────┬──────┘ └──────┬──────┘ └────────────┘ └──────────┘│
│         │                │                                    │
│         ▼                ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Context Processing Pipeline                  │    │
│  │                                                      │    │
│  │  Original Content                                   │    │
│  │         │                                           │    │
│  │         ▼                                           │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │  ContextPreprocessor (preprocessor.ts)      │   │    │
│  │  │  - Clarify: Language improvement            │   │    │
│  │  │  - Analyze: Content metrics                 │   │    │
│  │  │  - Search: Keyword extraction               │   │    │
│  │  │  - Fetch: URL detection                     │   │    │
│  │  │  - Custom: Extensible logic                 │   │    │
│  │  └──────────────────┬──────────────────────────┘   │    │
│  │                     │                              │    │
│  │  Strategy Chain:    ▼                              │    │
│  │  [Clarify] → [Analyze] → [Search] → Result        │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│         │                │                                   │
│         ▼                ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │     Context Data (types.ts)                         │    │
│  │  - id (UUID)                                        │    │
│  │  - title, content                                   │    │
│  │  - tags, metadata                                   │    │
│  │  - timestamps (created, updated)                    │    │
│  └────────────┬────────────────────────────────────────┘    │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │      ContextStorage (storage.ts)                    │    │
│  │  - save(): Store context to file                    │    │
│  │  - load(): Retrieve context by ID                   │    │
│  │  - list(): Get all contexts                         │    │
│  │  - search(): Filter by tags                         │    │
│  │  - delete(): Remove context                         │    │
│  └────────────┬────────────────────────────────────────┘    │
│               │                                              │
│               ▼                                              │
└──────────────────────────────────────────────────────────────┘
               │
               │ File I/O
               ▼
        ┌─────────────────┐
        │ ./contexts/     │
        │ ├── uuid1.json  │
        │ ├── uuid2.json  │
        │ └── ...         │
        └─────────────────┘
```

## Component Interaction Diagram

```
Tool Call: save_context
├─ Validate input
├─ Generate UUID
├─ Check if model specified
│  └─ If yes: Load model config
│     └─ Get enabled strategies
├─ Execute preprocessing
│  ├─ Strategy 1 (if enabled)
│  │  └─ Transform content
│  ├─ Strategy 2 (if enabled)
│  │  └─ Transform content
│  └─ Strategy N (if enabled)
│     └─ Transform content
├─ Create ContextItem
├─ Persist to storage
│  └─ Write JSON file to ./contexts/
└─ Return contextId & results


Tool Call: load_context
├─ Retrieve context from storage
├─ Find all contexts
├─ Filter by shared tags
├─ Limit to 5 related
└─ Return context + related


Tool Call: list_contexts
├─ Load all contexts from storage
├─ Apply filters (tags)
├─ Apply pagination (offset, limit)
└─ Return filtered list


Tool Call: list_models
├─ Return all models from memory
│  └─ Loaded from context-models.json
└─ Return model list
```

## Data Flow: Saving Context with Comprehensive Model

```
User Input:
{
  title: "API Documentation",
  content: "The API basically provides endpoints... This approach generally improves performance...",
  tags: ["api", "docs"],
  modelName: "comprehensive"
}
    │
    ▼
Server validates input
    │
    ▼
Load model "comprehensive":
- Strategy 1: clarify (enabled)
- Strategy 2: analyze (enabled)
- Strategy 3: search (enabled)
    │
    ├─ CLARIFY STRATEGY
    │  ├─ Detect: "basically", "generally" (vague words)
    │  ├─ Detect: Ambiguous pronouns
    │  ├─ Score: 75/100
    │  └─ Output: Cleaned content + metadata
    │
    ├─ ANALYZE STRATEGY
    │  ├─ Count: 45 words, 3 sentences, 1 paragraph
    │  ├─ Calculate: avg word length = 5.2
    │  ├─ Assess: complexity = "medium"
    │  └─ Output: Metrics object
    │
    └─ SEARCH STRATEGY
       ├─ Extract: all words > 4 chars
       ├─ Filter: remove stop words
       ├─ Rank: by frequency
       └─ Output: Top 10 keywords
    │
    ▼
Create ContextItem:
{
  id: "550e8400-e29b-41d4-...",
  title: "API Documentation",
  content: "[CLARIFIED][ANALYZED][SEARCHED]...",
  tags: ["api", "docs"],
  metadata: {...},
  createdAt: timestamp,
  updatedAt: timestamp
}
    │
    ▼
Storage.save():
├─ Serialize to JSON
├─ Write to ./contexts/550e8400-...json
└─ Return path
    │
    ▼
Return to client:
{
  success: true,
  contextId: "550e8400-...",
  appliedStrategies: ["clarify", "analyze", "search"],
  timestamp: ...
}
```

## Strategy Execution Pipeline

```
Content Input
     │
     ├─ [Clarity Check]
     │  ├─ Pronouns detected: 3
     │  ├─ Passive voice: 1
     │  ├─ Vague words: 2
     │  └─ Score: 80/100
     │
     ├─ [Analysis Phase]
     │  ├─ Word count: 120
     │  ├─ Sentence count: 8
     │  ├─ Avg word length: 5.1
     │  └─ Complexity: medium
     │
     └─ [Search Optimization]
        ├─ Extract all >4 char words
        ├─ Remove stop words
        ├─ Rank by frequency
        └─ Top 10: [api, documentation, endpoint, ...]

Output: Enhanced Content + Metadata
```

## Model Configuration Structure

```
context-models.json
│
├─ Model: "clarify"
│  └─ Strategies:
│     └─ Clarify (enabled)
│
├─ Model: "search_optimized"
│  └─ Strategies:
│     └─ Search (enabled)
│
├─ Model: "comprehensive"
│  └─ Strategies:
│     ├─ Clarify (enabled)
│     ├─ Analyze (enabled)
│     └─ Search (enabled)
│
└─ Model: "custom"
   └─ Strategies:
      ├─ Clarify (enabled)
      ├─ Analyze (disabled)
      ├─ Search (enabled)
      └─ Custom (enabled)
```

## Storage Layer Details

```
ContextStorage
│
├─ ensureStorageDir()
│  └─ Create ./contexts if needed
│
├─ save(context)
│  ├─ Generate filename: {uuid}.json
│  ├─ Serialize ContextItem
│  └─ Write to disk
│
├─ load(contextId)
│  ├─ Construct path: ./contexts/{id}.json
│  ├─ Read file
│  └─ Parse & return
│
├─ list()
│  ├─ Read all *.json files
│  ├─ Parse each file
│  └─ Return array
│
├─ search(tags, limit, offset)
│  ├─ Load all contexts
│  ├─ Filter by tags
│  ├─ Apply pagination
│  └─ Return results
│
└─ delete(contextId)
   ├─ Construct path
   └─ Remove file
```

## Type System Hierarchy

```
Types (types.ts)
│
├─ ContextItem
│  ├─ id: string (UUID)
│  ├─ title: string
│  ├─ content: string
│  ├─ metadata: Record<string, unknown>
│  ├─ createdAt: number (timestamp)
│  ├─ updatedAt: number (timestamp)
│  └─ tags: string[]
│
├─ PreProcessingStrategy
│  ├─ name: string
│  ├─ type: "clarify" | "search" | "analyze" | ...
│  ├─ enabled: boolean
│  └─ config?: Record<string, unknown>
│
├─ ContextModel
│  ├─ name: string
│  ├─ description: string
│  ├─ strategies: PreProcessingStrategy[]
│  └─ storageLocation?: string
│
└─ Request/Response Types
   ├─ SaveContextRequest/Response
   ├─ LoadContextRequest/Response
   ├─ ListContextsRequest/Response
   └─ PreProcessingResult
```

## Tool Definitions

```
Available Tools:
│
├─ save_context
│  ├─ Input: SaveContextRequest
│  ├─ Output: SaveContextResponse
│  └─ Processing: Run pre-processor if model specified
│
├─ load_context
│  ├─ Input: { contextId: string }
│  ├─ Output: { context, relatedContexts }
│  └─ Processing: Find related by tags
│
├─ list_contexts
│  ├─ Input: { tags?, limit?, offset? }
│  ├─ Output: { contexts, total }
│  └─ Processing: Filter and paginate
│
├─ list_models
│  ├─ Input: {}
│  ├─ Output: { models, total }
│  └─ Processing: Return from memory
│
├─ get_model_info
│  ├─ Input: { modelName }
│  ├─ Output: ContextModel
│  └─ Processing: Lookup and return
│
└─ delete_context
   ├─ Input: { contextId }
   ├─ Output: { success, message }
   └─ Processing: Remove file
```

## Error Handling Flow

```
Tool Call
   │
   ├─ Validate Input
   │  └─ If invalid: Return error
   │
   ├─ Execute Operation
   │  ├─ Try: Perform operation
   │  └─ Catch: Catch errors
   │     └─ Return error message
   │
   ├─ File Operations
   │  └─ Try: Read/Write
   │     └─ Catch: Return not found / permission error
   │
   └─ Return Response
      ├─ Success: { success: true, data }
      └─ Error: { error: message }
```

## Extension Points

```
Add Custom Strategy:
1. Define in types.ts (optional)
2. Implement in preprocessor.ts
   └─ Add method: customXxxStrategy()
3. Add to context-models.json
   └─ { name: "xxx", type: "custom", enabled: true }

Create Custom Model:
1. Edit context-models.json
2. Add new model entry with strategy references
3. Use modelName in save_context

Add New Tool:
1. Define in getAvailableTools()
2. Implement handler method
3. Add to handleToolCall() switch
4. Add types if needed

Database Migration:
1. Create new storage adapter
   ├─ Implement save/load/list/search/delete
   └─ Maintain interface compatibility
2. Replace ContextStorage usage in index.ts
3. Update paths and initialization
```

## Performance Characteristics

```
Operation Performance:

save_context with model:
├─ Input validation: <1ms
├─ Load model config: <1ms
├─ Preprocess (all strategies): <50ms
├─ File I/O: <5ms
└─ Total: ~50-100ms

load_context:
├─ File read: <5ms
├─ Parse JSON: <2ms
├─ Filter related: <10ms
└─ Total: ~15-20ms

list_contexts:
├─ Read all files: <30ms
├─ Parse JSONs: <10ms
├─ Filter/sort: <5ms
└─ Total: ~40-50ms

Memory Usage:
├─ Server idle: ~50MB
├─ Per context in memory: ~10KB
└─ 1000 contexts: ~100MB total
```

## Security Considerations

```
Current State:
├─ No authentication
├─ File system access not restricted
├─ No input sanitization
└─ No encryption

Recommended Additions:
├─ Access control lists
├─ Request authentication
├─ Input validation
├─ Output encoding
├─ Audit logging
└─ Rate limiting
```

This architecture provides a modular, extensible system for intelligent context management through the MCP protocol.
