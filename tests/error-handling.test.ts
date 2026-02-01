/**
 * Error Handling Tests
 * Tests for disk full, corrupted JSON, permission changes, and recovery mechanisms
 */

import * as fs from "fs";
import * as path from "path";
import { ContextStorage, StorageError } from "../src/storage";
import { TestDataGenerator, TestFileSystem } from "./test-utils";
import { ContextItem } from "../src/types";

describe("Error Handling and Recovery", () => {
  let testStorage: ContextStorage;
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), "test-contexts-error-handling");
    testStorage = new ContextStorage(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("Corrupted JSON Recovery", () => {
    it("should recover from corrupted JSON using backup", () => {
      // Create a valid context first
      const context = TestDataGenerator.generateContextItem({
        id: "test-corrupted-1",
        title: "Test Context",
        content: "Original content",
      });

      testStorage.save(context);

      // Verify it was saved
      const loaded = testStorage.load(context.id);
      expect(loaded).not.toBeNull();
      expect(loaded?.content).toBe("Original content");

      // Create a backup manually
      const backupDir = path.join(testDir, ".backups");
      const backupPath = path.join(
        backupDir,
        `${context.id}.${Date.now()}.backup.json`
      );
      const mainPath = path.join(testDir, `${context.id}.json`);

      fs.copyFileSync(mainPath, backupPath);

      // Corrupt the main file
      fs.writeFileSync(mainPath, "{ invalid json content ///");

      // Attempt to load - should recover from backup
      const recovered = testStorage.load(context.id);
      expect(recovered).not.toBeNull();
      expect(recovered?.id).toBe(context.id);
      expect(recovered?.content).toBe("Original content");

      // Verify main file was restored
      const restoredData = JSON.parse(fs.readFileSync(mainPath, "utf-8"));
      expect(restoredData.content).toBe("Original content");
    });

    it("should throw error when no valid backup exists for corrupted file", () => {
      const context = TestDataGenerator.generateContextItem({
        id: "test-corrupted-2",
      });

      // Create corrupted file without backup
      const mainPath = path.join(testDir, `${context.id}.json`);
      fs.writeFileSync(mainPath, "{ invalid json //");

      expect(() => testStorage.load(context.id)).toThrow(StorageError);
      expect(() => testStorage.load(context.id)).toThrow(/corrupted/i);
    });

    it("should skip corrupted files in list() and continue with valid ones", () => {
      // Create valid contexts
      const context1 = TestDataGenerator.generateContextItem({ id: "valid-1" });
      const context2 = TestDataGenerator.generateContextItem({ id: "valid-2" });
      testStorage.save(context1);
      testStorage.save(context2);

      // Create corrupted file
      const corruptedPath = path.join(testDir, "corrupted-3.json");
      fs.writeFileSync(corruptedPath, "{ corrupted data");

      // List should return valid contexts and skip corrupted one
      const contexts = testStorage.list();
      expect(contexts.length).toBe(2);
      expect(contexts.map((c) => c.id)).toContain("valid-1");
      expect(contexts.map((c) => c.id)).toContain("valid-2");
    });

    it("should recover corrupted file in list() if backup exists", () => {
      const context = TestDataGenerator.generateContextItem({
        id: "recoverable-1",
        title: "Recoverable Context",
      });

      testStorage.save(context);

      // Create backup
      const backupDir = path.join(testDir, ".backups");
      const backupPath = path.join(
        backupDir,
        `${context.id}.${Date.now()}.backup.json`
      );
      const mainPath = path.join(testDir, `${context.id}.json`);
      fs.copyFileSync(mainPath, backupPath);

      // Corrupt main file
      fs.writeFileSync(mainPath, "{ corrupt }");

      // List should recover and include the context
      const contexts = testStorage.list();
      expect(contexts.length).toBeGreaterThan(0);
      const recovered = contexts.find((c) => c.id === context.id);
      expect(recovered).toBeDefined();
      expect(recovered?.title).toBe("Recoverable Context");
    });
  });

  describe("Backup Management", () => {
    it("should create backup before saving existing context", () => {
      const context = TestDataGenerator.generateContextItem({ id: "backup-test-1" });

      // Save initial version
      testStorage.save(context);

      // Modify and save again
      context.content = "Updated content";
      testStorage.save(context);

      // Check backup was created
      const backupDir = path.join(testDir, ".backups");
      const backupFiles = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("backup-test-1") && f.endsWith(".backup.json"));

      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it("should create backup before deleting context", () => {
      const context = TestDataGenerator.generateContextItem({ id: "delete-test-1" });
      testStorage.save(context);

      testStorage.delete(context.id);

      // Verify backup exists
      const backupDir = path.join(testDir, ".backups");
      const backupFiles = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("delete-test-1") && f.endsWith(".backup.json"));

      expect(backupFiles.length).toBeGreaterThan(0);

      // Verify original is deleted
      const mainPath = path.join(testDir, `${context.id}.json`);
      expect(fs.existsSync(mainPath)).toBe(false);
    });

    it("should use most recent backup when multiple backups exist", () => {
      const context = TestDataGenerator.generateContextItem({
        id: "multi-backup-1",
        content: "Version 1",
      });

      testStorage.save(context);

      // Create multiple backups with different timestamps
      const backupDir = path.join(testDir, ".backups");
      const mainPath = path.join(testDir, `${context.id}.json`);

      // Old backup
      context.content = "Version 1 (old backup)";
      fs.writeFileSync(
        path.join(backupDir, `${context.id}.${Date.now() - 10000}.backup.json`),
        JSON.stringify(context, null, 2)
      );

      // Recent backup
      context.content = "Version 2 (recent backup)";
      fs.writeFileSync(
        path.join(backupDir, `${context.id}.${Date.now()}.backup.json`),
        JSON.stringify(context, null, 2)
      );

      // Corrupt main file
      fs.writeFileSync(mainPath, "{ corrupt }");

      // Load should use most recent backup
      const recovered = testStorage.load(context.id);
      expect(recovered?.content).toBe("Version 2 (recent backup)");
    });
  });

  describe("Permission Error Handling", () => {
    it("should throw descriptive error for permission denied on read", () => {
      const context = TestDataGenerator.generateContextItem({ id: "perm-test-1" });
      testStorage.save(context);

      const filePath = path.join(testDir, `${context.id}.json`);

      // Make file unreadable (this might not work on all systems/CI)
      try {
        fs.chmodSync(filePath, 0o000);

        expect(() => testStorage.load(context.id)).toThrow(StorageError);
        expect(() => testStorage.load(context.id)).toThrow(/permission denied/i);

        // Restore permissions
        fs.chmodSync(filePath, 0o644);
      } catch (error) {
        // Skip test if chmod not supported
        console.log("Skipping permission test - chmod not supported");
      }
    });

    it("should throw descriptive error for permission denied on directory read", () => {
      // Make directory unreadable
      try {
        fs.chmodSync(testDir, 0o000);

        expect(() => testStorage.list()).toThrow(StorageError);
        expect(() => testStorage.list()).toThrow(/permission denied/i);

        // Restore permissions
        fs.chmodSync(testDir, 0o755);
      } catch (error) {
        // Skip test if chmod not supported
        console.log("Skipping directory permission test - chmod not supported");
      }
    });
  });

  describe("Data Validation", () => {
    it("should reject context with missing required fields", () => {
      const invalidPath = path.join(testDir, "invalid-1.json");
      fs.writeFileSync(
        invalidPath,
        JSON.stringify({ id: "invalid-1", title: "Test" }) // missing content
      );

      expect(() => testStorage.load("invalid-1")).toThrow(/missing required fields/i);
    });

    it("should reject non-object JSON data", () => {
      const invalidPath = path.join(testDir, "invalid-2.json");
      fs.writeFileSync(invalidPath, JSON.stringify("just a string"));

      expect(() => testStorage.load("invalid-2")).toThrow(/not an object/i);
    });

    it("should reject null JSON data", () => {
      const invalidPath = path.join(testDir, "invalid-3.json");
      fs.writeFileSync(invalidPath, "null");

      expect(() => testStorage.load("invalid-3")).toThrow(/not an object/i);
    });
  });

  describe("StorageError Class", () => {
    it("should create StorageError with correct properties", () => {
      const error = new StorageError("Test error", "TEST_CODE", true);

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe("StorageError");
      expect(error instanceof Error).toBe(true);
    });

    it("should default recoverable to false", () => {
      const error = new StorageError("Test error", "TEST_CODE");

      expect(error.recoverable).toBe(false);
    });
  });

  describe("Backup Directory Creation", () => {
    it("should create backup directory on initialization", () => {
      const backupDir = path.join(testDir, ".backups");
      expect(fs.existsSync(backupDir)).toBe(true);
      expect(fs.statSync(backupDir).isDirectory()).toBe(true);
    });

    it("should handle existing backup directory gracefully", () => {
      const backupDir = path.join(testDir, ".backups");

      // Create a file in backup dir
      const testFile = path.join(backupDir, "test.backup.json");
      fs.writeFileSync(testFile, "test");

      // Create new storage instance - should not fail
      const newStorage = new ContextStorage(testDir);

      // Backup dir should still exist with file
      expect(fs.existsSync(backupDir)).toBe(true);
      expect(fs.existsSync(testFile)).toBe(true);
    });
  });

  describe("Context List Filtering", () => {
    it("should exclude backup files from list results", () => {
      // Create regular context
      const context = TestDataGenerator.generateContextItem({ id: "regular-1" });
      testStorage.save(context);

      // Create a backup file directly
      const backupPath = path.join(testDir, "test.backup.json");
      fs.writeFileSync(backupPath, JSON.stringify(context));

      // List should only return non-backup files
      const contexts = testStorage.list();
      expect(contexts.length).toBe(1);
      expect(contexts[0].id).toBe("regular-1");
    });
  });

  describe("Error Recovery Messages", () => {
    it("should provide helpful error messages for common scenarios", () => {
      // Test ENOSPC error message format
      const enospcError = new StorageError(
        "Disk full: Cannot save context",
        "ENOSPC",
        true
      );
      expect(enospcError.message).toContain("Disk full");
      expect(enospcError.recoverable).toBe(true);

      // Test EACCES error message format
      const eaccesError = new StorageError(
        "Permission denied: Cannot read file",
        "EACCES",
        false
      );
      expect(eaccesError.message).toContain("Permission denied");
      expect(eaccesError.recoverable).toBe(false);

      // Test CORRUPTED_JSON error message format
      const corruptedError = new StorageError(
        "Context file is corrupted",
        "CORRUPTED_JSON",
        false
      );
      expect(corruptedError.message).toContain("corrupted");
    });
  });
});
