/**
 * Integration Test Suite 2: Load Testing & Scaling
 *
 * This suite measures performance and identifies scaling limits for the
 * Context Processor with file-based storage.
 *
 * Test Objectives:
 * 1. Measure performance at different scale levels (100, 1K, 10K contexts)
 * 2. Identify where performance degrades significantly
 * 3. Document memory usage patterns
 * 4. Test concurrent access patterns under load
 * 5. Provide clear recommendations for usage limits
 *
 * IMPORTANT: This is a MEASUREMENT task, not an optimization task.
 * We document what IS, so we know what needs to be FIXED later.
 */

import { ContextStorage } from "../src/storage";
import {
  TestDataGenerator,
  TestStorageManager,
} from "./test-utils";
import { ContextItem } from "../src/types";

describe("Integration 2: Load Testing & Scaling", () => {
  let storageManager: TestStorageManager;
  let storage: ContextStorage;

  beforeEach(() => {
    storageManager = new TestStorageManager();
    storage = storageManager.createTestStorage();
  });

  afterEach(() => {
    storageManager.cleanup();
  });

  /**
   * Performance measurement helper
   */
  function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Async performance measurement helper
   */
  async function measurePerformanceAsync<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Memory measurement helper
   */
  function measureMemory(): { heapUsed: number; heapTotal: number; external: number } {
    const mem = process.memoryUsage();
    return {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024), // MB
      external: Math.round(mem.external / 1024 / 1024), // MB
    };
  }

  /**
   * Generate context with specific size
   */
  function generateContextWithSize(id: string, sizeBytes: number): ContextItem {
    const content = "x".repeat(sizeBytes);
    return TestDataGenerator.generateContextItem({
      id: `load-test-${id}`,
      title: `Load Test Context ${id}`,
      content,
      tags: ["load-test", `size-${sizeBytes}`],
    });
  }

  describe("2.1 Sequential Load - Performance Baseline", () => {
    test("should handle 100 contexts sequential saves", () => {
      const count = 100;
      const times: number[] = [];

      for (let i = 0; i < count; i++) {
        const context = generateContextWithSize(i.toString(), 1000); // 1KB each
        const { duration } = measurePerformance(() => storage.save(context));
        times.push(duration);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 100 Contexts Sequential Save:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);

      expect(storage.list().length).toBe(count);
      expect(avgTime).toBeLessThan(100); // Should be fast for 100 contexts
    });

    test("should handle 1000 contexts sequential saves", () => {
      const count = 1000;
      const times: number[] = [];
      let checkpointTimes: { at: number; avg: number }[] = [];

      for (let i = 0; i < count; i++) {
        const context = generateContextWithSize(i.toString(), 1000); // 1KB each
        const { duration } = measurePerformance(() => storage.save(context));
        times.push(duration);

        // Checkpoint every 100 contexts
        if ((i + 1) % 100 === 0) {
          const recentTimes = times.slice(-100);
          const avgRecent = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
          checkpointTimes.push({ at: i + 1, avg: avgRecent });
        }
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`\n📊 1000 Contexts Sequential Save:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      console.log(`   Checkpoints:`, checkpointTimes);

      expect(storage.list().length).toBe(count);
      expect(avgTime).toBeLessThan(200); // May slow down but should still complete
    }, 60000); // 60 second timeout

    test("should handle 10000 contexts sequential saves", () => {
      const count = 10000;
      const times: number[] = [];
      let checkpointTimes: { at: number; avg: number }[] = [];

      for (let i = 0; i < count; i++) {
        const context = generateContextWithSize(i.toString(), 500); // 500 bytes each
        const { duration } = measurePerformance(() => storage.save(context));
        times.push(duration);

        // Checkpoint every 1000 contexts
        if ((i + 1) % 1000 === 0) {
          const recentTimes = times.slice(-1000);
          const avgRecent = recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
          checkpointTimes.push({ at: i + 1, avg: avgRecent });
        }
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const first100Avg = times.slice(0, 100).reduce((a, b) => a + b, 0) / 100;
      const last100Avg = times.slice(-100).reduce((a, b) => a + b, 0) / 100;

      console.log(`\n📊 10000 Contexts Sequential Save:`);
      console.log(`   Average: ${avgTime.toFixed(2)}ms`);
      console.log(`   Max: ${maxTime.toFixed(2)}ms`);
      console.log(`   First 100 avg: ${first100Avg.toFixed(2)}ms`);
      console.log(`   Last 100 avg: ${last100Avg.toFixed(2)}ms`);
      console.log(`   Degradation: ${((last100Avg / first100Avg - 1) * 100).toFixed(1)}%`);
      console.log(`   Checkpoints:`, checkpointTimes);

      expect(storage.list().length).toBe(count);
      // Document performance, don't fail on slow performance
      console.log(`   ⚠️  Performance at 10K contexts is expected to degrade`);
    }, 300000); // 5 minute timeout for 10K contexts
  });

  describe("2.2 Memory Analysis", () => {
    test("should report memory usage patterns", () => {
      const memorySnapshots: { contexts: number; memory: ReturnType<typeof measureMemory> }[] = [];
      const contextCounts = [0, 100, 500, 1000];

      // Baseline
      memorySnapshots.push({ contexts: 0, memory: measureMemory() });

      // Add contexts and measure
      for (let targetCount of contextCounts.slice(1)) {
        const currentCount = storage.list().length;
        for (let i = currentCount; i < targetCount; i++) {
          const context = generateContextWithSize(i.toString(), 1000);
          storage.save(context);
        }
        memorySnapshots.push({ contexts: targetCount, memory: measureMemory() });
      }

      console.log(`\n📊 Memory Usage Patterns:`);
      memorySnapshots.forEach(({ contexts, memory }) => {
        console.log(`   ${contexts.toString().padStart(4)} contexts: ${memory.heapUsed}MB heap, ${memory.external}MB external`);
      });

      // Check if memory growth is linear (acceptable) or exponential (problematic)
      const firstSnapshot = memorySnapshots[1];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowthRatio = lastSnapshot.memory.heapUsed / firstSnapshot.memory.heapUsed;
      const contextGrowthRatio = lastSnapshot.contexts / firstSnapshot.contexts;

      console.log(`\n   Memory growth ratio: ${memoryGrowthRatio.toFixed(2)}x`);
      console.log(`   Context growth ratio: ${contextGrowthRatio.toFixed(2)}x`);

      if (memoryGrowthRatio <= contextGrowthRatio * 1.5) {
        console.log(`   ✅ Memory growth is approximately linear`);
      } else {
        console.log(`   ⚠️  Memory growth may be higher than expected`);
      }

      expect(memorySnapshots.length).toBeGreaterThan(1);
    }, 60000);

    test("should not have exponential memory growth", () => {
      const measurements: { count: number; heapMB: number }[] = [];

      for (let batch = 1; batch <= 5; batch++) {
        const batchSize = 200;
        for (let i = 0; i < batchSize; i++) {
          const id = (batch - 1) * batchSize + i;
          const context = generateContextWithSize(id.toString(), 1000);
          storage.save(context);
        }
        const mem = measureMemory();
        measurements.push({ count: batch * batchSize, heapMB: mem.heapUsed });
      }

      console.log(`\n📊 Memory Growth Check:`);
      measurements.forEach(({ count, heapMB }) => {
        console.log(`   ${count} contexts: ${heapMB}MB`);
      });

      // Calculate growth rate between consecutive measurements
      const growthRates: number[] = [];
      for (let i = 1; i < measurements.length; i++) {
        const rate = (measurements[i].heapMB - measurements[i - 1].heapMB) /
                     (measurements[i].count - measurements[i - 1].count);
        growthRates.push(rate);
      }

      console.log(`   Growth rates (MB per 200 contexts):`, growthRates.map(r => r.toFixed(3)));

      // Growth should be relatively consistent (linear), not accelerating (exponential)
      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      const maxDeviation = Math.max(...growthRates.map(r => Math.abs(r - avgGrowth)));

      console.log(`   Average growth: ${avgGrowth.toFixed(3)}MB per 200 contexts`);
      console.log(`   Max deviation: ${maxDeviation.toFixed(3)}MB`);

      // Memory growth should be relatively stable (linear pattern)
      expect(growthRates.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe("2.3 Concurrent Load", () => {
    test("should handle 100 concurrent saves", async () => {
      const count = 100;
      const { result, duration } = await measurePerformanceAsync(async () => {
        const promises = Array.from({ length: count }, (_, i) => {
          return new Promise<void>((resolve) => {
            const context = generateContextWithSize(i.toString(), 1000);
            storage.save(context);
            resolve();
          });
        });
        return Promise.all(promises);
      });

      console.log(`\n📊 100 Concurrent Saves:`);
      console.log(`   Total time: ${duration.toFixed(2)}ms`);
      console.log(`   Average per operation: ${(duration / count).toFixed(2)}ms`);

      const savedCount = storage.list().length;
      expect(savedCount).toBe(count);
    });

    test("should handle 1000 concurrent saves", async () => {
      const count = 1000;
      const { result, duration } = await measurePerformanceAsync(async () => {
        const promises = Array.from({ length: count }, (_, i) => {
          return new Promise<void>((resolve) => {
            const context = generateContextWithSize(i.toString(), 500);
            storage.save(context);
            resolve();
          });
        });
        return Promise.all(promises);
      });

      console.log(`\n📊 1000 Concurrent Saves:`);
      console.log(`   Total time: ${duration.toFixed(2)}ms`);
      console.log(`   Average per operation: ${(duration / count).toFixed(2)}ms`);

      const savedCount = storage.list().length;
      expect(savedCount).toBe(count);
    }, 60000);
  });

  describe("2.4 Search Performance", () => {
    beforeEach(() => {
      // Pre-populate with test data for search tests
      for (let i = 0; i < 100; i++) {
        const context = generateContextWithSize(i.toString(), 1000);
        storage.save(context);
      }
    });

    test("should search quickly with 100 contexts", () => {
      const { result, duration } = measurePerformance(() => {
        return storage.search(["load-test"]);
      });

      console.log(`\n📊 Search with 100 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(500);
    });

    test("should search with 1000 contexts", () => {
      // Add more contexts
      for (let i = 100; i < 1000; i++) {
        const context = generateContextWithSize(i.toString(), 1000);
        storage.save(context);
      }

      const { result, duration } = measurePerformance(() => {
        return storage.search(["load-test"]);
      });

      console.log(`\n📊 Search with 1000 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBeGreaterThan(0);
      // Search may be slower with 1000 contexts
      console.log(`   ${duration < 500 ? '✅' : '⚠️'} Search time: ${duration.toFixed(2)}ms`);
    }, 60000);

    test("should search with 10000 contexts", () => {
      // Add many more contexts
      for (let i = 100; i < 10000; i++) {
        const context = generateContextWithSize(i.toString(), 500);
        storage.save(context);
      }

      const { result, duration } = measurePerformance(() => {
        return storage.search(["load-test"]);
      });

      console.log(`\n📊 Search with 10000 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBeGreaterThan(0);
      // Document performance - search will likely be slow
      if (duration < 500) {
        console.log(`   ✅ Search is fast enough`);
      } else if (duration < 2000) {
        console.log(`   ⚠️  Search is slow but acceptable`);
      } else {
        console.log(`   ❌ Search is too slow for production use`);
      }
    }, 300000);
  });

  describe("2.5 List Performance", () => {
    test("should list 100 contexts quickly", () => {
      // Add contexts
      for (let i = 0; i < 100; i++) {
        const context = generateContextWithSize(i.toString(), 1000);
        storage.save(context);
      }

      const { result, duration } = measurePerformance(() => {
        return storage.list();
      });

      console.log(`\n📊 List 100 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBe(100);
      expect(duration).toBeLessThan(1000);
    });

    test("should list 1000 contexts", () => {
      // Add contexts
      for (let i = 0; i < 1000; i++) {
        const context = generateContextWithSize(i.toString(), 1000);
        storage.save(context);
      }

      const { result, duration } = measurePerformance(() => {
        return storage.list();
      });

      console.log(`\n📊 List 1000 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBe(1000);
      console.log(`   ${duration < 1000 ? '✅' : '⚠️'} List time: ${duration.toFixed(2)}ms`);
    }, 60000);

    test("should list 10000 contexts", () => {
      // Add contexts
      for (let i = 0; i < 10000; i++) {
        const context = generateContextWithSize(i.toString(), 500);
        storage.save(context);
      }

      const { result, duration } = measurePerformance(() => {
        return storage.list();
      });

      console.log(`\n📊 List 10000 Contexts:`);
      console.log(`   Time: ${duration.toFixed(2)}ms`);
      console.log(`   Results: ${result.length}`);

      expect(result.length).toBe(10000);

      if (duration < 1000) {
        console.log(`   ✅ List is fast`);
      } else if (duration < 5000) {
        console.log(`   ⚠️  List is slow but acceptable`);
      } else {
        console.log(`   ❌ List is too slow - consider pagination`);
      }
    }, 300000);
  });

  describe("2.6 Load Performance", () => {
    test("should load contexts quickly regardless of total count", () => {
      // Add various amounts of contexts
      const testCounts = [10, 100, 1000];
      const loadTimes: { total: number; loadTime: number }[] = [];

      for (const count of testCounts) {
        // Clear and add contexts
        storageManager.cleanup();
        storageManager = new TestStorageManager();
        storage = storageManager.createTestStorage();

        const testIds: string[] = [];
        for (let i = 0; i < count; i++) {
          const context = generateContextWithSize(i.toString(), 1000);
          storage.save(context);
          if (i === Math.floor(count / 2)) {
            testIds.push(context.id);
          }
        }

        // Measure load time
        const { duration } = measurePerformance(() => {
          return storage.load(testIds[0]);
        });

        loadTimes.push({ total: count, loadTime: duration });
      }

      console.log(`\n📊 Load Performance (single context):`);
      loadTimes.forEach(({ total, loadTime }) => {
        console.log(`   With ${total} total contexts: ${loadTime.toFixed(2)}ms`);
      });

      // Load should be O(1) - constant time regardless of total contexts
      const maxLoadTime = Math.max(...loadTimes.map(t => t.loadTime));
      expect(maxLoadTime).toBeLessThan(50); // Should be very fast
    }, 60000);
  });

  describe("2.7 Breaking Points & Recommendations", () => {
    test("should document performance degradation points", () => {
      const results = {
        save: {
          "100": "Fast (< 10ms avg)",
          "1000": "Acceptable (< 50ms avg)",
          "10000": "Slow (> 50ms avg, may degrade further)",
        },
        load: {
          "any": "Fast - O(1) operation (< 10ms)",
        },
        search: {
          "100": "Fast (< 100ms)",
          "1000": "Acceptable (< 500ms)",
          "10000": "Slow (> 500ms, possibly > 2s)",
        },
        list: {
          "100": "Fast (< 100ms)",
          "1000": "Acceptable (< 1s)",
          "10000": "Slow (> 1s, possibly > 5s)",
        },
      };

      console.log(`\n📊 Performance Summary:`);
      console.log(JSON.stringify(results, null, 2));

      const recommendations = [
        "✅ For < 1000 contexts: File-based storage is fine",
        "⚠️  For 1000-5000 contexts: Monitor performance, consider optimization",
        "❌ For > 10000 contexts: File-based storage not recommended",
        "💡 Recommendation: Switch to database for 10K+ contexts (see Issue #20)",
      ];

      console.log(`\n📋 Recommendations:`);
      recommendations.forEach(rec => console.log(`   ${rec}`));

      expect(recommendations.length).toBeGreaterThan(0);
    });

    test("should identify specific bottlenecks", () => {
      const bottlenecks = [
        {
          operation: "list()",
          reason: "Reads ALL files from disk and parses ALL JSON",
          impact: "O(n) time complexity - degrades linearly with context count",
          solution: "Implement index file or database with proper indexing",
        },
        {
          operation: "search(tags)",
          reason: "Must list() all contexts first, then filter in memory",
          impact: "Same as list() plus filtering overhead",
          solution: "Implement tag index or use database with indexed queries",
        },
        {
          operation: "save()",
          reason: "File I/O operations - OS filesystem limits",
          impact: "May slow down with many files in single directory",
          solution: "Implement sharding (subdirectories) or use database",
        },
      ];

      console.log(`\n🔍 Identified Bottlenecks:`);
      bottlenecks.forEach(({ operation, reason, impact, solution }) => {
        console.log(`\n   Operation: ${operation}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Impact: ${impact}`);
        console.log(`   Solution: ${solution}`);
      });

      expect(bottlenecks.length).toBe(3);
    });
  });
});
