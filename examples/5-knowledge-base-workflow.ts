/**
 * Example 5: Knowledge Base Workflow
 *
 * This example demonstrates a complete workflow for building
 * and maintaining a knowledge base with intelligent organization.
 */

import { ContextProcessor } from "../dist/index.js";

async function knowledgeBaseWorkflow() {
  const processor = new ContextProcessor();

  console.log("=== Knowledge Base Workflow ===\n");

  // Step 1: Create knowledge base entries
  console.log("Step 1: Adding articles to knowledge base...");

  const articles = [
    {
      title: "How to Install Node.js",
      content:
        "Node.js is a JavaScript runtime. Download from nodejs.org, run the installer, and verify with 'node --version'.",
      category: "getting-started",
      difficulty: "beginner",
      tags: ["nodejs", "installation", "setup"]
    },
    {
      title: "Understanding Callbacks and Promises",
      content:
        "Callbacks are functions passed to other functions. Promises provide a cleaner alternative for async operations. Generally, promises are preferred in modern JavaScript.",
      category: "concepts",
      difficulty: "intermediate",
      tags: ["javascript", "async", "promises", "callbacks"]
    },
    {
      title: "Building REST APIs with Express",
      content:
        "Express is a minimal Node.js framework. It handles routing, middleware, and request/response management. That said, choosing the right architecture depends on your needs.",
      category: "backend",
      difficulty: "intermediate",
      tags: ["nodejs", "express", "rest-api", "backend"]
    },
    {
      title: "Advanced TypeScript Patterns",
      content:
        "TypeScript offers advanced features like generics, decorators, and conditional types. These patterns help create maintainable and type-safe code.",
      category: "advanced",
      difficulty: "advanced",
      tags: ["typescript", "programming", "patterns"]
    }
  ];

  const savedIds = [];
  for (const article of articles) {
    const saved = processor.save(
      {
        title: article.title,
        content: article.content,
        tags: article.tags,
        metadata: {
          category: article.category,
          difficulty: article.difficulty,
          createdAt: new Date().toISOString()
        }
      },
      "clarify" // Use clarify model for documentation
    );
    savedIds.push(saved.id);
    console.log(`  ✓ ${article.title}`);
  }
  console.log("");

  // Step 2: Organize by category
  console.log("Step 2: Organizing by category...");
  const categories = new Map<string, any[]>();

  processor.list().forEach((doc) => {
    const cat = doc.metadata?.category || "uncategorized";
    if (!categories.has(cat)) {
      categories.set(cat, []);
    }
    categories.get(cat)!.push(doc);
  });

  categories.forEach((docs, category) => {
    console.log(`  ${category.toUpperCase()} (${docs.length} articles)`);
    docs.forEach((doc) => {
      const difficulty = doc.metadata?.difficulty || "unknown";
      console.log(`    - ${doc.title} [${difficulty}]`);
    });
  });
  console.log("");

  // Step 3: Search for related content
  console.log("Step 3: Finding related content...");
  console.log("  Articles about 'javascript':");
  const jsArticles = processor.search({ tags: ["javascript"] });
  jsArticles.forEach((doc) => {
    console.log(`    - ${doc.title}`);
  });
  console.log("");

  // Step 4: Find beginner-friendly content
  console.log("Step 4: Beginner-friendly resources:");
  const beginnerContent = processor
    .list()
    .filter((doc) => doc.metadata?.difficulty === "beginner");
  if (beginnerContent.length > 0) {
    beginnerContent.forEach((doc) => {
      console.log(`  ✓ ${doc.title}`);
    });
  } else {
    console.log("  No beginner content yet");
  }
  console.log("");

  // Step 5: Update and enhance
  console.log("Step 5: Updating an article...");
  const firstDoc = processor.list()[0];
  if (firstDoc) {
    const updated = processor.save({
      id: firstDoc.id,
      title: firstDoc.title,
      content: firstDoc.content + "\n\nUpdated with additional information.",
      tags: [...firstDoc.tags, "updated"],
      metadata: {
        ...firstDoc.metadata,
        updatedAt: new Date().toISOString()
      }
    });
    console.log(`  ✓ Updated: ${updated.title}`);
  }
  console.log("");

  // Step 6: Generate statistics
  console.log("Step 6: Knowledge Base Statistics:");
  const allDocs = processor.list();
  console.log(`  Total articles: ${allDocs.length}`);
  console.log(`  Categories: ${categories.size}`);

  const difficulties = new Map<string, number>();
  allDocs.forEach((doc) => {
    const diff = doc.metadata?.difficulty || "unknown";
    difficulties.set(diff, (difficulties.get(diff) || 0) + 1);
  });

  console.log("  By difficulty:");
  difficulties.forEach((count, level) => {
    console.log(`    - ${level}: ${count}`);
  });
  console.log("");

  // Step 7: Cleanup
  console.log("Step 7: Cleaning up...");
  allDocs.forEach((doc) => processor.delete(doc.id));
  console.log(`  ✓ Deleted ${allDocs.length} articles\n`);

  console.log("=== Workflow Complete ===");
}

knowledgeBaseWorkflow().catch(console.error);
