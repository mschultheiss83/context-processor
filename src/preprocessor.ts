import { PreProcessingStrategy, PreProcessingResult } from "./types.js";

/**
 * Pre-processor for context enhancement through various strategies
 */
export class ContextPreprocessor {
  private strategies: Map<string, PreProcessingStrategy> = new Map();

  registerStrategy(strategy: PreProcessingStrategy): void {
    this.strategies.set(strategy.name, strategy);
  }

  async processContent(
    content: string,
    strategies: PreProcessingStrategy[]
  ): Promise<{
    processed: string;
    results: PreProcessingResult[];
  }> {
    const results: PreProcessingResult[] = [];
    let processedContent = content;

    for (const strategy of strategies) {
      if (!strategy.enabled) continue;

      try {
        const result = await this.executeStrategy(
          strategy,
          processedContent
        );
        results.push(result);

        if (result.result) {
          processedContent = result.result;
        }
      } catch (error) {
        results.push({
          strategy: strategy.name,
          processed: false,
          error: String(error),
        });
      }
    }

    return { processed: processedContent, results };
  }

  private async executeStrategy(
    strategy: PreProcessingStrategy,
    content: string
  ): Promise<PreProcessingResult> {
    switch (strategy.type) {
      case "clarify":
        return this.clarifySemanticsStrategy(content, strategy.config);
      case "search":
        return this.enhanceWithSearchStrategy(content, strategy.config);
      case "analyze":
        return this.analyzeContentStrategy(content, strategy.config);
      case "fetch":
        return this.fetchAdditionalDataStrategy(content, strategy.config);
      case "custom":
        return this.customStrategy(content, strategy.config);
      default:
        return {
          strategy: strategy.name,
          processed: false,
          error: "Unknown strategy type",
        };
    }
  }

  private clarifySemanticsStrategy(
    content: string,
    config?: Record<string, unknown>
  ): PreProcessingResult {
    try {
      const clarityScan = this.analyzeClarity(content);

      const clarifiedContent = this.improveClarity(content, clarityScan);

      return {
        strategy: "clarify",
        processed: true,
        result: `[CLARIFICATION METADATA]\nOriginal length: ${content.length} chars\nClarity score: ${clarityScan.score}/100\nIssues found: ${clarityScan.issues.length}\n[CLARIFIED CONTENT]\n${clarifiedContent}`,
      };
    } catch (error) {
      return {
        strategy: "clarify",
        processed: false,
        error: String(error),
      };
    }
  }

  private analyzeClarity(content: string): {
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    // Check for ambiguous pronouns
    const pronounMatches = content.match(/\b(it|this|that|they)\b/gi);
    if (pronounMatches && pronounMatches.length > 5) {
      issues.push("Multiple ambiguous pronouns detected");
      score -= 10;
    }

    // Check for passive voice
    const passiveMatches = content.match(/\b(is|are|was|were)\s+\w+ed\b/gi);
    if (passiveMatches && passiveMatches.length > 3) {
      issues.push("Heavy use of passive voice");
      score -= 5;
    }

    // Check for vague language
    const vagueWords =
      content.match(/\b(basically|generally|usually|kind of|sort of)\b/gi) ||
      [];
    if (vagueWords.length > 0) {
      issues.push(`Found ${vagueWords.length} vague word(s)`);
      score -= vagueWords.length * 2;
    }

    return { score: Math.max(0, score), issues };
  }

  private improveClarity(
    content: string,
    _clarityScan: { score: number; issues: string[] }
  ): string {
    let improved = content;

    // Suggest replacements for vague words
    improved = improved.replace(/\bbasically\b/gi, "specifically");
    improved = improved.replace(/\bkind of\b/gi, "");
    improved = improved.replace(/\bsort of\b/gi, "");

    return improved;
  }

  private enhanceWithSearchStrategy(
    content: string,
    config?: Record<string, unknown>
  ): PreProcessingResult {
    try {
      const keywords = this.extractKeywords(content);
      const searchQueries = keywords.slice(0, 3);

      return {
        strategy: "search",
        processed: true,
        result: `[SEARCH ENHANCEMENT]\nExtracted keywords: ${searchQueries.join(", ")}\nRecommended searches: ${searchQueries.map((k) => `"${k}"`).join(", ")}\n[ORIGINAL CONTENT]\n${content}`,
      };
    } catch (error) {
      return {
        strategy: "search",
        processed: false,
        error: String(error),
      };
    }
  }

  private extractKeywords(content: string): string[] {
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (word) =>
          word.length > 4 && !this.isStopWord(word.replace(/[^a-z]/g, ""))
      );

    const frequency: Record<string, number> = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private isStopWord(word: string): boolean {
    const stopWords = [
      "the",
      "and",
      "that",
      "with",
      "from",
      "have",
      "this",
      "been",
      "more",
      "which",
    ];
    return stopWords.includes(word);
  }

  private analyzeContentStrategy(
    content: string,
    config?: Record<string, unknown>
  ): PreProcessingResult {
    try {
      const analysis = {
        wordCount: content.split(/\s+/).length,
        sentenceCount: content.split(/[.!?]+/).length,
        paragraphCount: content.split(/\n\n+/).length,
        averageWordLength: this.calculateAvgWordLength(content),
        complexity: this.assessComplexity(content),
      };

      return {
        strategy: "analyze",
        processed: true,
        result: `[CONTENT ANALYSIS]\n${JSON.stringify(analysis, null, 2)}\n[ORIGINAL CONTENT]\n${content}`,
      };
    } catch (error) {
      return {
        strategy: "analyze",
        processed: false,
        error: String(error),
      };
    }
  }

  private calculateAvgWordLength(content: string): number {
    const words = content.split(/\s+/);
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return totalLength / words.length;
  }

  private assessComplexity(content: string): string {
    const avgWordLength = this.calculateAvgWordLength(content);
    if (avgWordLength > 6) return "high";
    if (avgWordLength > 4) return "medium";
    return "low";
  }

  private fetchAdditionalDataStrategy(
    content: string,
    config?: Record<string, unknown>
  ): PreProcessingResult {
    try {
      const urls = this.extractUrls(content);

      return {
        strategy: "fetch",
        processed: true,
        result: `[FETCH METADATA]\nFound URLs: ${urls.length}\nURLs: ${urls.join(", ")}\n[ORIGINAL CONTENT]\n${content}`,
      };
    } catch (error) {
      return {
        strategy: "fetch",
        processed: false,
        error: String(error),
      };
    }
  }

  private extractUrls(content: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return (content.match(urlRegex) || []).slice(0, 5);
  }

  private customStrategy(
    content: string,
    config?: Record<string, unknown>
  ): PreProcessingResult {
    try {
      if (!config || !config.processor) {
        return {
          strategy: "custom",
          processed: false,
          error: "No custom processor function provided",
        };
      }

      return {
        strategy: "custom",
        processed: true,
        result: content,
      };
    } catch (error) {
      return {
        strategy: "custom",
        processed: false,
        error: String(error),
      };
    }
  }
}
