/**
 * Test Scenario 1: Complete Context Lifecycle
 *
 * This test scenario verifies the complete lifecycle of context operations:
 * 1. Create and save contexts
 * 2. List and retrieve contexts
 * 3. Update contexts
 * 4. Find related contexts by tags
 * 5. Delete contexts
 *
 * Covers: save_context, load_context, list_contexts, delete_context tools
 */

import { ContextStorage } from "../src/storage";
import {
  TestDataGenerator,
  TestStorageManager,
  TestAssertions,
  ContextComparison,
} from "./test-utils";
import { ContextItem } from "../src/types";

describe("Scenario 1: Complete Context Lifecycle", () => {
  let storageManager: TestStorageManager;
  let storage: ContextStorage;

  beforeEach(() => {
    storageManager = new TestStorageManager();
    storage = storageManager.createTestStorage();
  });

  afterEach(() => {
    storageManager.cleanup();
  });

  describe("1.1 Save and Retrieve Single Context", () => {
    test("should save a context and retrieve it by ID", () => {
      // Arrange
      const context = TestDataGenerator.generateContextItem({
        title: "API Documentation",
        content: "This is API documentation.",
        tags: ["api", "documentation"],
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      TestAssertions.assertContextSaved(retrieved!);
      TestAssertions.assertContextMatches(
        retrieved!,
        "API Documentation",
        ["api", "documentation"]
      );
      expect(retrieved!.content).toContain("API documentation");
    });

    test("should return null when loading non-existent context", () => {
      // Act
      const retrieved = storage.load("non-existent-id");

      // Assert
      expect(retrieved).toBeNull();
    });

    test("should preserve metadata when saving and loading", () => {
      // Arrange
      const metadata = {
        source: "github",
        version: "2.0",
        author: "team-a",
        priority: "high",
      };
      const context = TestDataGenerator.generateContextItem({
        metadata,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.metadata).toEqual(metadata);
    });

    test("should update timestamps correctly", () => {
      // Arrange
      const now = Date.now();
      const context = TestDataGenerator.generateContextItem({
        createdAt: now,
        updatedAt: now,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.createdAt).toBe(now);
      expect(retrieved!.updatedAt).toBe(now);
      expect(retrieved!.createdAt).toBeLessThanOrEqual(retrieved!.updatedAt);
    });
  });

  describe("1.2 List and Filter Contexts", () => {
    test("should list all saved contexts", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(5, ["all"]);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      const listed = storage.list();

      // Assert
      expect(listed).toHaveLength(5);
      listed.forEach((ctx) => {
        TestAssertions.assertContextSaved(ctx);
      });
    });

    test("should filter contexts by single tag", () => {
      // Arrange
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "React Guide",
          tags: ["react", "frontend"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Python Guide",
          tags: ["python", "backend"],
        }),
        TestDataGenerator.generateContextItem({
          title: "React Hooks",
          tags: ["react", "advanced"],
        }),
      ];
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      const filtered = storage.search(["react"]);

      // Assert
      expect(filtered).toHaveLength(2);
      expect(filtered.map((c) => c.title)).toContain("React Guide");
      expect(filtered.map((c) => c.title)).toContain("React Hooks");
    });

    test("should filter contexts by multiple tags (any match)", () => {
      // Arrange
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "React Doc",
          tags: ["react"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Vue Doc",
          tags: ["vue"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Angular Doc",
          tags: ["angular"],
        }),
      ];
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      const filtered = storage.search(["react", "vue"]);

      // Assert
      expect(filtered).toHaveLength(2);
      const titles = filtered.map((c) => c.title);
      expect(titles).toContain("React Doc");
      expect(titles).toContain("Vue Doc");
      expect(titles).not.toContain("Angular Doc");
    });

    test("should apply pagination with limit and offset", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(10);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      const page1 = storage.search(undefined, 3, 0);
      const page2 = storage.search(undefined, 3, 3);
      const page3 = storage.search(undefined, 3, 6);

      // Assert
      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
      expect(page3).toHaveLength(3);

      // Verify no overlap
      const ids1 = page1.map((c) => c.id);
      const ids2 = page2.map((c) => c.id);
      expect(ids1).not.toEqual(expect.arrayContaining(ids2));
    });

    test("should return empty list when no matches found", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(3, ["common"]);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      const filtered = storage.search(["nonexistent"]);

      // Assert
      expect(filtered).toHaveLength(0);
    });
  });

  describe("1.3 Update and Modify Contexts", () => {
    test("should update context by overwriting with same ID", () => {
      // Arrange
      const original = TestDataGenerator.generateContextItem({
        title: "Original Title",
        content: "Original content",
      });
      storage.save(original);

      // Act
      const updated = TestDataGenerator.generateContextItem({
        id: original.id,
        title: "Updated Title",
        content: "Updated content",
        tags: ["updated"],
      });
      storage.save(updated);
      const retrieved = storage.load(original.id);

      // Assert
      expect(retrieved!.title).toBe("Updated Title");
      expect(retrieved!.content).toBe("Updated content");
      expect(retrieved!.tags).toContain("updated");
    });

    test("should preserve ID when updating", () => {
      // Arrange
      const context = TestDataGenerator.generateContextItem();
      const originalId = context.id;
      storage.save(context);

      // Act
      const updated: ContextItem = {
        ...context,
        title: "New Title",
        updatedAt: Date.now() + 1000,
      };
      storage.save(updated);

      // Assert
      expect(storage.load(originalId)).not.toBeNull();
      expect(storage.load(originalId)!.id).toBe(originalId);
    });
  });

  describe("1.4 Related Context Discovery", () => {
    test("should find related contexts by shared tags", () => {
      // Arrange
      const apiDocs = TestDataGenerator.generateContextItem({
        title: "API Docs",
        tags: ["api", "documentation"],
      });
      const apiGuide = TestDataGenerator.generateContextItem({
        title: "API Guide",
        tags: ["api", "tutorial"],
      });
      const dbDocs = TestDataGenerator.generateContextItem({
        title: "Database Docs",
        tags: ["database", "documentation"],
      });

      storage.save(apiDocs);
      storage.save(apiGuide);
      storage.save(dbDocs);

      // Act
      const allContexts = storage.list();
      const related = allContexts.filter(
        (ctx) => {
          if (ctx.id === apiDocs.id) return false;
          return ContextComparison.sharesTags(apiDocs, ctx);
        }
      );

      // Assert
      expect(related).toHaveLength(2); // apiGuide and dbDocs
      const relatedTitles = related.map((c) => c.title);
      expect(relatedTitles).toContain("API Guide");
      expect(relatedTitles).toContain("Database Docs");
    });

    test("should calculate tag overlap correctly", () => {
      // Arrange
      const context1 = TestDataGenerator.generateContextItem({
        tags: ["api", "documentation", "v2"],
      });
      const context2 = TestDataGenerator.generateContextItem({
        tags: ["api", "tutorial"],
      });

      // Act
      const commonTags = ContextComparison.getCommonTags(context1, context2);

      // Assert
      expect(commonTags).toEqual(["api"]);
      expect(commonTags).toHaveLength(1);
    });

    test("should identify contexts with no tag overlap", () => {
      // Arrange
      const frontendCtx = TestDataGenerator.generateContextItem({
        tags: ["react", "javascript"],
      });
      const backendCtx = TestDataGenerator.generateContextItem({
        tags: ["python", "flask"],
      });

      // Act
      const commonTags = ContextComparison.getCommonTags(frontendCtx, backendCtx);

      // Assert
      expect(commonTags).toHaveLength(0);
      expect(ContextComparison.sharesTags(frontendCtx, backendCtx)).toBe(false);
    });
  });

  describe("1.5 Delete and Cleanup", () => {
    test("should delete a context successfully", () => {
      // Arrange
      const context = TestDataGenerator.generateContextItem();
      storage.save(context);
      expect(storage.load(context.id)).not.toBeNull();

      // Act
      const deleted = storage.delete(context.id);
      const retrieved = storage.load(context.id);

      // Assert
      expect(deleted).toBe(true);
      expect(retrieved).toBeNull();
    });

    test("should return false when deleting non-existent context", () => {
      // Act
      const deleted = storage.delete("non-existent-id");

      // Assert
      expect(deleted).toBe(false);
    });

    test("should handle batch deletion", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(5);
      const idsToDelete = contexts.slice(0, 3).map((c) => c.id);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      idsToDelete.forEach((id) => storage.delete(id));

      // Assert
      const remaining = storage.list();
      expect(remaining).toHaveLength(2);
      idsToDelete.forEach((id) => {
        expect(storage.load(id)).toBeNull();
      });
    });

    test("should maintain data integrity after deletions", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(4);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act
      storage.delete(contexts[1].id);
      const remaining = storage.list();

      // Assert
      expect(remaining).toHaveLength(3);
      expect(remaining.map((c) => c.id)).toContain(contexts[0].id);
      expect(remaining.map((c) => c.id)).toContain(contexts[2].id);
      expect(remaining.map((c) => c.id)).toContain(contexts[3].id);
      expect(remaining.map((c) => c.id)).not.toContain(contexts[1].id);
    });
  });

  describe("1.6 Edge Cases and Error Handling", () => {
    test("should handle empty content", () => {
      // Arrange
      const context = TestDataGenerator.generateContextItem({
        content: "",
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.content).toBe("");
      TestAssertions.assertContextSaved(retrieved!);
    });

    test("should handle large metadata objects", () => {
      // Arrange
      const largeMetadata = {
        nested: { deep: { structure: { with: { many: { keys: "value" } } } } },
        arrays: [1, 2, 3, 4, 5],
        mixed: { types: true, numbers: 42, strings: "test" },
      };
      const context = TestDataGenerator.generateContextItem({
        metadata: largeMetadata,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.metadata).toEqual(largeMetadata);
    });

    test("should handle many tags", () => {
      // Arrange
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag-${i}`);
      const context = TestDataGenerator.generateContextItem({
        tags: manyTags,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.tags).toHaveLength(50);
      expect(retrieved!.tags).toEqual(expect.arrayContaining(manyTags));
    });

    test("should handle very long content", () => {
      // Arrange
      const longContent = "x".repeat(100000); // 100KB
      const context = TestDataGenerator.generateContextItem({
        content: longContent,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.content).toHaveLength(100000);
      expect(retrieved!.content).toBe(longContent);
    });

    test("should handle special characters in content", () => {
      // Arrange
      const specialContent =
        'Special chars: !@#$%^&*()_+-=[]{}|;\':"<>?,./\n\t\r';
      const context = TestDataGenerator.generateContextItem({
        content: specialContent,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.content).toBe(specialContent);
    });

    test("should handle unicode characters", () => {
      // Arrange
      const unicodeContent =
        "Unicode: 你好世界 🚀 émojis 日本語 العربية Ελληνικά";
      const context = TestDataGenerator.generateContextItem({
        title: "Unicode Test",
        content: unicodeContent,
      });

      // Act
      storage.save(context);
      const retrieved = storage.load(context.id);

      // Assert
      expect(retrieved!.content).toBe(unicodeContent);
      expect(retrieved!.title).toBe("Unicode Test");
    });
  });

  describe("1.7 Performance and Scalability", () => {
    test("should handle large number of contexts", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(100);

      // Act
      const startTime = Date.now();
      contexts.forEach((ctx) => storage.save(ctx));
      const saveTime = Date.now() - startTime;

      const listStart = Date.now();
      const listed = storage.list();
      const listTime = Date.now() - listStart;

      // Assert
      expect(listed).toHaveLength(100);
      expect(saveTime).toBeLessThan(5000); // Should save 100 contexts in < 5 seconds
      expect(listTime).toBeLessThan(1000); // Should list 100 contexts in < 1 second
    });

    test("should search efficiently through many contexts", () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(50, ["common"]);
      contexts.slice(0, 20).forEach((ctx) => {
        ctx.tags.push("target");
        storage.save(ctx);
      });
      contexts.slice(20).forEach((ctx) => storage.save(ctx));

      // Act
      const startTime = Date.now();
      const results = storage.search(["target"]);
      const searchTime = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(20);
      expect(searchTime).toBeLessThan(100); // Should search in < 100ms
    });
  });
});
