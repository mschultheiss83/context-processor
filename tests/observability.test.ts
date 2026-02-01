/**
 * Test Suite: Observability Features
 *
 * Tests for logging, metrics, and health check functionality
 */

import { Logger, LogLevel } from "../src/logger";
import { MetricsCollector } from "../src/metrics";
import { HealthChecker, HealthStatus } from "../src/health";
import * as fs from "fs";
import * as path from "path";

describe("Observability Features", () => {
  describe("Logger", () => {
    let logger: Logger;

    beforeEach(() => {
      logger = Logger.getInstance();
    });

    test("should create logger instance", () => {
      expect(logger).toBeDefined();
    });

    test("should set log level", () => {
      expect(() => {
        logger.setLogLevel(LogLevel.DEBUG);
      }).not.toThrow();
    });

    test("should enable and disable context", () => {
      expect(() => {
        logger.enableContext("test");
        logger.disableContext("test");
      }).not.toThrow();
    });

    test("should log messages at different levels", () => {
      // Capture console.error output
      const originalError = console.error;
      const errorLogs: string[] = [];
      console.error = (message: string) => {
        errorLogs.push(message);
      };

      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug("Debug message", { component: "test" });
      logger.info("Info message", { component: "test" });
      logger.warn("Warning message", { component: "test" });
      logger.error("Error message", undefined, { component: "test" });

      // Restore console.error
      console.error = originalError;

      expect(errorLogs.length).toBeGreaterThan(0);
      errorLogs.forEach((log) => {
        const parsed = JSON.parse(log);
        expect(parsed).toHaveProperty("timestamp");
        expect(parsed).toHaveProperty("level");
        expect(parsed).toHaveProperty("message");
      });
    });

    test("should include error details in log entry", () => {
      const originalError = console.error;
      const errorLogs: string[] = [];
      console.error = (message: string) => {
        errorLogs.push(message);
      };

      const testError = new Error("Test error");
      logger.error("Error occurred", testError, { component: "test" });

      console.error = originalError;

      expect(errorLogs.length).toBeGreaterThan(0);
      const parsed = JSON.parse(errorLogs[0]);
      expect(parsed.error).toBeDefined();
      expect(parsed.error.message).toBe("Test error");
      expect(parsed.error.stack).toBeDefined();
    });
  });

  describe("MetricsCollector", () => {
    let metrics: MetricsCollector;

    beforeEach(() => {
      metrics = MetricsCollector.getInstance();
      metrics.reset();
    });

    test("should create metrics collector instance", () => {
      expect(metrics).toBeDefined();
    });

    test("should track operation execution", () => {
      const endTimer = metrics.startOperation("test.operation");

      // Simulate some work
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }

      endTimer();

      const operationMetrics = metrics.getOperationMetrics("test.operation");
      expect(operationMetrics).toBeDefined();
      expect(operationMetrics?.count).toBe(1);
      expect(operationMetrics?.totalDuration).toBeGreaterThan(0);
      expect(operationMetrics?.avgDuration).toBeGreaterThan(0);
    });

    test("should track multiple operations", () => {
      const endTimer1 = metrics.startOperation("operation1");
      endTimer1();

      const endTimer2 = metrics.startOperation("operation2");
      endTimer2();

      const endTimer3 = metrics.startOperation("operation1");
      endTimer3();

      const op1Metrics = metrics.getOperationMetrics("operation1");
      const op2Metrics = metrics.getOperationMetrics("operation2");

      expect(op1Metrics?.count).toBe(2);
      expect(op2Metrics?.count).toBe(1);
    });

    test("should record errors", () => {
      metrics.recordError("test.operation", "validation_error");
      metrics.recordError("test.operation", "timeout_error");

      const summary = metrics.getSummary();
      expect(summary.errors.total).toBe(2);
      expect(summary.errors.byType.validation_error).toBe(1);
      expect(summary.errors.byType.timeout_error).toBe(1);
    });

    test("should track storage metrics", () => {
      metrics.recordContextSaved();
      metrics.recordContextSaved();
      metrics.recordContextLoaded();
      metrics.recordContextDeleted();

      const summary = metrics.getSummary();
      expect(summary.storage.totalContexts).toBe(1); // 2 saved - 1 deleted
      expect(summary.storage.lastSaved).toBeDefined();
      expect(summary.storage.lastLoaded).toBeDefined();
    });

    test("should calculate uptime", () => {
      const summary = metrics.getSummary();
      expect(summary.uptime).toBeGreaterThan(0);
    });

    test("should reset metrics", () => {
      metrics.recordContextSaved();
      metrics.recordError("test", "error");

      metrics.reset();

      const summary = metrics.getSummary();
      expect(summary.storage.totalContexts).toBe(0);
      expect(summary.errors.total).toBe(0);
      expect(Object.keys(summary.operations).length).toBe(0);
    });
  });

  describe("HealthChecker", () => {
    let healthChecker: HealthChecker;
    const testStorageDir = path.join(process.cwd(), "test-contexts-health");

    beforeAll(() => {
      // Create test storage directory
      if (!fs.existsSync(testStorageDir)) {
        fs.mkdirSync(testStorageDir, { recursive: true });
      }
    });

    beforeEach(() => {
      healthChecker = HealthChecker.getInstance(testStorageDir);
    });

    afterAll(() => {
      // Clean up test directory
      if (fs.existsSync(testStorageDir)) {
        const files = fs.readdirSync(testStorageDir);
        files.forEach((file) => {
          fs.unlinkSync(path.join(testStorageDir, file));
        });
        fs.rmdirSync(testStorageDir);
      }
    });

    test("should perform health check", async () => {
      const result = await healthChecker.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.components).toBeDefined();
      expect(result.components.server).toBeDefined();
      expect(result.components.storage).toBeDefined();
      expect(result.components.preprocessor).toBeDefined();
    });

    test("should report healthy status for server component", async () => {
      const result = await healthChecker.performHealthCheck();

      expect(result.components.server.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.server.message).toBe("Server is running");
      expect(result.components.server.details).toBeDefined();
      expect(result.components.server.details?.pid).toBe(process.pid);
    });

    test("should report healthy status for storage component when accessible", async () => {
      const result = await healthChecker.performHealthCheck();

      expect(result.components.storage.status).toBe(HealthStatus.HEALTHY);
      expect(result.components.storage.message).toBe("Storage is accessible");
      expect(result.components.storage.details).toBeDefined();
    });

    test("should include metrics in health check result", async () => {
      const result = await healthChecker.performHealthCheck();

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalOperations).toBeDefined();
      expect(result.metrics?.totalErrors).toBeDefined();
    });

    test("should cache last health check result", async () => {
      await healthChecker.performHealthCheck();
      const lastCheck = healthChecker.getLastHealthCheck();

      expect(lastCheck).toBeDefined();
      expect(lastCheck?.status).toBeDefined();
    });

    test("should perform quick check", async () => {
      const status = await healthChecker.quickCheck();
      expect(status).toBeDefined();
      expect(Object.values(HealthStatus)).toContain(status);
    });

    test("should determine overall status based on component health", async () => {
      const result = await healthChecker.performHealthCheck();

      // If all components are healthy, overall should be healthy
      const allHealthy = Object.values(result.components).every(
        (c) => c.status === HealthStatus.HEALTHY
      );

      if (allHealthy) {
        expect(result.status).toBe(HealthStatus.HEALTHY);
      }
    });
  });

  describe("Integration Tests", () => {
    let metrics: MetricsCollector;
    let logger: Logger;

    beforeEach(() => {
      metrics = MetricsCollector.getInstance();
      metrics.reset();
      logger = Logger.getInstance();
      logger.setLogLevel(LogLevel.INFO);
    });

    test("should log and track operations together", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (message: string) => {
        logs.push(message);
      };

      const endTimer = metrics.startOperation("test.integration");
      logger.info("Operation started", { component: "test" });
      endTimer();
      logger.info("Operation completed", { component: "test" });

      console.error = originalError;

      const operationMetrics = metrics.getOperationMetrics("test.integration");
      expect(operationMetrics?.count).toBe(1);
      expect(logs.length).toBeGreaterThan(0);
    });

    test("should handle errors with logging and metrics", () => {
      const originalError = console.error;
      const logs: string[] = [];
      console.error = (message: string) => {
        logs.push(message);
      };

      const testError = new Error("Integration test error");
      logger.error("Operation failed", testError, { component: "test" });
      metrics.recordError("test.operation", "integration_error");

      console.error = originalError;

      const summary = metrics.getSummary();
      expect(summary.errors.total).toBe(1);
      expect(logs.length).toBeGreaterThan(0);

      const errorLog = JSON.parse(logs[0]);
      expect(errorLog.level).toBe("ERROR");
      expect(errorLog.error).toBeDefined();
    });
  });
});
