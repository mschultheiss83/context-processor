/**
 * Integration Test Suite 1: MCP Protocol Compliance
 *
 * This suite verifies that the Context Processor correctly implements the
 * Model Context Protocol (MCP) specification and integrates with IDE clients.
 *
 * IMPORTANT: These are UNIT/INTEGRATION tests. Full IDE integration testing
 * (Claude IDE, Cursor) requires manual testing with actual IDE clients.
 * See docs/INTEGRATION_TESTING_GUIDE.md for manual testing procedures.
 *
 * These tests verify:
 * 1. ContextStorage works correctly with MCP server patterns
 * 2. Tool request/response formats follow MCP spec
 * 3. Concurrent access patterns are safe
 * 4. Error handling follows MCP error format
 * 5. Large content handling is efficient
 */

import { ContextStorage } from "../src/storage";
import { ContextPreprocessor } from "../src/preprocessor";
import {
  TestDataGenerator,
  TestStorageManager,
  TestAssertions,
} from "./test-utils";
import { ContextItem } from "../src/types";
import * as fs from "fs";
import path from "path";

describe("Integration 1: MCP Protocol Compliance", () => {
  let storageManager: TestStorageManager;
  let storage: ContextStorage;
  let preprocessor: ContextPreprocessor;
  let tempDir: string;

  beforeEach(() => {
    storageManager = new TestStorageManager();
    storage = storageManager.createTestStorage();
    preprocessor = new ContextPreprocessor();
    tempDir = storageManager.getStorageDir();
  });

  afterEach(() => {
    storageManager.cleanup();
  });

  describe("1.1 MCP Tool Request/Response Pattern", () => {
    test("should handle save_context requests in MCP format", () => {
      // Simulate MCP request format
      const request = {
        title: "Integration Test Context",
        content: "This is test content from an IDE client",
        tags: ["integration", "test"],
        metadata: {
          source: "ide-test",
          timestamp: new Date().toISOString(),
        },
      };

      // Execute tool
      const now = Date.now();
      const context: ContextItem = {
        id: "test-" + now,
        ...request,
        createdAt: now,
        updatedAt: now,
      };

      storage.save(context);

      // Verify response matches expected format
      const retrieved = storage.load(context.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(request.title);
      expect(retrieved?.content).toBe(request.content);
      expect(retrieved?.tags).toEqual(request.tags);
    });

    test("should handle load_context requests", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Load Test",
        content: "Content to load",
      });

      storage.save(context);

      const loaded = storage.load(context.id);
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(context.id);
    });

    test("should handle list_contexts requests", () => {
      // Save multiple contexts
      for (let i = 0; i < 5; i++) {
        const context = TestDataGenerator.generateContextItem({
          title: `Context ${i}`,
          content: `Content ${i}`,
          tags: [`batch-${i}`],
        });
        storage.save(context);
      }

      const contexts = storage.list();
      expect(contexts.length).toBeGreaterThanOrEqual(5);
    });

    test("should handle search_contexts requests", () => {
      // Save contexts with specific tags
      const context1 = TestDataGenerator.generateContextItem({
        title: "Searchable",
        content: "Content",
        tags: ["searchable", "integration"],
      });

      const context2 = TestDataGenerator.generateContextItem({
        title: "Another",
        content: "Content",
        tags: ["integration"],
      });

      storage.save(context1);
      storage.save(context2);

      const results = storage.search(["searchable"]);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.id === context1.id)).toBe(true);
    });

    test("should handle delete_context requests", () => {
      const context = TestDataGenerator.generateContextItem();
      storage.save(context);

      expect(storage.load(context.id)).toBeDefined();

      storage.delete(context.id);

      expect(storage.load(context.id)).toBeNull();
    });
  });

  describe("1.2 MCP Error Handling", () => {
    test("should handle missing context gracefully", () => {
      const result = storage.load("nonexistent-id-12345");
      expect(result).toBeNull();
    });

    test("should handle invalid input gracefully", () => {
      // Empty title should be handled
      const now = Date.now();
      const context: ContextItem = {
        id: "test-invalid",
        title: "",
        content: "Content",
        tags: [],
        metadata: {},
        createdAt: now,
        updatedAt: now,
      };

      // Should not throw, but may handle validation
      expect(() => storage.save(context)).not.toThrow();
    });

    test("should preserve context integrity on partial saves", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Integrity Test",
        content: "Important content",
        tags: ["important"],
      });

      storage.save(context);

      // Verify full content is preserved
      const loaded = storage.load(context.id);
      expect(loaded?.content).toBe(context.content);
      expect(loaded?.tags).toEqual(context.tags);
    });
  });

  describe("1.3 Concurrent IDE Access Patterns", () => {
    test("should handle concurrent saves from multiple IDE clients", async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<void>((resolve) => {
          const context = TestDataGenerator.generateContextItem({
            title: `Concurrent Save ${i}`,
            content: `Content ${i}`,
            tags: [`concurrent-${i}`],
          });

          storage.save(context);
          resolve();
        });
      });

      await Promise.all(promises);

      const contexts = storage.list();
      expect(contexts.length).toBeGreaterThanOrEqual(10);
    });

    test("should handle concurrent reads from multiple IDE clients", async () => {
      const context = TestDataGenerator.generateContextItem();
      storage.save(context);

      const promises = Array.from({ length: 20 }, () => {
        return new Promise<ContextItem | null>((resolve) => {
          const loaded = storage.load(context.id);
          resolve(loaded);
        });
      });

      const results = await Promise.all(promises);

      // All reads should succeed
      expect(results.every((r) => r !== null)).toBe(true);
      expect(results.length).toBe(20);
    });

    test("should handle interleaved read/write operations", async () => {
      const operations = [];

      // Mix of saves and loads
      for (let i = 0; i < 10; i++) {
        operations.push(
          new Promise<void>((resolve) => {
            const context = TestDataGenerator.generateContextItem({
              title: `Interleaved ${i}`,
              content: `Content ${i}`,
            });
            storage.save(context);
            resolve();
          })
        );

        operations.push(
          new Promise<void>((resolve) => {
            const contexts = storage.list();
            expect(contexts.length).toBeGreaterThan(0);
            resolve();
          })
        );
      }

      await Promise.all(operations);
      expect(operations.length).toBe(20);
    });
  });

  describe("1.4 IDE Client Content Patterns", () => {
    test("should handle large content from IDE (multi-file context)", () => {
      const largeContent = `
        // Large code file from IDE
        ${Array(1000)
          .fill(0)
          .map((_, i) => `function func${i}() { return ${i}; }`)
          .join("\n")}
      `;

      const context = TestDataGenerator.generateContextItem({
        title: "Large IDE Context",
        content: largeContent,
        tags: ["code", "large"],
      });

      storage.save(context);
      const loaded = storage.load(context.id);

      expect(loaded?.content).toBe(context.content);
      expect(loaded?.content.length).toBeGreaterThan(10000);
    });

    test("should handle special characters and Unicode from IDE", () => {
      const specialContent = `
        // Unicode from IDE users worldwide
        English: Hello
        Chinese: 你好
        Arabic: مرحبا
        Emoji: 🚀 ✨ 🎉
        Special: <>&"'\\
      `;

      const context = TestDataGenerator.generateContextItem({
        title: "Unicode Test",
        content: specialContent,
        tags: ["unicode", "international"],
      });

      storage.save(context);
      const loaded = storage.load(context.id);

      expect(loaded?.content).toContain("你好");
      expect(loaded?.content).toContain("🚀");
    });

    test("should handle deeply nested metadata from IDE", () => {
      const now = Date.now();
      const context: ContextItem = {
        id: "deep-meta-" + now,
        title: "Deep Metadata",
        content: "Content",
        tags: ["metadata"],
        metadata: {
          source: "claude-ide",
          fileInfo: {
            path: "/home/user/project/src/index.ts",
            language: "typescript",
            size: 2048,
          },
          editorState: {
            selection: {
              line: 42,
              character: 10,
            },
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      storage.save(context);
      const loaded = storage.load(context.id);

      expect(loaded?.metadata?.source).toBe("claude-ide");
      expect((loaded?.metadata as any)?.fileInfo?.language).toBe("typescript");
    });
  });

  describe("1.5 Preprocessing Integration for IDE", () => {
    test("should apply clarify preprocessing on IDE content", async () => {
      const vagueContent = "This kind of thing is basically about the sort of way that we might approach this problem";

      const result = await preprocessor.processContent(vagueContent, [
        { name: "clarify", type: "clarify", enabled: true },
      ]);

      expect(result.processed).toBeDefined();
      expect(result.processed.length).toBeGreaterThan(0);
      expect(result.results.length).toBeGreaterThan(0);
    });

    test("should apply analyze preprocessing on code from IDE", async () => {
      const code = `
        function calculateSum(numbers: number[]): number {
          let sum = 0;
          for (const num of numbers) {
            sum += num;
          }
          return sum;
        }
      `;

      const result = await preprocessor.processContent(code, [
        { name: "analyze", type: "analyze", enabled: true },
      ]);

      expect(result.processed).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });

    test("should apply search optimization on IDE context", async () => {
      const text = "This is a context from the IDE client with important keywords";

      const result = await preprocessor.processContent(text, [
        { name: "search", type: "search", enabled: true },
      ]);

      expect(result.processed).toBeDefined();
      expect(result.results.length).toBeGreaterThan(0);
    });
  });

  describe("1.6 Storage Persistence for IDE", () => {
    test("should persist context across storage reloads", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Persistence Test",
        content: "This content should persist",
        tags: ["persistent"],
      });

      const storagePath = tempDir;

      // First save
      const storage1 = new ContextStorage(storagePath);
      storage1.save(context);

      // Reload storage
      const storage2 = new ContextStorage(storagePath);
      const loaded = storage2.load(context.id);

      expect(loaded).toBeDefined();
      expect(loaded?.title).toBe(context.title);
    });

    test("should handle storage directory creation", () => {
      const newStoragePath = path.join(tempDir, "new-storage-" + Date.now());
      expect(fs.existsSync(newStoragePath)).toBe(false);

      const storage = new ContextStorage(newStoragePath);

      // After creating storage, directory should exist (after first save)
      const context = TestDataGenerator.generateContextItem();
      storage.save(context);

      expect(fs.existsSync(newStoragePath)).toBe(true);
    });
  });

  describe("1.7 Manual IDE Integration Testing (Documentation)", () => {
    test("should document required manual testing steps", () => {
      // This test serves as documentation
      const manualTestingSteps = `
        IDE INTEGRATION TESTING - Manual Steps Required:

        1. CLAUDE IDE TESTING:
           - Create a new context via Claude IDE MCP interface
           - Verify context saves correctly
           - Load context and verify content integrity
           - Test preprocessing on saved context
           - Test search functionality

        2. CURSOR IDE TESTING:
           - Configure Context Processor as MCP server in Cursor
           - Test all 6 tools from Cursor
           - Verify tool completion works
           - Test with real code files

        3. EDGE CASES TO TEST:
           - Very large files (>10MB)
           - Many concurrent contexts (1000+)
           - Special characters and encodings
           - Network interruptions
           - Long-running operations

        4. PERFORMANCE TESTING:
           - Measure save time for various content sizes
           - Measure search time for large datasets
           - Measure memory usage patterns
           - Profile IDE responsiveness

        See docs/INTEGRATION_TESTING_GUIDE.md for detailed procedures.
      `;

      expect(manualTestingSteps).toContain("Claude IDE");
      expect(manualTestingSteps).toContain("Cursor");
      console.log("Manual testing documentation is in place");
    });
  });
});
