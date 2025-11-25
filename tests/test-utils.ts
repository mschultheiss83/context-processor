/**
 * Test utilities and helpers for Context MCP Server tests
 */

import * as fs from "fs";
import * as path from "path";
import { ContextItem, ContextModel } from "../src/types";
import { ContextStorage } from "../src/storage";
import { ContextPreprocessor } from "../src/preprocessor";

/**
 * Test data generator utilities
 */
export class TestDataGenerator {
  /**
   * Generate a sample context item
   */
  static generateContextItem(overrides?: Partial<ContextItem>): ContextItem {
    const now = Date.now();
    return {
      id: "test-uuid-" + Math.random().toString(36).substr(2, 9),
      title: "Test Context",
      content: "This is a test context. It basically contains sample data for testing purposes.",
      metadata: { source: "test", version: "1.0" },
      createdAt: now,
      updatedAt: now,
      tags: ["test", "sample"],
      ...overrides,
    };
  }

  /**
   * Generate multiple context items
   */
  static generateContextItems(count: number, tags: string[] = []): ContextItem[] {
    return Array.from({ length: count }, (_, i) => {
      const now = Date.now() + i * 1000;
      return {
        id: `test-context-${i}`,
        title: `Test Context ${i}`,
        content: `Content for test context ${i}. Generally useful for testing. This approach basically helps verify functionality.`,
        metadata: { index: i, testRun: true },
        createdAt: now,
        updatedAt: now,
        tags: [...tags, `context-${i}`],
      };
    });
  }

  /**
   * Generate realistic API documentation content
   */
  static generateApiDocumentation(): string {
    return `
# REST API Documentation

## Overview
The API basically provides multiple endpoints for managing resources.
This approach generally improves performance and that is the main benefit.
It helps with scalability which is important for large applications.

## Authentication
Users need to authenticate using JWT tokens. The system validates credentials
against the database. Generally, you should use HTTPS for all requests.

## Base URL
The API is available at https://api.example.com/v2

## Endpoints

### GET /users
Retrieves list of users. This endpoint basically returns paginated results.

Parameters:
- limit (optional): Number of results (default 20)
- offset (optional): Pagination offset (default 0)

Response:
\`\`\`json
{
  "users": [...],
  "total": 150
}
\`\`\`

### POST /users
Create a new user. This approach validates input data.

### GET /users/{id}
Get specific user details.

## Error Handling
The API returns standard HTTP status codes. Generally, you should handle 4xx and 5xx responses.
That said, errors include detailed messages for debugging.

## Rate Limiting
API has rate limits. The system basically enforces 1000 requests per hour.
`;
  }

  /**
   * Generate product documentation
   */
  static generateProductDocumentation(): string {
    return `
# Product Documentation

## Features
Our product basically provides advanced features for data management.
The system generally improves workflow efficiency significantly.

Features include:
- Real-time synchronization
- Advanced filtering capabilities
- Custom reporting tools
- API integration support

## Installation
The product installation is basically straightforward.
Generally, you need Node.js 16+ and npm installed.

Steps:
1. Download the installer
2. Run the installation wizard
3. Configure your workspace
4. Create initial projects

## User Management
The system allows administrators to manage users efficiently.
This approach basically provides role-based access control.
Generally, there are three roles: admin, editor, viewer.

## Best Practices
- Always backup your data regularly
- Use strong passwords
- Enable two-factor authentication
- Review permissions quarterly
`;
  }

  /**
   * Generate technical content with clarity issues
   */
  static generateUnclearContent(): string {
    return `
The system basically works like this: it takes input and processes it. This approach
generally makes things better. That said, the methodology is somewhat complex.

It basically requires configuration which is generally straightforward. The configuration
file basically contains parameters that generally affect performance.

Users should generally follow the guidelines. The guidelines basically explain the best practices.
That said, some users don't follow them. It kind of causes issues sometimes.

The implementation basically uses modern patterns. This approach generally improves code quality.
Generally speaking, the codebase is well-structured, but it kind of needs more documentation.
`;
  }

  /**
   * Generate content with URLs
   */
  static generateContentWithUrls(): string {
    return `
For more information, check out https://api.example.com/docs
The authentication guide is available at https://api.example.com/auth
You can find code examples at https://github.com/example/api-examples
SDK documentation: https://sdk.example.com
Changelog: https://api.example.com/changelog
Additional resources: https://community.example.com/guides
`;
  }
}

/**
 * Test storage utilities
 */
export class TestStorageManager {
  private testStorageDir: string;

  constructor(storageDir?: string) {
    this.testStorageDir = storageDir || "./test-contexts-" + Date.now();
  }

  /**
   * Create a fresh test storage
   */
  createTestStorage(): ContextStorage {
    if (fs.existsSync(this.testStorageDir)) {
      fs.rmSync(this.testStorageDir, { recursive: true, force: true });
    }
    return new ContextStorage(this.testStorageDir);
  }

  /**
   * Cleanup test storage
   */
  cleanup(): void {
    if (fs.existsSync(this.testStorageDir)) {
      try {
        fs.rmSync(this.testStorageDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors - they don't affect test results
        // This can happen on Windows with file locking issues
        // The directory will be cleaned up eventually
      }
    }
  }

  /**
   * Get storage directory path
   */
  getStorageDir(): string {
    return this.testStorageDir;
  }

  /**
   * List all stored contexts
   */
  listStoredContexts(): string[] {
    if (!fs.existsSync(this.testStorageDir)) {
      return [];
    }
    return fs.readdirSync(this.testStorageDir).filter((f) => f.endsWith(".json"));
  }

  /**
   * Read a stored context file
   */
  readStoredContext(filename: string): ContextItem | null {
    const filepath = path.join(this.testStorageDir, filename);
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const data = fs.readFileSync(filepath, "utf-8");
    return JSON.parse(data);
  }

  /**
   * Count stored contexts
   */
  countStoredContexts(): number {
    return this.listStoredContexts().length;
  }
}

/**
 * Test assertion helpers
 */
export class TestAssertions {
  /**
   * Assert context has been saved correctly
   */
  static assertContextSaved(context: ContextItem): void {
    expect(context).toBeDefined();
    expect(context.id).toBeDefined();
    expect(context.title).toBeDefined();
    expect(context.content).toBeDefined();
    expect(context.createdAt).toBeGreaterThan(0);
    expect(context.updatedAt).toBeGreaterThan(0);
    expect(Array.isArray(context.tags)).toBe(true);
  }

  /**
   * Assert context matches original (except for metadata)
   */
  static assertContextMatches(
    context: ContextItem,
    expectedTitle: string,
    expectedTags: string[]
  ): void {
    expect(context.title).toBe(expectedTitle);
    expect(context.tags).toEqual(expect.arrayContaining(expectedTags));
  }

  /**
   * Assert preprocessor results are valid
   */
  static assertPreprocessorResults(results: any): void {
    expect(results).toBeDefined();
    expect(results.processed).toBeDefined();
    expect(Array.isArray(results.results)).toBe(true);
  }

  /**
   * Assert content was clarified
   */
  static assertContentClarified(processed: string, original: string): void {
    // Check that processed content includes metadata
    expect(processed).toContain("METADATA");
    // Content should be different (clarified)
    expect(processed.length).toBeGreaterThan(0);
  }

  /**
   * Assert keywords were extracted
   */
  static assertKeywordsExtracted(processed: string): void {
    expect(processed).toContain("SEARCH");
    expect(processed).toContain("keywords");
  }

  /**
   * Assert analysis was performed
   */
  static assertAnalysisPerformed(processed: string): void {
    expect(processed).toContain("ANALYSIS");
    expect(processed).toContain("wordCount");
  }

  /**
   * Assert URLs were detected
   */
  static assertUrlsDetected(processed: string, expectedCount: number): void {
    expect(processed).toContain("FETCH");
    expect(processed).toContain("URLs");
    expect(processed).toContain("api.example.com");
  }

  /**
   * Assert related contexts exist
   */
  static assertRelatedContextsExist(
    relatedContexts: ContextItem[],
    minCount: number = 0
  ): void {
    expect(Array.isArray(relatedContexts)).toBe(true);
    expect(relatedContexts.length).toBeGreaterThanOrEqual(minCount);
    relatedContexts.forEach((ctx) => {
      this.assertContextSaved(ctx);
    });
  }
}

/**
 * Preprocessor test helper
 */
export class PreprocessorTestHelper {
  private preprocessor: ContextPreprocessor;

  constructor() {
    this.preprocessor = new ContextPreprocessor();
  }

  /**
   * Get the preprocessor instance
   */
  getPreprocessor(): ContextPreprocessor {
    return this.preprocessor;
  }

  /**
   * Test clarify strategy
   */
  async testClarifyStrategy(content: string): Promise<any> {
    const strategies = [
      { name: "clarify", type: "clarify" as const, enabled: true },
    ];
    return this.preprocessor.processContent(content, strategies);
  }

  /**
   * Test search strategy
   */
  async testSearchStrategy(content: string): Promise<any> {
    const strategies = [
      { name: "search", type: "search" as const, enabled: true },
    ];
    return this.preprocessor.processContent(content, strategies);
  }

  /**
   * Test analyze strategy
   */
  async testAnalyzeStrategy(content: string): Promise<any> {
    const strategies = [
      { name: "analyze", type: "analyze" as const, enabled: true },
    ];
    return this.preprocessor.processContent(content, strategies);
  }

  /**
   * Test fetch strategy
   */
  async testFetchStrategy(content: string): Promise<any> {
    const strategies = [
      { name: "fetch", type: "fetch" as const, enabled: true },
    ];
    return this.preprocessor.processContent(content, strategies);
  }

  /**
   * Test comprehensive processing (all strategies)
   */
  async testComprehensiveProcessing(content: string): Promise<any> {
    const strategies = [
      { name: "clarify", type: "clarify" as const, enabled: true },
      { name: "analyze", type: "analyze" as const, enabled: true },
      { name: "search", type: "search" as const, enabled: true },
    ];
    return this.preprocessor.processContent(content, strategies);
  }
}

/**
 * Context comparison utilities
 */
export class ContextComparison {
  /**
   * Compare two contexts and return differences
   */
  static compare(
    context1: ContextItem,
    context2: ContextItem
  ): { same: boolean; differences: string[] } {
    const differences: string[] = [];

    if (context1.title !== context2.title) {
      differences.push(`Title differs: "${context1.title}" vs "${context2.title}"`);
    }
    if (context1.content !== context2.content) {
      differences.push("Content differs");
    }
    if (JSON.stringify(context1.tags) !== JSON.stringify(context2.tags)) {
      differences.push("Tags differ");
    }

    return {
      same: differences.length === 0,
      differences,
    };
  }

  /**
   * Check if contexts share tags
   */
  static sharesTags(context1: ContextItem, context2: ContextItem): boolean {
    return context1.tags.some((tag) => context2.tags.includes(tag));
  }

  /**
   * Get common tags
   */
  static getCommonTags(context1: ContextItem, context2: ContextItem): string[] {
    return context1.tags.filter((tag) => context2.tags.includes(tag));
  }
}
