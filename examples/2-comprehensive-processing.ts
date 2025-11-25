/**
 * Example 2: Comprehensive Processing
 *
 * This example shows how to use the "comprehensive" model to apply
 * all preprocessing strategies (clarify, analyze, search, fetch).
 */

import { ContextProcessor } from "../dist/index.js";

async function comprehensiveProcessing() {
  const processor = new ContextProcessor();

  const blogPost = `
    The Future of Web Development

    Web development is constantly evolving, and new technologies emerge regularly.
    Generally speaking, the landscape is shifting towards more efficient and maintainable solutions.
    That said, the fundamentals remain important. Basically, developers need to understand HTTP,
    DOM, and JavaScript. Nowadays, frameworks like React, Vue, and Angular make building
    complex applications easier. However, selecting the right tool depends on your specific
    project requirements.

    For more information, check out https://developer.mozilla.org/
  `;

  console.log("Processing content with 'comprehensive' model...\n");

  const result = processor.save(
    {
      title: "The Future of Web Development",
      content: blogPost.trim(),
      tags: ["web-dev", "technology", "trends"],
      metadata: {
        type: "blog-post",
        author: "developer",
        published: new Date().toISOString()
      }
    },
    "comprehensive"
  );

  console.log("Results:\n");
  console.log(`ID: ${result.id}`);
  console.log(`Title: ${result.title}`);
  console.log(`Tags: ${result.tags.join(", ")}`);
  console.log(`Created: ${new Date(result.createdAt).toLocaleString()}`);

  if (result.processedContent) {
    console.log("\n--- Processed Content ---");
    console.log(result.processedContent);
  }

  console.log("\n--- Available Models ---");
  const models = processor.listModels();
  models.forEach((model) => {
    console.log(`\n${model.name}:`);
    console.log(`  Description: ${model.description}`);
    console.log(`  Strategies: ${model.strategies.join(", ")}`);
  });
}

comprehensiveProcessing().catch(console.error);
