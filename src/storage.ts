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
}
