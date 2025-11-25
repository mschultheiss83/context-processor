/**
 * Example 1: Basic Usage
 *
 * This example demonstrates how to save, load, and list contexts
 * using the Context Processor.
 */

import { ContextProcessor } from "../dist/index.js";

async function basicUsage() {
  // Initialize the processor (creates ./contexts directory if it doesn't exist)
  const processor = new ContextProcessor();

  // Save a simple context
  console.log("1. Saving a context...");
  const saved = processor.save({
    title: "Getting Started with React",
    content: "React is a JavaScript library for building user interfaces with components.",
    tags: ["react", "javascript", "frontend"],
    metadata: {
      difficulty: "beginner",
      category: "tutorial"
    }
  });

  console.log(`✓ Context saved with ID: ${saved.id}\n`);

  // Load the context back
  console.log("2. Loading the context...");
  const loaded = processor.load(saved.id);
  console.log(`✓ Loaded: "${loaded.title}"\n`);

  // List all contexts
  console.log("3. Listing all contexts...");
  const all = processor.list();
  console.log(`✓ Total contexts: ${all.length}`);
  all.forEach((ctx) => {
    console.log(`   - ${ctx.title}`);
  });
  console.log("");

  // Search by tags
  console.log("4. Searching by tags...");
  const results = processor.search({ tags: ["react"] });
  console.log(`✓ Found ${results.length} context(s) with tag "react"\n`);

  // Delete the context
  console.log("5. Deleting the context...");
  processor.delete(saved.id);
  console.log(`✓ Context deleted\n`);

  console.log("Done! All basic operations completed successfully.");
}

// Run the example
basicUsage().catch(console.error);
