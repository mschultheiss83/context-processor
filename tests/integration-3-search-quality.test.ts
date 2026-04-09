/**
 * Integration Test Suite 3: Full-Text Search Quality
 *
 * This suite verifies that the full-text search functionality provides
 * high-quality, relevant results and handles various edge cases correctly.
 *
 * These tests verify:
 * 1. Basic keyword search in title and content
 * 2. Proper ranking (title matches > content matches)
 * 3. Multi-word query handling
 * 4. Case-insensitive search
 * 5. Special character handling
 * 6. Result limiting
 * 7. Empty/invalid query handling
 * 8. Backward compatibility with tag-based search
 */

import { ContextStorage } from "../src/storage";
import {
  TestDataGenerator,
  TestStorageManager,
} from "./test-utils";
import { ContextItem } from "../src/types";

describe("Integration 3: Full-Text Search Quality", () => {
  let storageManager: TestStorageManager;
  let storage: ContextStorage;

  beforeEach(() => {
    storageManager = new TestStorageManager();
    storage = storageManager.createTestStorage();
  });

  afterEach(() => {
    storageManager.cleanup();
  });

  describe("3.1 Basic Full-Text Search", () => {
    test("should find context by title keyword", () => {
      // Save test contexts
      const context1 = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "How to use Node.js effectively",
        tags: ["guide"],
      });

      const context2 = TestDataGenerator.generateContextItem({
        title: "JavaScript Basics",
        content: "Learn JavaScript fundamentals",
        tags: ["basics"],
      });

      storage.save(context1);
      storage.save(context2);

      // Search for "TypeScript"
      const results = storage.searchFullText("TypeScript");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context1.id);
      expect(results[0].title).toContain("TypeScript");
    });

    test("should find context by content keyword", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Development Tips",
        content: "TypeScript provides excellent type safety for Node.js applications",
        tags: ["tips"],
      });

      storage.save(context);

      const results = storage.searchFullText("TypeScript");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
      expect(results[0].content).toContain("TypeScript");
    });

    test("should find contexts matching any search term", () => {
      const context1 = TestDataGenerator.generateContextItem({
        title: "Python Tutorial",
        content: "Learn Python programming",
        tags: ["tutorial"],
      });

      const context2 = TestDataGenerator.generateContextItem({
        title: "JavaScript Tutorial",
        content: "Learn JavaScript programming",
        tags: ["tutorial"],
      });

      storage.save(context1);
      storage.save(context2);

      const results = storage.searchFullText("Python");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.id === context1.id)).toBe(true);
    });
  });

  describe("3.2 Search Ranking Quality", () => {
    test("should rank title matches higher than content matches", () => {
      const titleMatch = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "A comprehensive guide to development",
        tags: ["guide"],
      });

      const contentMatch = TestDataGenerator.generateContextItem({
        title: "Development Guide",
        content: "This guide covers TypeScript and other technologies",
        tags: ["guide"],
      });

      storage.save(contentMatch);
      storage.save(titleMatch);

      const results = storage.searchFullText("TypeScript");

      expect(results.length).toBe(2);
      // Title match should be ranked first
      expect(results[0].id).toBe(titleMatch.id);
      expect(results[1].id).toBe(contentMatch.id);
    });

    test("should rank by relevance score", () => {
      const highScore = TestDataGenerator.generateContextItem({
        title: "async await patterns",
        content: "async programming with promises and async functions",
        tags: ["async"],
      });

      const mediumScore = TestDataGenerator.generateContextItem({
        title: "Programming Guide",
        content: "Learn async await in TypeScript",
        tags: ["guide"],
      });

      const lowScore = TestDataGenerator.generateContextItem({
        title: "Development Tips",
        content: "Various tips including async",
        tags: ["tips"],
      });

      storage.save(lowScore);
      storage.save(mediumScore);
      storage.save(highScore);

      const results = storage.searchFullText("async");

      expect(results.length).toBe(3);
      // High score should be first (title + content matches)
      expect(results[0].id).toBe(highScore.id);
    });

    test("should use alphabetical order as tiebreaker", () => {
      const contextA = TestDataGenerator.generateContextItem({
        title: "Alpha Guide",
        content: "Content about testing",
        tags: ["guide"],
      });

      const contextZ = TestDataGenerator.generateContextItem({
        title: "Zulu Guide",
        content: "Content about testing",
        tags: ["guide"],
      });

      storage.save(contextZ);
      storage.save(contextA);

      const results = storage.searchFullText("Guide");

      expect(results.length).toBe(2);
      // Same score, so alphabetical order
      expect(results[0].title).toBe("Alpha Guide");
      expect(results[1].title).toBe("Zulu Guide");
    });
  });

  describe("3.3 Multi-Word Query Handling", () => {
    test("should handle multi-word queries", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Async Programming Guide",
        content: "Learn async programming patterns",
        tags: ["programming"],
      });

      storage.save(context);

      const results = storage.searchFullText("async programming");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
    });

    test("should score contexts with all query terms higher", () => {
      const allTerms = TestDataGenerator.generateContextItem({
        title: "TypeScript async programming",
        content: "Guide to async programming in TypeScript",
        tags: ["typescript"],
      });

      const oneTermTitle = TestDataGenerator.generateContextItem({
        title: "TypeScript basics",
        content: "Introduction to TypeScript",
        tags: ["typescript"],
      });

      const oneTermContent = TestDataGenerator.generateContextItem({
        title: "Development Guide",
        content: "Contains some async examples",
        tags: ["guide"],
      });

      storage.save(oneTermContent);
      storage.save(oneTermTitle);
      storage.save(allTerms);

      const results = storage.searchFullText("TypeScript async");

      expect(results.length).toBe(3);
      // Context with both terms should rank highest
      expect(results[0].id).toBe(allTerms.id);
    });

    test("should handle queries with extra whitespace", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Testing Guide",
        content: "Unit testing best practices",
        tags: ["testing"],
      });

      storage.save(context);

      const results = storage.searchFullText("  testing   guide  ");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
    });
  });

  describe("3.4 Case Sensitivity", () => {
    test("should be case-insensitive", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "Learn TYPESCRIPT programming",
        tags: ["guide"],
      });

      storage.save(context);

      // Test various case combinations
      expect(storage.searchFullText("typescript").length).toBeGreaterThan(0);
      expect(storage.searchFullText("TYPESCRIPT").length).toBeGreaterThan(0);
      expect(storage.searchFullText("TypeScript").length).toBeGreaterThan(0);
      expect(storage.searchFullText("tYpEsCrIpT").length).toBeGreaterThan(0);
    });

    test("should match regardless of content casing", () => {
      const upperCase = TestDataGenerator.generateContextItem({
        title: "API DOCUMENTATION",
        content: "REST API GUIDE",
        tags: ["api"],
      });

      const lowerCase = TestDataGenerator.generateContextItem({
        title: "api documentation",
        content: "rest api guide",
        tags: ["api"],
      });

      storage.save(upperCase);
      storage.save(lowerCase);

      const results = storage.searchFullText("api");

      expect(results.length).toBe(2);
    });
  });

  describe("3.5 Special Characters", () => {
    test("should handle special characters in query", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "C++ Programming",
        content: "Learn C++ development",
        tags: ["cpp"],
      });

      storage.save(context);

      const results = storage.searchFullText("C++");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
    });

    test("should handle punctuation in content", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Style Guide",
        content: "Use semicolons; avoid globals! Follow best-practices.",
        tags: ["style"],
      });

      storage.save(context);

      const results = storage.searchFullText("semicolons");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
    });

    test("should handle hyphenated words", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Best Practices",
        content: "Follow best-practices and real-time processing",
        tags: ["practices"],
      });

      storage.save(context);

      const results = storage.searchFullText("best-practices");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(context.id);
    });
  });

  describe("3.6 Result Limiting", () => {
    test("should limit results with limit option", () => {
      // Save 10 contexts with "test" in title
      for (let i = 0; i < 10; i++) {
        const context = TestDataGenerator.generateContextItem({
          title: `Test Context ${i}`,
          content: `Content ${i}`,
          tags: [`test-${i}`],
        });
        storage.save(context);
      }

      const results = storage.searchFullText("test", { limit: 5 });

      expect(results.length).toBe(5);
    });

    test("should default to 50 results", () => {
      // Save 60 contexts
      for (let i = 0; i < 60; i++) {
        const context = TestDataGenerator.generateContextItem({
          title: `Guide ${i}`,
          content: `Content ${i}`,
          tags: [`guide-${i}`],
        });
        storage.save(context);
      }

      const results = storage.searchFullText("guide");

      // Should return max 50 by default
      expect(results.length).toBe(50);
    });

    test("should return all results if under limit", () => {
      const context1 = TestDataGenerator.generateContextItem({
        title: "Unique Search Term Alpha",
        content: "Content",
        tags: ["unique"],
      });

      const context2 = TestDataGenerator.generateContextItem({
        title: "Unique Search Term Beta",
        content: "Content",
        tags: ["unique"],
      });

      storage.save(context1);
      storage.save(context2);

      const results = storage.searchFullText("Unique", { limit: 100 });

      expect(results.length).toBe(2);
    });
  });

  describe("3.7 Edge Cases", () => {
    test("should return empty array for no matches", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "Learn TypeScript",
        tags: ["guide"],
      });

      storage.save(context);

      const results = storage.searchFullText("Python");

      expect(results).toEqual([]);
      expect(results.length).toBe(0);
    });

    test("should handle empty query", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Test",
        content: "Content",
        tags: ["test"],
      });

      storage.save(context);

      const results = storage.searchFullText("");

      expect(results).toEqual([]);
    });

    test("should handle whitespace-only query", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Test",
        content: "Content",
        tags: ["test"],
      });

      storage.save(context);

      const results = storage.searchFullText("   ");

      expect(results).toEqual([]);
    });

    test("should handle search on empty storage", () => {
      const results = storage.searchFullText("anything");

      expect(results).toEqual([]);
    });

    test("should handle very long queries gracefully", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Test",
        content: "Content with various words",
        tags: ["test"],
      });

      storage.save(context);

      const longQuery = Array(100).fill("word").join(" ");
      const results = storage.searchFullText(longQuery);

      // Should not throw error
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("3.8 Backward Compatibility", () => {
    test("should still support tag-based search", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "Test Context",
        content: "Test content",
        tags: ["important", "production"],
      });

      storage.save(context);

      // Tag-based search should still work
      const tagResults = storage.search(["important"]);

      expect(tagResults.length).toBeGreaterThan(0);
      expect(tagResults[0].id).toBe(context.id);
    });

    test("should allow using both search methods independently", () => {
      const context = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "Learn TypeScript",
        tags: ["typescript", "guide"],
      });

      storage.save(context);

      // Both search methods should work
      const tagResults = storage.search(["typescript"]);
      const fullTextResults = storage.searchFullText("TypeScript");

      expect(tagResults.length).toBeGreaterThan(0);
      expect(fullTextResults.length).toBeGreaterThan(0);
      expect(tagResults[0].id).toBe(context.id);
      expect(fullTextResults[0].id).toBe(context.id);
    });
  });

  describe("3.9 Field-Specific Search", () => {
    test("should search only in title when specified", () => {
      const titleMatch = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "Learn programming",
        tags: ["guide"],
      });

      const contentMatch = TestDataGenerator.generateContextItem({
        title: "Programming Guide",
        content: "TypeScript is great",
        tags: ["guide"],
      });

      storage.save(titleMatch);
      storage.save(contentMatch);

      const results = storage.searchFullText("TypeScript", {
        fields: ["title"],
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(titleMatch.id);
    });

    test("should search only in content when specified", () => {
      const titleMatch = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        content: "Learn programming",
        tags: ["guide"],
      });

      const contentMatch = TestDataGenerator.generateContextItem({
        title: "Programming Guide",
        content: "TypeScript is great",
        tags: ["guide"],
      });

      storage.save(titleMatch);
      storage.save(contentMatch);

      const results = storage.searchFullText("TypeScript", {
        fields: ["content"],
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(contentMatch.id);
    });
  });

  describe("3.10 Real-World Search Scenarios", () => {
    test("should handle realistic documentation search", () => {
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "API Authentication Guide",
          content: "Learn how to authenticate API requests using JWT tokens",
          tags: ["api", "auth"],
        }),
        TestDataGenerator.generateContextItem({
          title: "REST API Design",
          content: "Best practices for designing RESTful APIs",
          tags: ["api", "design"],
        }),
        TestDataGenerator.generateContextItem({
          title: "GraphQL API Tutorial",
          content: "Introduction to GraphQL API development",
          tags: ["api", "graphql"],
        }),
      ];

      contexts.forEach((c) => storage.save(c));

      const results = storage.searchFullText("API authentication");

      expect(results.length).toBeGreaterThan(0);
      // Authentication guide should rank highest
      expect(results[0].title).toContain("Authentication");
    });

    test("should handle code search scenario", () => {
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "Async/Await in JavaScript",
          content: "function async getData() { await fetch() }",
          tags: ["javascript", "async"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Promise Handling",
          content: "Working with JavaScript promises and async operations",
          tags: ["javascript", "promises"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Error Handling",
          content: "Handle errors in async/await code",
          tags: ["errors"],
        }),
      ];

      contexts.forEach((c) => storage.save(c));

      const results = storage.searchFullText("async await");

      expect(results.length).toBeGreaterThan(0);
      // Should find contexts related to async/await
      expect(results[0].title).toContain("Async");
    });
  });
});
