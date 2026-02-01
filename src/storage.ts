import * as fs from "fs";
import * as path from "path";
import { ContextItem } from "./types.js";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

export class ContextStorage {
  private storageDir: string;

  constructor(storageDir: string = "./contexts") {
    this.storageDir = storageDir;
    this.ensureStorageDir();
    logger.info("ContextStorage initialized", {
      component: "storage",
      directory: storageDir,
    });
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      logger.info("Created storage directory", {
        component: "storage",
        directory: this.storageDir,
      });
    }
  }

  save(context: ContextItem): void {
    const endTimer = metrics.startOperation("storage.save");
    try {
      const filePath = path.join(this.storageDir, `${context.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
      metrics.recordContextSaved();
      logger.debug("Context saved", {
        component: "storage",
        contextId: context.id,
        title: context.title,
      });
    } catch (error) {
      metrics.recordError("storage.save", "write_error");
      logger.error("Failed to save context", error as Error, {
        component: "storage",
        contextId: context.id,
      });
      throw error;
    } finally {
      endTimer();
    }
  }

  load(contextId: string): ContextItem | null {
    const endTimer = metrics.startOperation("storage.load");
    try {
      const filePath = path.join(this.storageDir, `${contextId}.json`);
      if (!fs.existsSync(filePath)) {
        logger.debug("Context not found", {
          component: "storage",
          contextId,
        });
        return null;
      }
      const data = fs.readFileSync(filePath, "utf-8");
      const context = JSON.parse(data) as ContextItem;
      metrics.recordContextLoaded();
      logger.debug("Context loaded", {
        component: "storage",
        contextId,
        title: context.title,
      });
      return context;
    } catch (error) {
      metrics.recordError("storage.load", "read_error");
      logger.error("Failed to load context", error as Error, {
        component: "storage",
        contextId,
      });
      throw error;
    } finally {
      endTimer();
    }
  }

  list(): ContextItem[] {
    const endTimer = metrics.startOperation("storage.list");
    try {
      const files = fs.readdirSync(this.storageDir);
      const contexts = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          const filePath = path.join(this.storageDir, file);
          const data = fs.readFileSync(filePath, "utf-8");
          return JSON.parse(data) as ContextItem;
        });
      logger.debug("Contexts listed", {
        component: "storage",
        count: contexts.length,
      });
      return contexts;
    } catch (error) {
      metrics.recordError("storage.list", "read_error");
      logger.error("Failed to list contexts", error as Error, {
        component: "storage",
      });
      throw error;
    } finally {
      endTimer();
    }
  }

  delete(contextId: string): boolean {
    const endTimer = metrics.startOperation("storage.delete");
    try {
      const filePath = path.join(this.storageDir, `${contextId}.json`);
      if (!fs.existsSync(filePath)) {
        logger.debug("Context not found for deletion", {
          component: "storage",
          contextId,
        });
        return false;
      }
      fs.unlinkSync(filePath);
      metrics.recordContextDeleted();
      logger.info("Context deleted", {
        component: "storage",
        contextId,
      });
      return true;
    } catch (error) {
      metrics.recordError("storage.delete", "delete_error");
      logger.error("Failed to delete context", error as Error, {
        component: "storage",
        contextId,
      });
      throw error;
    } finally {
      endTimer();
    }
  }

  search(tags?: string[], limit?: number, offset?: number): ContextItem[] {
    const endTimer = metrics.startOperation("storage.search");
    try {
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

      logger.debug("Context search completed", {
        component: "storage",
        tags,
        results: contexts.length,
      });

      return contexts;
    } finally {
      endTimer();
    }
  }
}
