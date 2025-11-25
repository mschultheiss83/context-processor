/**
 * Example 4: Batch Operations
 *
 * This example shows how to efficiently handle multiple contexts
 * and perform bulk operations with performance considerations.
 */

import { ContextProcessor } from "../dist/index.js";

async function batchOperations() {
  const processor = new ContextProcessor();

  // Generate sample data
  const generateDocuments = (count: number) => {
    const topics = [
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Express",
      "MongoDB",
      "PostgreSQL",
      "REST API",
      "GraphQL",
      "WebSocket"
    ];

    const docs = [];
    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length];
      docs.push({
        title: `${topic} Tutorial Part ${Math.floor(i / topics.length) + 1}`,
        content: `This is a comprehensive guide to ${topic}. It covers the fundamentals, best practices, and advanced patterns.`,
        tags: [topic.toLowerCase().replace(".", ""), "tutorial", "technical"]
      });
    }
    return docs;
  };

  console.log("Batch Operations Example\n");

  // 1. Batch save with no preprocessing (fastest)
  console.log("1. Batch saving 50 documents (no preprocessing)...");
  const startSave = performance.now();
  const documents = generateDocuments(50);
  const savedIds = [];

  for (const doc of documents) {
    const saved = processor.save(doc);
    savedIds.push(saved.id);
  }

  const saveDuration = performance.now() - startSave;
  console.log(`   ✓ Saved ${savedIds.length} documents in ${saveDuration.toFixed(2)}ms\n`);

  // 2. List with pagination
  console.log("2. Listing with pagination (10 per page)...");
  const pageSize = 10;
  let offset = 0;
  let pageNum = 1;

  while (true) {
    const page = processor.list({ limit: pageSize, offset });
    if (page.length === 0) break;

    console.log(`   Page ${pageNum}: ${page.length} items`);
    pageNum++;
    offset += pageSize;
  }
  console.log("");

  // 3. Search across all documents
  console.log("3. Searching across all documents...");
  const searchTerm = "tutorial";
  const tutorialDocs = processor
    .list()
    .filter((doc) => doc.tags.includes(searchTerm));
  console.log(`   Found ${tutorialDocs.length} documents with tag "${searchTerm}"\n`);

  // 4. Batch delete
  console.log("4. Batch delete all saved documents...");
  const startDelete = performance.now();

  for (const id of savedIds) {
    processor.delete(id);
  }

  const deleteDuration = performance.now() - startDelete;
  console.log(`   ✓ Deleted ${savedIds.length} documents in ${deleteDuration.toFixed(2)}ms\n`);

  // 5. Performance summary
  console.log("--- Performance Summary ---");
  console.log(`Total documents: ${documents.length}`);
  console.log(`Save time: ${saveDuration.toFixed(2)}ms (avg: ${(saveDuration / documents.length).toFixed(2)}ms per doc)`);
  console.log(`Delete time: ${deleteDuration.toFixed(2)}ms (avg: ${(deleteDuration / savedIds.length).toFixed(2)}ms per doc)`);
}

batchOperations().catch(console.error);
