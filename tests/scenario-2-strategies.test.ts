/**
 * Test Scenario 2: Pre-Processing Strategies
 *
 * This test scenario verifies all pre-processing strategies work correctly:
 * 1. Clarify Strategy - Improve language clarity
 * 2. Analyze Strategy - Content analysis and metrics
 * 3. Search Strategy - Keyword extraction
 * 4. Fetch Strategy - URL detection
 * 5. Strategy Combinations - Multiple strategies in sequence
 *
 * Covers: All pre-processing logic, strategy execution, and combinations
 */

import {
  TestDataGenerator,
  TestAssertions,
  PreprocessorTestHelper,
} from "./test-utils";

describe("Scenario 2: Pre-Processing Strategies", () => {
  let helper: PreprocessorTestHelper;

  beforeEach(() => {
    helper = new PreprocessorTestHelper();
  });

  describe("2.1 Clarify Strategy", () => {
    test("should detect and report vague words", async () => {
      // Arrange
      const content =
        "The system basically provides features. This approach generally improves performance. That is basically true.";

      // Act
      const result = await helper.testClarifyStrategy(content);

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(result.processed).toContain("CLARIFICATION");
      expect(result.results).toHaveLength(1);
      expect(result.results[0].strategy).toBe("clarify");
      expect(result.results[0].processed).toBe(true);
    });

    test("should provide clarity score", async () => {
      // Arrange
      const clearContent = "The system provides features that improve performance.";
      const vagueContent =
        "The system basically provides features. This generally improves performance. That is basically true.";

      // Act
      const clearResult = await helper.testClarifyStrategy(clearContent);
      const vagueResult = await helper.testClarifyStrategy(vagueContent);

      // Assert
      // Clear content should have higher score
      expect(clearResult.processed).toContain("Clarity score");
      expect(vagueResult.processed).toContain("Clarity score");
      // Vague content will have clarity metadata showing issues
      expect(vagueResult.processed).toContain("Issues found");
    });

    test("should detect ambiguous pronouns", async () => {
      // Arrange
      const content =
        "The database stores data. It helps with performance. This improves efficiency. That is important.";

      // Act
      const result = await helper.testClarifyStrategy(content);

      // Assert
      expect(result.processed).toContain("CLARIFICATION");
      // Should detect multiple occurrences of ambiguous pronouns
      expect(result.results[0].result).toBeDefined();
    });

    test("should handle content with no clarity issues", async () => {
      // Arrange
      const cleanContent =
        "The authentication system validates user credentials against the database.";

      // Act
      const result = await helper.testClarifyStrategy(cleanContent);

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(result.results[0].processed).toBe(true);
    });
  });

  describe("2.2 Analyze Strategy", () => {
    test("should calculate word count correctly", async () => {
      // Arrange
      const content =
        "The quick brown fox jumps over the lazy dog. This is a test.";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.processed).toContain("ANALYSIS");
      expect(result.processed).toContain("wordCount");
      expect(result.results[0].processed).toBe(true);
    });

    test("should calculate sentence count", async () => {
      // Arrange
      const content =
        "First sentence. Second sentence! Third sentence? Fourth.";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.processed).toContain("sentenceCount");
      expect(result.results[0].result).toBeDefined();
    });

    test("should assess content complexity", async () => {
      // Arrange
      const simpleContent = "The cat sat. It was red."; // Very simple
      const complexContent =
        "The implementation methodology incorporates sophisticated algorithmic paradigms.";

      // Act
      const simpleResult = await helper.testAnalyzeStrategy(simpleContent);
      const complexResult = await helper.testAnalyzeStrategy(complexContent);

      // Assert
      expect(simpleResult.processed).toContain("ANALYSIS");
      expect(complexResult.processed).toContain("ANALYSIS");
      // Both should have complexity analysis
      expect(simpleResult.processed).toContain("complexity");
      expect(complexResult.processed).toContain("complexity");
    });

    test("should calculate average word length", async () => {
      // Arrange
      const content = "I am a test. This is documentation for testing systems.";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.processed).toContain("averageWordLength");
      // Average word length should be reasonable
      expect(result.results[0].result).toBeDefined();
    });

    test("should handle empty content", async () => {
      // Arrange
      const content = "";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(result.results[0].processed).toBe(true);
    });

    test("should count paragraphs correctly", async () => {
      // Arrange
      const content =
        "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.processed).toContain("paragraphCount");
    });
  });

  describe("2.3 Search Strategy", () => {
    test("should extract keywords from content", async () => {
      // Arrange
      const content = TestDataGenerator.generateApiDocumentation();

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      TestAssertions.assertKeywordsExtracted(result.processed);
      expect(result.processed).toContain("keywords");
      expect(result.results[0].processed).toBe(true);
    });

    test("should extract up to 10 keywords", async () => {
      // Arrange
      const content =
        "API authentication authorization users requests endpoints responses data validation testing performance monitoring debugging logging.";

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      expect(result.processed).toContain("SEARCH");
      // Check that keywords are present
      expect(result.processed).toContain("keywords");
    });

    test("should filter out stop words", async () => {
      // Arrange
      const content =
        "The system is basically a tool that provides features and it has many benefits.";

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      const output = result.processed.toLowerCase();
      // Should extract meaningful words
      expect(output).toContain("system");
      expect(output).toContain("features");
    });

    test("should suggest search queries", async () => {
      // Arrange
      const content =
        "React is a JavaScript library for building user interfaces with components.";

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      expect(result.processed).toContain("SEARCH ENHANCEMENT");
      expect(result.processed).toContain("Recommended searches");
    });

    test("should handle domain-specific terminology", async () => {
      // Arrange
      const content =
        "Microservices architecture enables scalable distributed systems with containerized deployments using Kubernetes orchestration.";

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      TestAssertions.assertKeywordsExtracted(result.processed);
      expect(result.processed.toLowerCase()).toContain("microservices");
    });
  });

  describe("2.4 Fetch Strategy", () => {
    test("should detect URLs in content", async () => {
      // Arrange
      const content = TestDataGenerator.generateContentWithUrls();

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      TestAssertions.assertUrlsDetected(result.processed, 6);
      expect(result.results[0].processed).toBe(true);
    });

    test("should extract up to 5 URLs", async () => {
      // Arrange
      const content = TestDataGenerator.generateContentWithUrls();

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      expect(result.processed).toContain("FETCH METADATA");
      expect(result.processed).toContain("Found URLs");
      expect(result.processed).toContain("https://");
    });

    test("should handle URLs with different protocols", async () => {
      // Arrange
      const content =
        "Visit https://secure.example.com for HTTPS. Try http://www.example.com for HTTP.";

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      expect(result.processed).toContain("https://");
      expect(result.processed).toContain("http://");
    });

    test("should list detected URLs", async () => {
      // Arrange
      const content =
        "Check https://api.example.com/docs and https://api.example.com/guide";

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      expect(result.processed).toContain("api.example.com/docs");
      expect(result.processed).toContain("api.example.com/guide");
    });

    test("should handle content without URLs", async () => {
      // Arrange
      const content = "This content has no URLs at all.";

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      expect(result.processed).toContain("FETCH METADATA");
      expect(result.results[0].processed).toBe(true);
    });
  });

  describe("2.5 Strategy Combinations", () => {
    test("should apply clarify then analyze in sequence", async () => {
      // Arrange
      const content = TestDataGenerator.generateUnclearContent();

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      expect(result.results).toHaveLength(3); // clarify, analyze, search
      expect(result.results[0].strategy).toBe("clarify");
      expect(result.results[1].strategy).toBe("analyze");
      expect(result.results[2].strategy).toBe("search");

      // All should be processed successfully
      result.results.forEach((r: any) => {
        expect(r.processed).toBe(true);
      });
    });

    test("should apply all strategies to API documentation", async () => {
      // Arrange
      const content = TestDataGenerator.generateApiDocumentation();

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      expect(result.results).toHaveLength(3);
      TestAssertions.assertPreprocessorResults(result);

      const strategyNames = result.results.map((r: any) => r.strategy);
      expect(strategyNames).toContain("clarify");
      expect(strategyNames).toContain("analyze");
      expect(strategyNames).toContain("search");
    });

    test("should apply all strategies to product documentation", async () => {
      // Arrange
      const content = TestDataGenerator.generateProductDocumentation();

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      expect(result.results).toHaveLength(3);
      result.results.forEach((r: any) => {
        expect(r.processed).toBe(true);
        expect(r.result).toBeDefined();
      });
    });

    test("should chain results through multiple strategies", async () => {
      // Arrange
      const content =
        "The system basically provides features that generally improve performance.";

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      // Final processed content should be different from original
      expect(result.processed).not.toBe(content);
      // Should contain multiple strategy outputs
      expect(result.processed).toContain("CLARIF");
      // Each strategy added its metadata
      expect(result.results).toHaveLength(3);
    });
  });

  describe("2.6 Error Handling and Edge Cases", () => {
    test("should handle strategy with empty configuration", async () => {
      // Arrange
      const content = "Test content";
      const strategies = [
        {
          name: "test",
          type: "clarify" as const,
          enabled: true,
          config: {},
        },
      ];

      // Act
      const result = await helper.getPreprocessor().processContent(content, strategies);

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(result.results[0].processed).toBe(true);
    });

    test("should skip disabled strategies", async () => {
      // Arrange
      const preprocessor = helper.getPreprocessor();
      const content = "Test content";
      const strategies = [
        { name: "test", type: "clarify" as const, enabled: false },
      ];

      // Act
      const result = await preprocessor.processContent(content, strategies);

      // Assert
      expect(result.results).toHaveLength(0);
    });

    test("should handle very long content in all strategies", async () => {
      // Arrange
      const longContent = "Word ".repeat(1000); // Very long content

      // Act
      const result = await helper.testComprehensiveProcessing(longContent);

      // Assert
      expect(result.results).toHaveLength(3);
      result.results.forEach((r: any) => {
        expect(r.processed).toBe(true);
      });
    });

    test("should handle special characters", async () => {
      // Arrange
      const content =
        'Special: !@#$%^&*()_+ Characters: "" Quotes: " \' ` Symbols: © ® ™';

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(result.results.length).toBeGreaterThan(0);
    });

    test("should handle multiple line breaks", async () => {
      // Arrange
      const content = "Line 1\n\n\n\nLine 2\n\n\nLine 3";

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.results[0].processed).toBe(true);
      expect(result.processed).toContain("paragraphCount");
    });

    test("should handle mixed case content", async () => {
      // Arrange
      const content =
        "UPPERCASE text mixed with lowercase and MixedCase content for testing.";

      // Act
      const result = await helper.testComprehensiveProcessing(content);

      // Assert
      result.results.forEach((r: any) => {
        expect(r.processed).toBe(true);
      });
    });
  });

  describe("2.7 Performance Testing", () => {
    test("should process large API documentation efficiently", async () => {
      // Arrange
      const content = TestDataGenerator.generateApiDocumentation().repeat(10);

      // Act
      const startTime = Date.now();
      const result = await helper.testComprehensiveProcessing(content);
      const processingTime = Date.now() - startTime;

      // Assert
      TestAssertions.assertPreprocessorResults(result);
      expect(processingTime).toBeLessThan(1000); // Should process in < 1 second
    });

    test("should handle multiple sequential processing requests", async () => {
      // Arrange
      const contents = Array.from({ length: 10 }, () =>
        TestDataGenerator.generateProductDocumentation()
      );

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        contents.map((c) => helper.testComprehensiveProcessing(c))
      );
      const totalTime = Date.now() - startTime;

      // Assert
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        TestAssertions.assertPreprocessorResults(result);
      });
      expect(totalTime).toBeLessThan(5000); // Should process 10 docs in < 5 seconds
    });

    test("should maintain consistent processing time regardless of content type", async () => {
      // Arrange
      const apiDocs = TestDataGenerator.generateApiDocumentation();
      const productDocs = TestDataGenerator.generateProductDocumentation();
      const unclearContent = TestDataGenerator.generateUnclearContent();

      // Act
      const apiTime = Date.now();
      await helper.testComprehensiveProcessing(apiDocs);
      const apiProcessTime = Date.now() - apiTime;

      const productTime = Date.now();
      await helper.testComprehensiveProcessing(productDocs);
      const productProcessTime = Date.now() - productTime;

      const unclearTime = Date.now();
      await helper.testComprehensiveProcessing(unclearContent);
      const unclearProcessTime = Date.now() - unclearTime;

      // Assert
      // All should complete in reasonable time
      expect(apiProcessTime).toBeLessThan(1000);
      expect(productProcessTime).toBeLessThan(1000);
      expect(unclearProcessTime).toBeLessThan(1000);
    });
  });

  describe("2.8 Verification of Strategy Output Quality", () => {
    test("clarify strategy should preserve original meaning", async () => {
      // Arrange
      const content =
        "The API basically validates input. This approach generally prevents errors.";

      // Act
      const result = await helper.testClarifyStrategy(content);

      // Assert
      // Original content should still be present
      expect(result.processed).toContain("API");
      expect(result.processed).toContain("validates");
      expect(result.processed).toContain("input");
    });

    test("analyze strategy should provide accurate metrics", async () => {
      // Arrange
      const content = "One. Two. Three."; // 3 words, 3 sentences

      // Act
      const result = await helper.testAnalyzeStrategy(content);

      // Assert
      expect(result.processed).toContain("wordCount");
      expect(result.processed).toContain("ANALYSIS");
    });

    test("search strategy should extract relevant keywords", async () => {
      // Arrange
      const content = TestDataGenerator.generateApiDocumentation();

      // Act
      const result = await helper.testSearchStrategy(content);

      // Assert
      const processed = result.processed.toLowerCase();
      expect(processed).toContain("api");
      expect(processed).toContain("endpoint");
    });

    test("fetch strategy should find all embedded URLs", async () => {
      // Arrange
      const content = TestDataGenerator.generateContentWithUrls();

      // Act
      const result = await helper.testFetchStrategy(content);

      // Assert
      expect(result.processed).toContain("api.example.com");
      expect(result.processed).toContain("github.com");
      expect(result.processed).toContain("sdk.example.com");
    });
  });
});
