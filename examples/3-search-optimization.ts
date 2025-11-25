/**
 * Example 3: Search Optimization
 *
 * This example demonstrates how to use the "search_optimized" model
 * to enhance content discoverability through keyword extraction.
 */

import { ContextProcessor } from "../dist/index.js";

async function searchOptimization() {
  const processor = new ContextProcessor();

  // Create multiple documents optimized for search
  const documents = [
    {
      title: "TypeScript Basics",
      content: "TypeScript is a typed superset of JavaScript. It adds static types to help catch errors early.",
      tags: ["typescript", "javascript", "programming-language"],
      category: "tutorial"
    },
    {
      title: "Async/Await Patterns",
      content: "Async functions and await expressions provide a cleaner way to work with promises.",
      tags: ["javascript", "async", "promises", "patterns"],
      category: "guide"
    },
    {
      title: "React Hooks",
      content: "Hooks let you use state and other React features without writing class components.",
      tags: ["react", "javascript", "hooks", "functional-programming"],
      category: "tutorial"
    }
  ];

  console.log("Saving documents with search_optimized model...\n");

  const results = [];
  for (const doc of documents) {
    const saved = processor.save(
      {
        title: doc.title,
        content: doc.content,
        tags: doc.tags,
        metadata: { category: doc.category }
      },
      "search_optimized"
    );
    results.push(saved);
    console.log(`✓ Saved: ${doc.title}`);
  }

  console.log("\n--- Search Examples ---\n");

  // Search by single tag
  console.log("1. Search for 'javascript' tag:");
  const jsResults = processor.search({ tags: ["javascript"] });
  jsResults.forEach((doc) => {
    console.log(`   - ${doc.title}`);
  });

  // Search with multiple tags (AND logic)
  console.log("\n2. Search for both 'javascript' AND 'async' tags:");
  const asyncResults = processor.search({
    tags: ["javascript", "async"]
  });
  asyncResults.forEach((doc) => {
    console.log(`   - ${doc.title}`);
  });

  // List and filter by metadata
  console.log("\n3. Filter by metadata (category: 'tutorial'):");
  const tutorials = processor.list().filter((doc) => doc.metadata?.category === "tutorial");
  tutorials.forEach((doc) => {
    console.log(`   - ${doc.title}`);
  });

  // Get model info
  console.log("\n4. Search Optimized Model Details:");
  const modelInfo = processor.getModelInfo("search_optimized");
  console.log(`   Strategies: ${modelInfo.strategies.join(", ")}`);
  console.log(`   Description: ${modelInfo.description}`);

  // Cleanup
  console.log("\n--- Cleanup ---");
  results.forEach((doc) => processor.delete(doc.id));
  console.log(`✓ Deleted ${results.length} documents`);
}

searchOptimization().catch(console.error);
