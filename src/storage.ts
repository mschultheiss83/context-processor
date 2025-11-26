import * as fs from "fs";
import * as path from "path";
import { ContextItem } from "./types.js";

export class ContextStorage {
  private storageDir: string;

  constructor(storageDir: string = "./contexts") {
    this.storageDir = storageDir;
    this.ensureStorageDir();
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  save(context: ContextItem): void {
    const filePath = path.join(this.storageDir, `${context.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
  }

  load(contextId: string): ContextItem | null {
    const filePath = path.join(this.storageDir, `${contextId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as ContextItem;
  }

  list(): ContextItem[] {
    const files = fs.readdirSync(this.storageDir);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = path.join(this.storageDir, file);
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data) as ContextItem;
      });
  }

  delete(contextId: string): boolean {
    const filePath = path.join(this.storageDir, `${contextId}.json`);
    if (!fs.existsSync(filePath)) {
      return false;
    }
    fs.unlinkSync(filePath);
    return true;
  }

  search(tags?: string[], limit?: number, offset?: number): ContextItem[] {
    let contexts = this.list();

    if (tags && tags.length > 0) {
      contexts = contexts.filter((ctx) =>
        tags.some((tag) => ctx.tags.includes(tag))
      );
    }

    offset = offset || 0;
    if (limit) {
      contexts = contexts.slice(offset, offset + limit);
    }

    return contexts;
  }

  searchFullText(query: string, options?: {
    limit?: number;
    fields?: ('title' | 'content')[];
  }): ContextItem[] {
    // Handle empty query
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Normalize query and split into terms
    const terms = query.toLowerCase().trim().split(/\s+/);
    const fields = options?.fields || ['title', 'content'];
    const results = this.list();

    // Score each context based on term matches
    const scored = results
      .map(context => {
        let score = 0;

        for (const term of terms) {
          // Title matches (weighted 10x)
          if (fields.includes('title') && context.title.toLowerCase().includes(term)) {
            score += 10;
          }
          // Content matches (weighted 1x)
          if (fields.includes('content') && context.content.toLowerCase().includes(term)) {
            score += 1;
          }
        }

        return { context, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => {
        // Sort by score descending
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Tiebreaker: alphabetical by title
        return a.context.title.localeCompare(b.context.title);
      })
      .map(r => r.context);

    // Apply limit if specified
    const limit = options?.limit || 50;
    return scored.slice(0, limit);
  }
}
