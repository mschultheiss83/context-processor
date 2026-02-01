import * as fs from "fs";
import * as path from "path";
import { ContextItem } from "./types.js";

/**
 * Custom error types for better error handling
 */
export class StorageError extends Error {
  constructor(message: string, public code: string, public recoverable: boolean = false) {
    super(message);
    this.name = "StorageError";
  }
}

export class ContextStorage {
  private storageDir: string;
  private backupDir: string;
  private maxRetries: number = 3;
  private retryDelay: number = 100; // milliseconds

  constructor(storageDir: string = "./contexts") {
    this.storageDir = storageDir;
    this.backupDir = path.join(storageDir, ".backups");
    this.ensureStorageDir();
  }

  /**
   * Ensures storage directory exists with error handling for permission issues
   */
  private ensureStorageDir(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      // Ensure backup directory exists
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      // Test write permissions
      const testFile = path.join(this.storageDir, ".write-test");
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new StorageError(
          `Permission denied: Cannot access storage directory '${this.storageDir}'`,
          "EACCES",
          false
        );
      } else if ((error as NodeJS.ErrnoException).code === "ENOSPC") {
        throw new StorageError(
          "Disk full: Cannot create storage directory",
          "ENOSPC",
          false
        );
      }
      throw new StorageError(
        `Failed to initialize storage directory: ${error instanceof Error ? error.message : String(error)}`,
        "INIT_ERROR",
        false
      );
    }
  }

  /**
   * Creates a backup of a context file before modification
   */
  private createBackup(contextId: string): void {
    const filePath = path.join(this.storageDir, `${contextId}.json`);
    if (fs.existsSync(filePath)) {
      const backupPath = path.join(
        this.backupDir,
        `${contextId}.${Date.now()}.backup.json`
      );
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch (error) {
        console.error(`Warning: Failed to create backup for ${contextId}:`, error);
      }
    }
  }

  /**
   * Attempts to restore from backup if main file is corrupted
   */
  private restoreFromBackup(contextId: string): ContextItem | null {
    try {
      const backupFiles = fs
        .readdirSync(this.backupDir)
        .filter((file) => file.startsWith(contextId) && file.endsWith(".backup.json"))
        .sort()
        .reverse(); // Most recent first

      for (const backupFile of backupFiles) {
        try {
          const backupPath = path.join(this.backupDir, backupFile);
          const data = fs.readFileSync(backupPath, "utf-8");
          const context = JSON.parse(data) as ContextItem;
          // Restore to main location
          const mainPath = path.join(this.storageDir, `${contextId}.json`);
          fs.writeFileSync(mainPath, JSON.stringify(context, null, 2));
          console.error(`Restored context ${contextId} from backup ${backupFile}`);
          return context;
        } catch {
          continue; // Try next backup
        }
      }
    } catch (error) {
      console.error(`Failed to restore from backup for ${contextId}:`, error);
    }
    return null;
  }

  /**
   * Validates JSON structure of a context item
   */
  private validateContext(data: unknown): ContextItem {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid context data: not an object");
    }
    const ctx = data as Partial<ContextItem>;
    if (!ctx.id || !ctx.title || !ctx.content) {
      throw new Error("Invalid context data: missing required fields");
    }
    return data as ContextItem;
  }

  /**
   * Retry logic for operations that might fail due to transient issues
   */
  private async retry<T>(
    operation: () => T,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return operation();
      } catch (error) {
        lastError = error as Error;
        const errCode = (error as NodeJS.ErrnoException).code;

        // Don't retry non-recoverable errors
        if (errCode === "EACCES" || errCode === "ENOSPC") {
          throw error;
        }

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * (attempt + 1))
          );
        }
      }
    }
    throw new StorageError(
      `${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      "RETRY_EXHAUSTED",
      false
    );
  }

  /**
   * Save a context with error handling and recovery
   */
  save(context: ContextItem): void {
    const filePath = path.join(this.storageDir, `${context.id}.json`);

    // Create backup if file exists
    this.createBackup(context.id);

    try {
      this.retry(() => {
        try {
          fs.writeFileSync(filePath, JSON.stringify(context, null, 2));
        } catch (error) {
          const errCode = (error as NodeJS.ErrnoException).code;
          if (errCode === "ENOSPC") {
            throw new StorageError(
              "Disk full: Cannot save context. Free up disk space and try again.",
              "ENOSPC",
              true
            );
          } else if (errCode === "EACCES") {
            throw new StorageError(
              `Permission denied: Cannot write to '${filePath}'`,
              "EACCES",
              false
            );
          }
          throw error;
        }
      }, "save");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load a context with error handling for corrupted files
   */
  load(contextId: string): ContextItem | null {
    const filePath = path.join(this.storageDir, `${contextId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      return this.retry(() => {
        try {
          const data = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(data);
          return this.validateContext(parsed);
        } catch (error) {
          if (error instanceof SyntaxError) {
            // JSON is corrupted, try to restore from backup
            console.error(`Corrupted JSON detected for context ${contextId}, attempting recovery`);
            const restored = this.restoreFromBackup(contextId);
            if (restored) {
              return restored;
            }
            throw new StorageError(
              `Context file is corrupted and no valid backup found for '${contextId}'`,
              "CORRUPTED_JSON",
              false
            );
          }
          throw error;
        }
      }, "load");
    } catch (error) {
      const errCode = (error as NodeJS.ErrnoException).code;
      if (errCode === "EACCES") {
        throw new StorageError(
          `Permission denied: Cannot read '${filePath}'`,
          "EACCES",
          false
        );
      }
      throw error;
    }
  }

  /**
   * List all contexts with error handling for corrupted files
   */
  list(): ContextItem[] {
    try {
      const files = fs.readdirSync(this.storageDir);
      const contexts: ContextItem[] = [];
      const errors: Array<{ file: string; error: string }> = [];

      files
        .filter((file) => file.endsWith(".json") && !file.includes(".backup"))
        .forEach((file) => {
          const filePath = path.join(this.storageDir, file);
          try {
            const data = fs.readFileSync(filePath, "utf-8");
            const parsed = JSON.parse(data);
            const validated = this.validateContext(parsed);
            contexts.push(validated);
          } catch (error) {
            // Log corrupted file but continue with other files
            const contextId = file.replace(".json", "");
            errors.push({
              file,
              error: error instanceof Error ? error.message : String(error),
            });

            // Attempt recovery from backup
            try {
              const restored = this.restoreFromBackup(contextId);
              if (restored) {
                contexts.push(restored);
              }
            } catch {
              // Recovery failed, skip this file
            }
          }
        });

      if (errors.length > 0) {
        console.error(`Encountered ${errors.length} corrupted file(s):`, errors);
      }

      return contexts;
    } catch (error) {
      const errCode = (error as NodeJS.ErrnoException).code;
      if (errCode === "EACCES") {
        throw new StorageError(
          `Permission denied: Cannot read storage directory '${this.storageDir}'`,
          "EACCES",
          false
        );
      }
      throw new StorageError(
        `Failed to list contexts: ${error instanceof Error ? error.message : String(error)}`,
        "LIST_ERROR",
        false
      );
    }
  }

  /**
   * Delete a context with backup creation
   */
  delete(contextId: string): boolean {
    const filePath = path.join(this.storageDir, `${contextId}.json`);

    if (!fs.existsSync(filePath)) {
      return false;
    }

    // Create backup before deletion
    this.createBackup(contextId);

    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      const errCode = (error as NodeJS.ErrnoException).code;
      if (errCode === "EACCES") {
        throw new StorageError(
          `Permission denied: Cannot delete '${filePath}'`,
          "EACCES",
          false
        );
      }
      throw new StorageError(
        `Failed to delete context: ${error instanceof Error ? error.message : String(error)}`,
        "DELETE_ERROR",
        false
      );
    }
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
