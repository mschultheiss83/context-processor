# Context Processor - Examples

This directory contains practical, runnable examples showing how to use the Context Processor library.

## Prerequisites

1. Build the project:
   ```bash
   npm run build
   ```

2. Examples are TypeScript files. You can run them using `ts-node` or compile them first:
   ```bash
   npm install -D ts-node typescript
   ```

## Examples

### 1. Basic Usage (`1-basic-usage.ts`)

Learn the fundamentals: save, load, list, search, and delete contexts.

**What you'll learn:**
- Creating a ContextProcessor instance
- Saving contexts with tags and metadata
- Loading contexts by ID
- Listing all contexts
- Searching by tags
- Deleting contexts

**Run:**
```bash
npx ts-node examples/1-basic-usage.ts
```

### 2. Comprehensive Processing (`2-comprehensive-processing.ts`)

Use the "comprehensive" model to apply all preprocessing strategies at once.

**What you'll learn:**
- Using preprocessing models
- Applying multiple strategies (clarify, analyze, search, fetch)
- Viewing processed content
- Listing available models

**Run:**
```bash
npx ts-node examples/2-comprehensive-processing.ts
```

### 3. Search Optimization (`3-search-optimization.ts`)

Enhance content discoverability with the "search_optimized" model.

**What you'll learn:**
- Using the search_optimized model for better discoverability
- Searching with single and multiple tags
- Filtering by metadata
- Getting model information

**Run:**
```bash
npx ts-node examples/3-search-optimization.ts
```

### 4. Batch Operations (`4-batch-operations.ts`)

Handle multiple contexts efficiently with pagination and performance monitoring.

**What you'll learn:**
- Batch saving documents
- Pagination with limit and offset
- Bulk searching and filtering
- Performance monitoring
- Batch deletion

**Run:**
```bash
npx ts-node examples/4-batch-operations.ts
```

### 5. Knowledge Base Workflow (`5-knowledge-base-workflow.ts`)

Build a complete knowledge management system with organization, search, and updates.

**What you'll learn:**
- Creating a structured knowledge base
- Organizing articles by categories
- Finding related content
- Filtering by metadata
- Updating articles
- Generating statistics

**Run:**
```bash
npx ts-node examples/5-knowledge-base-workflow.ts
```

## Quickest Start

Run all examples:
```bash
npm run build && \
npx ts-node examples/1-basic-usage.ts && \
npx ts-node examples/2-comprehensive-processing.ts && \
npx ts-node examples/3-search-optimization.ts && \
npx ts-node examples/4-batch-operations.ts && \
npx ts-node examples/5-knowledge-base-workflow.ts
```

Or run individually based on what interests you.

## Learning Path

**Beginner:**
1. Start with `1-basic-usage.ts` - understand core concepts
2. Move to `3-search-optimization.ts` - learn about search features

**Intermediate:**
1. Study `2-comprehensive-processing.ts` - understand preprocessing
2. Explore `4-batch-operations.ts` - learn performance optimization

**Advanced:**
1. Deep dive into `5-knowledge-base-workflow.ts` - build real-world systems

## Common Use Cases

### Building a Documentation System
See `5-knowledge-base-workflow.ts` for organizing and categorizing documentation.

### Processing User Content
Use `2-comprehensive-processing.ts` to understand all available processing strategies.

### Improving Searchability
Check `3-search-optimization.ts` for keyword extraction and search enhancement.

### Working with Large Datasets
Study `4-batch-operations.ts` for efficient bulk operations and pagination.

## Storage

All examples use the default file-based storage in the `./contexts` directory. Contexts are automatically persisted between runs.

To reset state, delete the `./contexts` directory:
```bash
rm -rf contexts
```

## Next Steps

- Check the [API Reference](../wiki/API-Reference.md) for detailed API documentation
- Read the [Getting Started Guide](../wiki/Getting-Started.md) for more information
- Explore the [Scenario Guides](../wiki/Scenario-1-Knowledge-Base-Building.md) for real-world applications
- Review [Troubleshooting](../wiki/Troubleshooting.md) if you encounter issues

## Questions?

- Check the [FAQ](../wiki/FAQ.md)
- Open a [GitHub Issue](https://github.com/mschultheiss83/context-processor/issues)
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
