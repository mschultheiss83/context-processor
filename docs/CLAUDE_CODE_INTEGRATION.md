# Claude Code Integration Guide

This guide explains how to use the Context Processor with Claude Code.

## Configuration

### 1. Update Your Claude Code Settings

Add the Context Processor to your Claude Code configuration. You can do this by:

1. Opening your Claude Code settings file (usually in `~/.claude/settings.json` or similar)
2. Adding the server to the `mcpServers` section:

```json
{
  "mcpServers": {
    "context": {
      "command": "node",
      "args": ["/path/to/gemini-project-1/dist/index.js"]
    }
  }
}
```

### 2. Build the Server First

```bash
cd /path/to/gemini-project-1
npm install
npm run build
```

## Using with Claude Code

Once configured, you can use the Context Processor tools directly in your Claude Code interactions.

### Example 1: Save Context About Your Current Project

When Claude Code is helping you with a project, save important context:

```
Save a context about my project architecture:
- title: "Project Architecture Overview"
- content: [Your architecture description]
- tags: ["architecture", "project-structure"]
- modelName: "comprehensive"
```

This will:
1. Clarify your architecture description
2. Extract key architectural concepts
3. Analyze document structure
4. Save everything for later reference

### Example 2: Save Code Snippets with Context

When you want to remember code patterns:

```
Save this code pattern:
- title: "React Custom Hook Pattern"
- content: [Your hook implementation]
- tags: ["react", "hooks", "patterns"]
- modelName: "search_optimized"
```

This optimizes the snippet for searchability with keyword extraction.

### Example 3: Organize Documentation

Keep documentation organized and searchable:

```
Save API documentation:
- title: "REST API Endpoints"
- content: [API documentation]
- tags: ["api", "rest", "documentation"]
- modelName: "web_enhanced"
```

If your documentation has URLs, this model will detect and catalog them.

### Example 4: Find Related Information

When you need to recall information:

```
Load context with ID: [context-id]
```

Returns the context plus up to 5 related documents with matching tags.

### Example 5: Search by Tags

When you want to find all project-related contexts:

```
List all contexts tagged with: ["project", "architecture"]
```

## Workflow Examples

### Technical Documentation Workflow

1. **Save with clarify model**: Store initial documentation
   ```
   Tool: save_context
   Model: clarify
   ```

2. **Enhance with comprehensive model**: Re-process for full analysis
   - This takes the original content and applies all strategies

3. **Load and reference**: Retrieve when needed
   ```
   Tool: load_context
   ID: [saved-id]
   ```

### Knowledge Base Building

1. Save multiple related documents with consistent tags
2. Use `list_contexts` with tag filters to organize by topic
3. Use `load_context` to discover related information
4. Build interconnected knowledge graph through tags

### Research Organization

1. Save research papers with `web_enhanced` model
   - Extracts URLs for references
   - Analyzes document structure
   - Clarifies complex concepts

2. Tag by topic, methodology, author
3. Load contexts to find related research

## Using Models Strategically

### For Technical Writing
Use `clarify` model to ensure documentation is clear and unambiguous.

### For Knowledge Base
Use `search_optimized` to extract keywords that users will search for.

### For Code Documentation
Use `comprehensive` to get clarity + analysis + searchability.

### For Research/References
Use `web_enhanced` to catalog URLs and external sources.

### For Initial Content
Save without model first, then process with models as needed.

## Tool Commands in Claude Code

### Save Context
```
Tool: save_context
Arguments:
  title: "Your Title"
  content: "Your content"
  tags: ["tag1", "tag2"]
  metadata: { custom: "data" }
  modelName: "comprehensive"
```

### Load Context
```
Tool: load_context
Arguments:
  contextId: "uuid-here"
```

Returns: Context + related contexts

### List Contexts
```
Tool: list_contexts
Arguments:
  tags: ["optional-filter"]
  limit: 10
  offset: 0
```

### Get Available Models
```
Tool: list_models
Arguments: {}
```

### Get Model Details
```
Tool: get_model_info
Arguments:
  modelName: "comprehensive"
```

### Delete Context
```
Tool: delete_context
Arguments:
  contextId: "uuid-here"
```

## Best Practices

### 1. Consistent Tagging
- Use lowercase tags
- Be specific (e.g., "react-hooks" instead of "code")
- Use 2-4 tags per context
- Create a tag taxonomy for your domain

### 2. Meaningful Titles
- Be descriptive
- Include date if relevant
- Follow a consistent pattern

### 3. Model Selection
- Start with `search_optimized` for unknown content types
- Use `comprehensive` for important documentation
- Use `clarify` for technical writing
- Use `web_enhanced` for content with external links

### 4. Metadata Usage
- Store version information
- Track source/author
- Add priority levels
- Include date of relevance

Example:
```json
{
  "metadata": {
    "version": "1.2.0",
    "source": "internal-docs",
    "author": "team-name",
    "priority": "high",
    "reviewed": "2024-01-15"
  }
}
```

### 5. Regular Organization
- Periodically review contexts
- Archive outdated information
- Consolidate similar contexts
- Update tags as needed

## Troubleshooting

### Server Not Responding
1. Check if the server process is running
2. Verify the path in Claude Code configuration
3. Ensure `npm run build` was executed
4. Check for errors in server logs

### Context Not Found
1. Verify the contextId is correct
2. Check if the context was actually saved
3. Look in the `./contexts` directory

### Model Not Applied
1. Confirm model name exists via `list_models`
2. Check `context-models.json` is valid JSON
3. Ensure model has at least one enabled strategy

### Performance Issues
1. Limit context list queries with `limit` parameter
2. Use tag filtering instead of loading all contexts
3. Archive old contexts periodically

## Advanced Usage

### Creating Custom Models

Edit `context-models.json`:

```json
{
  "models": [
    {
      "name": "my-domain",
      "description": "Custom model for my domain",
      "strategies": [
        {
          "name": "clarify",
          "type": "clarify",
          "enabled": true
        },
        {
          "name": "search",
          "type": "search",
          "enabled": true,
          "config": {
            "maxKeywords": 15
          }
        }
      ]
    }
  ]
}
```

Then use it:
```
Tool: save_context
Arguments:
  modelName: "my-domain"
```

### Batch Operations

To save multiple contexts programmatically:

```
1. Save context 1
2. Save context 2
3. Save context N
4. List with appropriate tags to verify
```

### Integration with Other MCP Servers

Combine with other MCP servers:
- Use `@modelcontextprotocol/server-memory` for short-term memory
- Use `@modelcontextprotocol/server-sequential-thinking` for complex reasoning
- Use Context MCP for long-term structured storage

## Real-World Scenario

### Building an API Documentation System

1. **Setup tags**: `["api", "endpoint", "auth", "v2", "stable"]`

2. **Save each endpoint**:
   ```
   Title: "GET /users/{id}"
   Content: [Endpoint documentation]
   Tags: ["api", "endpoint", "v2", "stable"]
   Model: "web_enhanced"
   ```

3. **Later, find all auth endpoints**:
   ```
   List contexts with tags: ["api", "auth"]
   ```

4. **Load a specific endpoint**:
   ```
   Load context to view full spec + related endpoints
   ```

5. **Version management**:
   - Use v1, v2, v3 tags
   - Delete old versions
   - Track deprecations in metadata

## Summary

The Context Processor with Claude Code enables:
- ✅ Intelligent context saving with automatic clarity improvement
- ✅ Keyword extraction for better discoverability
- ✅ Content analysis for understanding structure
- ✅ URL detection for reference tracking
- ✅ Related context discovery through tags
- ✅ Long-term structured knowledge management

Use it to build your personal knowledge base that grows smarter with every addition!
