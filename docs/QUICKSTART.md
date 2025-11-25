# Quick Start Guide - Context Processor

## What is This?

The Context Processor is an intelligent system for saving and managing context through pre-processing models. It uses configurable strategies to:
- **Clarify** content by improving language clarity
- **Analyze** content structure and complexity
- **Search** by extracting keywords for better discoverability
- **Fetch** URLs and external references
- **Custom** processes for specialized needs

## Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Start the Server

```bash
npm start
```

You should see: `Context Processor started`

### 4. Use the Server (via MCP Client)

The server exposes 6 tools you can call:

#### Save Context with Processing
```json
{
  "tool": "save_context",
  "arguments": {
    "title": "My Document",
    "content": "Your content here... This basically explains the concept. Generally, you should follow these guidelines.",
    "tags": ["tag1", "tag2"],
    "modelName": "comprehensive"
  }
}
```

Get back a context ID and processed content with clarity improvements, keyword extraction, and analysis.

#### List All Saved Contexts
```json
{
  "tool": "list_contexts",
  "arguments": {
    "tags": ["tag1"]
  }
}
```

#### Load a Specific Context
```json
{
  "tool": "load_context",
  "arguments": {
    "contextId": "your-context-id-here"
  }
}
```

#### See Available Models
```json
{
  "tool": "list_models",
  "arguments": {}
}
```

Returns: `clarify`, `search_optimized`, `analysis`, `comprehensive`, `web_enhanced`

#### Get Model Details
```json
{
  "tool": "get_model_info",
  "arguments": {
    "modelName": "comprehensive"
  }
}
```

#### Delete a Context
```json
{
  "tool": "delete_context",
  "arguments": {
    "contextId": "your-context-id-here"
  }
}
```

## Pre-Processing Models

### clarify
**Best for:** Technical documentation, instructions
- Fixes ambiguous language
- Detects passive voice
- Removes vague words

### search_optimized
**Best for:** Knowledge base articles, blogs
- Extracts 10 key topics
- Filters stop words
- Suggests search queries

### analysis
**Best for:** Content assessment
- Word/sentence count
- Average word length
- Complexity rating (low/medium/high)

### comprehensive
**Best for:** Everything
- All strategies combined
- Clarity + Keywords + Analysis

### web_enhanced
**Best for:** Web content, URLs
- Detects URLs
- Fetches metadata
- Provides analysis

## Data Location

All contexts are stored as JSON files in `./contexts/` directory:

```
contexts/
├── 550e8400-e29b-41d4-a716-446655440000.json
├── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.json
└── ...
```

Each file contains:
- Original content
- Processed content (if model was used)
- Metadata and tags
- Timestamps

## Configuration

Create `context-models.json` to customize models:

```json
{
  "models": [
    {
      "name": "my_model",
      "description": "My custom model",
      "strategies": [
        {
          "name": "clarify",
          "type": "clarify",
          "enabled": true
        }
      ]
    }
  ]
}
```

See the existing `context-models.json` for full examples.

## Real-World Example

### Scenario: Organize API Documentation

**Step 1:** Save the API doc with web_enhanced model

```json
{
  "tool": "save_context",
  "arguments": {
    "title": "Payment API v2 Documentation",
    "content": "The Payment API allows you to process transactions. Check https://api.example.com/payments for details. Authentication is at https://api.example.com/auth. The system basically validates card information. Generally, you need to handle errors gracefully.",
    "tags": ["api", "payment", "documentation"],
    "metadata": {
      "version": "2.0",
      "status": "stable"
    },
    "modelName": "web_enhanced"
  }
}
```

**Step 2:** Retrieve it later

```json
{
  "tool": "load_context",
  "arguments": {
    "contextId": "returned-id-from-step-1"
  }
}
```

**Step 3:** Find all API-related contexts

```json
{
  "tool": "list_contexts",
  "arguments": {
    "tags": ["api"]
  }
}
```

## Common Issues

### "Context not found"
Make sure you're using the correct `contextId` returned from `save_context`.

### Model not applied
Check that:
1. `modelName` exists in `list_models` response
2. Model is enabled in `context-models.json`

### Can't save context
Ensure `./contexts` directory is writable.

## Next Steps

- Read `README.md` for detailed documentation
- Check `examples.md` for more use cases
- Look at `src/preprocessor.ts` to understand how strategies work
- Modify `context-models.json` to create custom models

## Development

```bash
# Watch and rebuild on changes
npm run dev

# Run tests
npm test
```

## Support

For issues or questions, refer to:
- `README.md` - Full documentation
- `examples.md` - Real usage examples
- `src/types.ts` - Type definitions
- `context-models.json` - Model configurations
