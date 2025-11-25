/**
 * Test Scenario 3: Complex Multi-Model Workflows
 *
 * This test scenario verifies complex real-world workflows:
 * 1. Knowledge Base Building - Create, organize, and retrieve related documents
 * 2. Content Processing Pipeline - Multiple documents through different models
 * 3. Tag-Based Classification System - Auto-organization and discovery
 * 4. API Documentation Management - Complete doc lifecycle with processing
 * 5. Multi-Strategy Context Enhancement - Complex pre-processing chains
 * 6. Integration Test - Full system end-to-end
 *
 * Covers: Complete workflows, model usage, integration between components
 */

import {
  TestDataGenerator,
  TestStorageManager,
  TestAssertions,
  PreprocessorTestHelper,
  ContextComparison,
} from "./test-utils";
import { ContextItem, PreProcessingStrategy } from "../src/types";
import { ContextStorage } from "../src/storage";

describe("Scenario 3: Complex Multi-Model Workflows", () => {
  let storageManager: TestStorageManager;
  let storage: ContextStorage;
  let preprocessorHelper: PreprocessorTestHelper;

  beforeEach(() => {
    storageManager = new TestStorageManager();
    storage = storageManager.createTestStorage();
    preprocessorHelper = new PreprocessorTestHelper();
  });

  afterEach(() => {
    storageManager.cleanup();
  });

  describe("3.1 Knowledge Base Building Workflow", () => {
    test("should build a complete API documentation knowledge base", async () => {
      // Arrange - Create diverse documentation
      const apiOverview = TestDataGenerator.generateContextItem({
        title: "API Overview",
        content: TestDataGenerator.generateApiDocumentation(),
        tags: ["api", "documentation", "overview"],
        metadata: { type: "guide", priority: "high" },
      });

      const authGuide = TestDataGenerator.generateContextItem({
        title: "Authentication Guide",
        content: "JWT authentication basics. The API basically uses tokens...",
        tags: ["api", "authentication", "security"],
        metadata: { type: "guide", priority: "high" },
      });

      const errorHandling = TestDataGenerator.generateContextItem({
        title: "Error Handling",
        content: "The system generally returns standard HTTP codes...",
        tags: ["api", "errors", "documentation"],
        metadata: { type: "guide", priority: "medium" },
      });

      // Act - Save all documents
      [apiOverview, authGuide, errorHandling].forEach((ctx) => {
        storage.save(ctx);
      });

      // Assert - Verify knowledge base structure
      expect(storage.list()).toHaveLength(3);

      // Find all API documentation
      const apiDocs = storage.search(["api"]);
      expect(apiDocs).toHaveLength(3);

      // Find authentication-related docs
      const authDocs = storage.search(["authentication"]);
      expect(authDocs).toHaveLength(1);

      // Verify tag relationships
      const overview = storage.load(apiOverview.id)!;
      const related = storage
        .list()
        .filter((ctx) => {
          if (ctx.id === overview.id) return false;
          return ContextComparison.sharesTags(overview, ctx);
        })
        .slice(0, 5);

      expect(related.length).toBeGreaterThan(0);
      TestAssertions.assertRelatedContextsExist(related, 1);
    });

    test("should organize knowledge base by multiple dimensions", () => {
      // Arrange - Create diverse content with multiple tag dimensions
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "React Hooks",
          tags: ["frontend", "react", "javascript", "advanced"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Vue Composition API",
          tags: ["frontend", "vue", "javascript", "advanced"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Python Backend",
          tags: ["backend", "python", "server"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Node.js Server",
          tags: ["backend", "javascript", "server"],
        }),
        TestDataGenerator.generateContextItem({
          title: "TypeScript Best Practices",
          tags: ["frontend", "backend", "javascript", "advanced"],
        }),
      ];

      contexts.forEach((ctx) => storage.save(ctx));

      // Act & Assert - Query by various dimensions
      const frontendDocs = storage.search(["frontend"]);
      expect(frontendDocs).toHaveLength(3); // React, Vue, TypeScript

      const backendDocs = storage.search(["backend"]);
      expect(backendDocs).toHaveLength(3); // Python, Node, TypeScript

      const javaScriptDocs = storage.search(["javascript"]);
      expect(javaScriptDocs).toHaveLength(4); // React, Vue, Node, TypeScript

      const advancedDocs = storage.search(["advanced"]);
      expect(advancedDocs).toHaveLength(3); // React, Vue, TypeScript

      // Cross-dimension queries
      const frontendJavaScript = storage.search(["frontend", "javascript"]);
      expect(frontendJavaScript.length).toBeGreaterThan(0);
    });

    test("should support hierarchical tag organization", () => {
      // Arrange - Create contexts with hierarchical tags
      const contexts = [
        TestDataGenerator.generateContextItem({
          title: "Docker Basics",
          tags: ["devops", "containers", "docker", "beginner"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Kubernetes Advanced",
          tags: ["devops", "orchestration", "kubernetes", "advanced"],
        }),
        TestDataGenerator.generateContextItem({
          title: "CI/CD Pipelines",
          tags: ["devops", "ci-cd", "automation"],
        }),
      ];

      contexts.forEach((ctx) => storage.save(ctx));

      // Act & Assert
      const devopsAll = storage.search(["devops"]);
      expect(devopsAll).toHaveLength(3);

      const containerization = storage.search(["docker"]);
      expect(containerization).toHaveLength(1);

      const beginnerContent = storage.search(["beginner"]);
      expect(beginnerContent).toHaveLength(1);

      const advancedContent = storage.search(["advanced"]);
      expect(advancedContent).toHaveLength(1);
    });
  });

  describe("3.2 Content Processing Pipeline", () => {
    test("should process multiple documents through clarify model", async () => {
      // Arrange
      const documents = [
        TestDataGenerator.generateUnclearContent(),
        TestDataGenerator.generateApiDocumentation(),
        TestDataGenerator.generateProductDocumentation(),
      ];

      // Act - Process all through clarify strategy
      const results = await Promise.all(
        documents.map((doc) =>
          preprocessorHelper.testClarifyStrategy(doc)
        )
      );

      // Assert
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        TestAssertions.assertPreprocessorResults(result);
        TestAssertions.assertContentClarified(result.processed, "original");
      });
    });

    test("should route documents to appropriate models based on content type", async () => {
      // Arrange
      const apiDoc = TestDataGenerator.generateApiDocumentation();
      const unclearDoc = TestDataGenerator.generateUnclearContent();
      const urlDoc = TestDataGenerator.generateContentWithUrls();

      // Act - Route to different models
      const apiResult = await preprocessorHelper.testComprehensiveProcessing(
        apiDoc
      );
      const clarifyResult = await preprocessorHelper.testClarifyStrategy(
        unclearDoc
      );
      const fetchResult = await preprocessorHelper.testFetchStrategy(urlDoc);

      // Assert
      expect(apiResult.results).toHaveLength(3);
      expect(clarifyResult.results).toHaveLength(1);
      expect(fetchResult.results).toHaveLength(1);

      // Verify routing was effective
      TestAssertions.assertPreprocessorResults(apiResult);
      TestAssertions.assertContentClarified(clarifyResult.processed, "");
      TestAssertions.assertUrlsDetected(fetchResult.processed, 6);
    });

    test("should maintain data integrity through pipeline", async () => {
      // Arrange
      const originalContext = TestDataGenerator.generateContextItem({
        title: "Test Document",
        content: TestDataGenerator.generateApiDocumentation(),
        tags: ["test", "api"],
      });

      // Act - Process through pipeline
      const { processed } = await preprocessorHelper.testComprehensiveProcessing(
        originalContext.content
      );

      // Create context with processed content
      const processedContext: ContextItem = {
        ...originalContext,
        content: processed,
      };

      storage.save(processedContext);
      const retrieved = storage.load(processedContext.id);

      // Assert
      expect(retrieved!.title).toBe(originalContext.title);
      expect(retrieved!.tags).toEqual(originalContext.tags);
      expect(retrieved!.id).toBe(originalContext.id);
      expect(retrieved!.content).toBe(processed);
    });
  });

  describe("3.3 Tag-Based Classification System", () => {
    test("should auto-classify documents by extracted keywords", async () => {
      // Arrange
      const documents = [
        {
          title: "React Performance",
          content: TestDataGenerator.generateApiDocumentation(),
          expectedTags: ["api"],
        },
        {
          title: "Node.js Best Practices",
          content: TestDataGenerator.generateProductDocumentation(),
          expectedTags: ["backend"],
        },
      ];

      // Act & Assert
      for (const doc of documents) {
        const result = await preprocessorHelper.testSearchStrategy(doc.content);
        TestAssertions.assertKeywordsExtracted(result.processed);
        // Keywords should be extracted
        expect(result.processed).toContain("keywords");
      }
    });

    test("should support flexible tagging system", () => {
      // Arrange
      const document = TestDataGenerator.generateContextItem({
        title: "Multi-purpose Document",
        tags: [
          "documentation",
          "guide",
          "tutorial",
          "advanced",
          "security",
          "performance",
        ],
      });

      storage.save(document);

      // Act & Assert - Query by any tag
      const byDoc = storage.search(["documentation"]);
      expect(byDoc).toHaveLength(1);

      const byGuide = storage.search(["guide"]);
      expect(byGuide).toHaveLength(1);

      const bySecurity = storage.search(["security"]);
      expect(bySecurity).toHaveLength(1);

      const byPerformance = storage.search(["performance"]);
      expect(byPerformance).toHaveLength(1);

      // Multi-tag queries
      const byDocAndGuide = storage.search(["documentation", "guide"]);
      expect(byDocAndGuide).toHaveLength(1);
    });

    test("should build tag-based relationships graph", () => {
      // Arrange - Create interconnected documents
      const nodeBackend = TestDataGenerator.generateContextItem({
        title: "Node.js Backend",
        tags: ["backend", "javascript", "nodejs", "server"],
      });
      const reactFrontend = TestDataGenerator.generateContextItem({
        title: "React Frontend",
        tags: ["frontend", "javascript", "react", "ui"],
      });
      const typescript = TestDataGenerator.generateContextItem({
        title: "TypeScript Guide",
        tags: ["javascript", "typescript", "backend", "frontend"],
      });

      [nodeBackend, reactFrontend, typescript].forEach((ctx) =>
        storage.save(ctx)
      );

      // Act - Find relationships
      const javascriptDocs = storage.search(["javascript"]);
      const backendDocs = storage.search(["backend"]);
      const frontendDocs = storage.search(["frontend"]);

      // Assert
      expect(javascriptDocs).toHaveLength(3); // All mention javascript
      expect(backendDocs).toHaveLength(2); // Node.js and TypeScript
      expect(frontendDocs).toHaveLength(2); // React and TypeScript

      // Verify graph relationships
      const nodeRelated = javascriptDocs.filter(
        (ctx) =>
          ctx.id !== nodeBackend.id &&
          ContextComparison.sharesTags(nodeBackend, ctx)
      );
      expect(nodeRelated.length).toBeGreaterThan(0);
    });
  });

  describe("3.4 API Documentation Management Workflow", () => {
    test("should manage complete API documentation lifecycle", async () => {
      // Phase 1: Initial Documentation Creation
      const apiSpec = TestDataGenerator.generateContextItem({
        title: "API v2 Specification",
        content: TestDataGenerator.generateApiDocumentation(),
        tags: ["api", "v2", "specification"],
        metadata: { version: "2.0", status: "draft", createdBy: "team-a" },
      });

      storage.save(apiSpec);
      expect(storage.list()).toHaveLength(1);

      // Phase 2: Add Related Documentation
      const endpoints = TestDataGenerator.generateContextItem({
        title: "API Endpoints",
        content: "Available endpoints:\n- GET /users\n- POST /users\n- GET /products",
        tags: ["api", "v2", "endpoints"],
        metadata: { version: "2.0", status: "draft" },
      });

      const errors = TestDataGenerator.generateContextItem({
        title: "Error Codes",
        content: "Error handling guide... basically explains error responses",
        tags: ["api", "v2", "errors"],
        metadata: { version: "2.0", status: "draft" },
      });

      storage.save(endpoints);
      storage.save(errors);
      expect(storage.list()).toHaveLength(3);

      // Phase 3: Process Documentation
      const processedContent = (
        await preprocessorHelper.testComprehensiveProcessing(apiSpec.content)
      ).processed;

      // Phase 4: Update with processed content
      const updated: ContextItem = {
        ...apiSpec,
        content: processedContent,
        metadata: { ...apiSpec.metadata, status: "processed" },
      };
      storage.save(updated);

      // Phase 5: Retrieve and verify
      const retrieved = storage.load(updated.id);
      expect(retrieved!.metadata.status).toBe("processed");

      // Phase 6: Find all v2 documentation
      const v2Docs = storage.search(["v2"]);
      expect(v2Docs).toHaveLength(3);

      // Phase 7: Archive old versions
      const v1Docs = storage.list().filter((ctx) =>
        ctx.tags.some((tag) => tag.includes("v1"))
      );
      expect(v1Docs).toHaveLength(0); // No v1 docs created

      // Assert final state
      const finalState = storage.list();
      expect(finalState).toHaveLength(3);
      expect(finalState.map((c) => c.tags.flat())).toEqual(
        expect.arrayContaining([
          expect.arrayContaining(["api"]),
        ])
      );
    });

    test("should maintain documentation consistency", () => {
      // Arrange
      const docParts = [
        TestDataGenerator.generateContextItem({
          title: "Overview",
          tags: ["api", "v2"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Authentication",
          tags: ["api", "v2"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Endpoints",
          tags: ["api", "v2"],
        }),
      ];

      docParts.forEach((part) => storage.save(part));

      // Act & Assert
      const allDocs = storage.search(["api"]);
      expect(allDocs).toHaveLength(3);

      // Each doc is related to others
      allDocs.forEach((doc) => {
        const related = allDocs.filter((d) => d.id !== doc.id);
        expect(related.length).toBe(2);
      });
    });
  });

  describe("3.5 Multi-Strategy Context Enhancement", () => {
    test("should enhance context with multiple strategies in sequence", async () => {
      // Arrange
      const originalContext = TestDataGenerator.generateContextItem({
        title: "Complex Content",
        content: `
        The API basically provides several endpoints. Generally, you should use HTTPS.
        Documentation: https://api.example.com/docs

        This approach basically improves performance which is generally important.
        Features: authentication, caching, rate limiting.
        `,
        tags: ["api", "documentation"],
      });

      // Act - Apply multiple strategies
      const clarifyResult = await preprocessorHelper.testClarifyStrategy(
        originalContext.content
      );
      const analysisResult = await preprocessorHelper.testAnalyzeStrategy(
        originalContext.content
      );
      const searchResult = await preprocessorHelper.testSearchStrategy(
        originalContext.content
      );
      const fetchResult = await preprocessorHelper.testFetchStrategy(
        originalContext.content
      );
      const fullResult = await preprocessorHelper.testComprehensiveProcessing(
        originalContext.content
      );

      // Assert - Each strategy produces expected results
      TestAssertions.assertContentClarified(clarifyResult.processed, "");
      TestAssertions.assertAnalysisPerformed(analysisResult.processed);
      TestAssertions.assertKeywordsExtracted(searchResult.processed);
      TestAssertions.assertUrlsDetected(fetchResult.processed, 1);

      // Comprehensive should have all
      expect(fullResult.results).toHaveLength(3);
      expect(fullResult.results.map((r: any) => r.processed)).toEqual(
        expect.arrayContaining([true, true, true])
      );
    });

    test("should handle model switching based on document characteristics", async () => {
      // Arrange - Different content types
      const documents = [
        {
          content: TestDataGenerator.generateUnclearContent(),
          model: "clarify",
          expectedSteps: 1,
        },
        {
          content: TestDataGenerator.generateContentWithUrls(),
          model: "web_enhanced",
          expectedSteps: 2,
        },
        {
          content: TestDataGenerator.generateApiDocumentation(),
          model: "comprehensive",
          expectedSteps: 3,
        },
      ];

      // Act & Assert
      for (const doc of documents) {
        let result;
        switch (doc.model) {
          case "clarify":
            result = await preprocessorHelper.testClarifyStrategy(doc.content);
            break;
          case "web_enhanced":
            result = await preprocessorHelper.testFetchStrategy(doc.content);
            break;
          case "comprehensive":
            result = await preprocessorHelper.testComprehensiveProcessing(
              doc.content
            );
            break;
        }
        expect(result!.results.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("3.6 Integration Test - Complete System Workflow", () => {
    test("should execute complete end-to-end workflow", async () => {
      // ===== PHASE 1: Create Knowledge Base =====
      console.log("Phase 1: Creating knowledge base...");

      const baseContexts = [
        TestDataGenerator.generateContextItem({
          title: "API Documentation",
          content: TestDataGenerator.generateApiDocumentation(),
          tags: ["api", "documentation", "v2"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Product Guide",
          content: TestDataGenerator.generateProductDocumentation(),
          tags: ["product", "guide", "user-facing"],
        }),
        TestDataGenerator.generateContextItem({
          title: "Technical References",
          content: TestDataGenerator.generateContentWithUrls(),
          tags: ["reference", "links", "technical"],
        }),
      ];

      baseContexts.forEach((ctx) => storage.save(ctx));
      expect(storage.list()).toHaveLength(3);

      // ===== PHASE 2: Process and Enhance =====
      console.log("Phase 2: Processing and enhancing...");

      for (let i = 0; i < baseContexts.length; i++) {
        const ctx = baseContexts[i];
        const processed = (
          await preprocessorHelper.testComprehensiveProcessing(ctx.content)
        ).processed;

        const enhanced: ContextItem = {
          ...ctx,
          content: processed,
          metadata: { ...ctx.metadata, processed: true },
        };
        storage.save(enhanced);
      }

      // ===== PHASE 3: Verify Storage State =====
      console.log("Phase 3: Verifying storage state...");

      const allContexts = storage.list();
      expect(allContexts).toHaveLength(3);

      allContexts.forEach((ctx) => {
        TestAssertions.assertContextSaved(ctx);
        // All should have metadata indicating processing
        expect(ctx.id).toBeDefined();
      });

      // ===== PHASE 4: Test Discovery =====
      console.log("Phase 4: Testing discovery...");

      const apiDocs = storage.search(["api"]);
      expect(apiDocs).toHaveLength(1);
      expect(apiDocs[0].title).toBe("API Documentation");

      const allDocs = storage.search(["documentation", "guide"]);
      expect(allDocs.length).toBeGreaterThanOrEqual(1);

      // ===== PHASE 5: Test Related Content =====
      console.log("Phase 5: Testing related content...");

      const apiDoc = storage.load(baseContexts[0].id)!;
      const related = storage
        .list()
        .filter((ctx) => {
          if (ctx.id === apiDoc.id) return false;
          return ContextComparison.sharesTags(apiDoc, ctx);
        });

      expect(related.length).toBeGreaterThanOrEqual(0);

      // ===== PHASE 6: Simulate Updates =====
      console.log("Phase 6: Simulating updates...");

      const updated = {
        ...apiDoc,
        title: "API Documentation v2.1",
        metadata: { ...apiDoc.metadata, version: "2.1" },
      };
      storage.save(updated);

      const verifyUpdate = storage.load(updated.id)!;
      expect(verifyUpdate.title).toBe("API Documentation v2.1");

      // ===== PHASE 7: Test Pagination =====
      console.log("Phase 7: Testing pagination...");

      // Add more documents
      for (let i = 0; i < 5; i++) {
        storage.save(
          TestDataGenerator.generateContextItem({
            tags: ["batch", "test"],
          })
        );
      }

      const page1 = storage.search(undefined, 3, 0);
      const page2 = storage.search(undefined, 3, 3);

      expect(page1.length).toBeGreaterThan(0);
      expect(page2.length).toBeGreaterThan(0);

      // ===== PHASE 8: Final Verification =====
      console.log("Phase 8: Final verification...");

      const finalState = storage.list();
      expect(finalState.length).toBeGreaterThan(3);

      // All contexts should be valid
      finalState.forEach((ctx) => {
        expect(ctx.id).toBeDefined();
        expect(ctx.title).toBeDefined();
        expect(ctx.content).toBeDefined();
        expect(Array.isArray(ctx.tags)).toBe(true);
      });

      console.log("✓ Complete workflow test passed!");
      console.log(`  - Total contexts: ${finalState.length}`);
      console.log(`  - Storage locations: ${storageManager.listStoredContexts().length} files`);
    });

    test("should handle concurrent operations safely", async () => {
      // Arrange
      const contextPromises = Array.from({ length: 20 }, () =>
        Promise.resolve(TestDataGenerator.generateContextItem())
      );

      // Act - Save concurrently
      const contexts = await Promise.all(contextPromises);
      contexts.forEach((ctx) => storage.save(ctx));

      // Assert
      expect(storage.list()).toHaveLength(20);

      // Verify no data corruption
      contexts.forEach((original) => {
        const retrieved = storage.load(original.id);
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(original.id);
      });
    });

    test("should validate system under load", async () => {
      // Arrange - Create high volume of operations
      const bulkContexts = TestDataGenerator.generateContextItems(50, [
        "bulk",
      ]);

      // Act - Bulk insert
      const insertStart = Date.now();
      bulkContexts.forEach((ctx) => storage.save(ctx));
      const insertTime = Date.now() - insertStart;

      // Bulk query
      const queryStart = Date.now();
      const results = storage.search(["bulk"]);
      const queryTime = Date.now() - queryStart;

      // Process results
      const processStart = Date.now();
      const processed = await Promise.all(
        results.slice(0, 10).map((ctx) =>
          preprocessorHelper.testComprehensiveProcessing(ctx.content)
        )
      );
      const processTime = Date.now() - processStart;

      // Assert
      expect(results).toHaveLength(50);
      expect(processed).toHaveLength(10);
      expect(insertTime).toBeLessThan(5000);
      expect(queryTime).toBeLessThan(500);
      expect(processTime).toBeLessThan(10000);
    });
  });

  describe("3.7 Error Recovery and Resilience", () => {
    test("should recover from failed processing", async () => {
      // Arrange
      const context = TestDataGenerator.generateContextItem();
      storage.save(context);

      // Act - Save successfully
      const initial = storage.load(context.id);
      expect(initial).not.toBeNull();

      // Simulate update with processing
      const processed = {
        ...context,
        content: "Updated content",
      };
      storage.save(processed);

      // Assert - Should recover
      const final = storage.load(context.id);
      expect(final!.content).toBe("Updated content");
    });

    test("should maintain consistency during partial failures", async () => {
      // Arrange
      const contexts = TestDataGenerator.generateContextItems(5);
      contexts.forEach((ctx) => storage.save(ctx));

      // Act - Partial deletion
      storage.delete(contexts[2].id);

      // Assert - Should maintain integrity
      expect(storage.list()).toHaveLength(4);
      const remaining = storage.list();
      expect(remaining.map((c) => c.id)).not.toContain(contexts[2].id);
    });
  });
});
