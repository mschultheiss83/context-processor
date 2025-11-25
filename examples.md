# Context Processor - Usage Examples

This document provides practical examples of how to use the Context Processor.

## Example 1: Save a Technical Document with Comprehensive Processing

**Request:**
```json
{
  "tool": "save_context",
  "arguments": {
    "title": "React Performance Optimization Guide",
    "content": "React applications can be optimized in several ways. Basically, you should use memoization for expensive components. This approach generally improves rendering performance. That said, over-memoization can actually hurt performance. The key is to identify bottlenecks first using the React DevTools Profiler. It helps you understand which components are rendering unnecessarily.",
    "tags": ["react", "performance", "optimization", "frontend"],
    "metadata": {
      "source": "internal-wiki",
      "priority": "high",
      "author": "engineering-team"
    },
    "modelName": "comprehensive"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contextId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "processedContent": "[CLARIFICATION METADATA]\nOriginal length: 421 chars\nClarity score: 85/100\nIssues found: 3\n[SEARCH ENHANCEMENT]\nExtracted keywords: react, memoization, performance, profiler, bottlenecks\nRecommended searches: \"react\", \"memoization\", \"performance\"\n[CONTENT ANALYSIS]\n{\n  \"wordCount\": 73,\n  \"sentenceCount\": 6,\n  \"paragraphCount\": 1,\n  \"averageWordLength\": 5.2,\n  \"complexity\": \"medium\"\n}\n[ORIGINAL CONTENT]\nReact applications can be optimized in several ways. You should use memoization for expensive components. This approach improves rendering performance...",
  "appliedStrategies": ["clarify", "search", "analyze"],
  "timestamp": 1700000000000
}
```

## Example 2: Save Code Documentation with Clarity Focus

**Request:**
```json
{
  "tool": "save_context",
  "arguments": {
    "title": "Authentication Module Documentation",
    "content": "The authentication module handles user login and logout operations. It validates credentials against the database. The system uses JWT tokens for session management. These tokens are stored in HTTP-only cookies for security. When a user logs out, the token is invalidated on the server side.",
    "tags": ["documentation", "authentication", "backend"],
    "modelName": "clarify"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contextId": "8f94b6c1-73a2-4e5a-b8c9-1d4f2e5c3a1b",
  "processedContent": "[CLARIFICATION METADATA]\nOriginal length: 298 chars\nClarity score: 95/100\nIssues found: 0\n...",
  "appliedStrategies": ["clarify"],
  "timestamp": 1700000000001
}
```

## Example 3: Save Web Content with URL Detection

**Request:**
```json
{
  "tool": "save_context",
  "arguments": {
    "title": "API Integration References",
    "content": "For integrating with our API, check out https://api.example.com/docs. The authentication guide is at https://api.example.com/auth. You can also find code examples at https://github.com/example/api-examples. The SDK documentation is hosted at https://sdk.example.com and the changelog is at https://api.example.com/changelog.",
    "tags": ["api", "integration", "references"],
    "modelName": "web_enhanced"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contextId": "c2d3e4f5-6g7h-8i9j-0k1l-2m3n4o5p6q7r",
  "processedContent": "[FETCH METADATA]\nFound URLs: 5\nURLs: https://api.example.com/docs, https://api.example.com/auth, https://github.com/example/api-examples, https://sdk.example.com, https://api.example.com/changelog\n[CONTENT ANALYSIS]\n...",
  "appliedStrategies": ["fetch", "analyze"],
  "timestamp": 1700000000002
}
```

## Example 4: List All Contexts

**Request:**
```json
{
  "tool": "list_contexts",
  "arguments": {}
}
```

**Response:**
```json
{
  "contexts": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "title": "React Performance Optimization Guide",
      "content": "[PROCESSED CONTENT...]",
      "metadata": { "source": "internal-wiki", "priority": "high", "author": "engineering-team" },
      "createdAt": 1700000000000,
      "updatedAt": 1700000000000,
      "tags": ["react", "performance", "optimization", "frontend"]
    },
    {
      "id": "8f94b6c1-73a2-4e5a-b8c9-1d4f2e5c3a1b",
      "title": "Authentication Module Documentation",
      "content": "[PROCESSED CONTENT...]",
      "metadata": {},
      "createdAt": 1700000000001,
      "updatedAt": 1700000000001,
      "tags": ["documentation", "authentication", "backend"]
    }
  ],
  "total": 2
}
```

## Example 5: Filter Contexts by Tag

**Request:**
```json
{
  "tool": "list_contexts",
  "arguments": {
    "tags": ["authentication"],
    "limit": 10,
    "offset": 0
  }
}
```

**Response:**
```json
{
  "contexts": [
    {
      "id": "8f94b6c1-73a2-4e5a-b8c9-1d4f2e5c3a1b",
      "title": "Authentication Module Documentation",
      "content": "...",
      "metadata": {},
      "createdAt": 1700000000001,
      "updatedAt": 1700000000001,
      "tags": ["documentation", "authentication", "backend"]
    }
  ],
  "total": 1
}
```

## Example 6: Load Context and Discover Related Items

**Request:**
```json
{
  "tool": "load_context",
  "arguments": {
    "contextId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

**Response:**
```json
{
  "context": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "React Performance Optimization Guide",
    "content": "[PROCESSED CONTENT...]",
    "metadata": { "source": "internal-wiki", "priority": "high", "author": "engineering-team" },
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000,
    "tags": ["react", "performance", "optimization", "frontend"]
  },
  "relatedContexts": [
    {
      "id": "d5e6f7g8-9h0i-1j2k-3l4m-5n6o7p8q9r0s",
      "title": "React Hooks Best Practices",
      "content": "...",
      "metadata": {},
      "createdAt": 1700000000010,
      "updatedAt": 1700000000010,
      "tags": ["react", "hooks", "best-practices", "frontend"]
    }
  ]
}
```

## Example 7: Get Available Models

**Request:**
```json
{
  "tool": "list_models",
  "arguments": {}
}
```

**Response:**
```json
{
  "models": [
    {
      "name": "clarify",
      "description": "Model focused on clarifying and improving content clarity",
      "strategyCount": 1
    },
    {
      "name": "search_optimized",
      "description": "Model for enhancing searchability and extracting keywords",
      "strategyCount": 1
    },
    {
      "name": "analysis",
      "description": "Model for detailed content analysis",
      "strategyCount": 1
    },
    {
      "name": "comprehensive",
      "description": "Comprehensive model with all processing strategies enabled",
      "strategyCount": 3
    },
    {
      "name": "web_enhanced",
      "description": "Model for web content with URL and data fetching",
      "strategyCount": 2
    }
  ],
  "total": 5
}
```

## Example 8: Get Model Details

**Request:**
```json
{
  "tool": "get_model_info",
  "arguments": {
    "modelName": "comprehensive"
  }
}
```

**Response:**
```json
{
  "name": "comprehensive",
  "description": "Comprehensive model with all processing strategies enabled",
  "strategies": [
    {
      "name": "clarify",
      "type": "clarify",
      "enabled": true,
      "config": {}
    },
    {
      "name": "analyze",
      "type": "analyze",
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
```

## Example 9: Delete a Context

**Request:**
```json
{
  "tool": "delete_context",
  "arguments": {
    "contextId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }
}
```

**Response:**
```json
{
  "success": true,
  "contextId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "message": "Context deleted"
}
```

## Example 10: Save Without Pre-processing

**Request:**
```json
{
  "tool": "save_context",
  "arguments": {
    "title": "Raw Notes",
    "content": "This is raw content without any processing",
    "tags": ["notes"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "contextId": "e6f7g8h9-0i1j-2k3l-4m5n-6o7p8q9r0s1t",
  "appliedStrategies": [],
  "timestamp": 1700000000003
}
```

Note: When no `modelName` is provided, the content is saved as-is without pre-processing.

## Use Cases

### Knowledge Management
Store and organize technical documentation with automatic clarity improvement and keyword extraction for better searchability.

### Content Processing
Process user submissions with multiple strategies to extract meaningful information and improve content quality.

### Research Organization
Save research papers and articles with comprehensive analysis including keywords, complexity assessment, and related documents.

### Code Documentation
Maintain code documentation with clarity focus to ensure consistency and readability across the codebase.

### API Integration
Store API references and integration guides with URL detection for quick access to relevant resources.
