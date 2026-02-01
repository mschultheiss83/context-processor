/**
 * Health check system for Context Processor
 */

import * as fs from "fs";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

export enum HealthStatus {
  HEALTHY = "healthy",
  DEGRADED = "degraded",
  UNHEALTHY = "unhealthy",
}

export interface ComponentHealth {
  status: HealthStatus;
  message?: string;
  lastCheck: number;
  details?: Record<string, unknown>;
}

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: number;
  uptime: number;
  components: {
    server: ComponentHealth;
    storage: ComponentHealth;
    preprocessor: ComponentHealth;
  };
  metrics?: {
    totalOperations: number;
    totalErrors: number;
    avgResponseTime?: number;
  };
}

export class HealthChecker {
  private static instance: HealthChecker;
  private storageDir: string;
  private lastHealthCheck?: HealthCheckResult;

  private constructor(storageDir: string = "./contexts") {
    this.storageDir = storageDir;
  }

  static getInstance(storageDir?: string): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker(storageDir);
    }
    return HealthChecker.instance;
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    logger.debug("Performing health check", { component: "health" });

    const timestamp = Date.now();
    const metricsSummary = metrics.getSummary();

    // Check server health
    const serverHealth = this.checkServerHealth();

    // Check storage health
    const storageHealth = await this.checkStorageHealth();

    // Check preprocessor health
    const preprocessorHealth = this.checkPreprocessorHealth();

    // Determine overall status
    const componentStatuses = [
      serverHealth.status,
      storageHealth.status,
      preprocessorHealth.status,
    ];

    let overallStatus = HealthStatus.HEALTHY;
    if (componentStatuses.includes(HealthStatus.UNHEALTHY)) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (componentStatuses.includes(HealthStatus.DEGRADED)) {
      overallStatus = HealthStatus.DEGRADED;
    }

    // Calculate total operations and avg response time
    let totalOperations = 0;
    let totalDuration = 0;
    let operationCount = 0;

    Object.values(metricsSummary.operations).forEach((op) => {
      totalOperations += op.count;
      if (op.avgDuration) {
        totalDuration += op.avgDuration * op.count;
        operationCount += op.count;
      }
    });

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      uptime: metricsSummary.uptime,
      components: {
        server: serverHealth,
        storage: storageHealth,
        preprocessor: preprocessorHealth,
      },
      metrics: {
        totalOperations,
        totalErrors: metricsSummary.errors.total,
        avgResponseTime: operationCount > 0 ? totalDuration / operationCount : undefined,
      },
    };

    this.lastHealthCheck = result;

    logger.info("Health check completed", {
      component: "health",
      status: overallStatus,
      totalOperations,
      totalErrors: metricsSummary.errors.total,
    });

    return result;
  }

  /**
   * Check server component health
   */
  private checkServerHealth(): ComponentHealth {
    const now = Date.now();

    // Server is healthy if we can execute this check
    return {
      status: HealthStatus.HEALTHY,
      message: "Server is running",
      lastCheck: now,
      details: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }

  /**
   * Check storage component health
   */
  private async checkStorageHealth(): Promise<ComponentHealth> {
    const now = Date.now();

    try {
      // Check if storage directory exists and is accessible
      if (!fs.existsSync(this.storageDir)) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: "Storage directory does not exist",
          lastCheck: now,
        };
      }

      // Check if we can read the directory
      const files = fs.readdirSync(this.storageDir);
      const contextFiles = files.filter((f) => f.endsWith(".json"));

      // Check if we can write to the directory
      const testFilePath = `${this.storageDir}/.health-check`;
      try {
        fs.writeFileSync(testFilePath, "health-check");
        fs.unlinkSync(testFilePath);
      } catch (error) {
        return {
          status: HealthStatus.DEGRADED,
          message: "Storage directory is read-only",
          lastCheck: now,
          details: {
            error: error instanceof Error ? error.message : String(error),
          },
        };
      }

      return {
        status: HealthStatus.HEALTHY,
        message: "Storage is accessible",
        lastCheck: now,
        details: {
          directory: this.storageDir,
          contextCount: contextFiles.length,
        },
      };
    } catch (error) {
      logger.error("Storage health check failed", error as Error, {
        component: "health",
      });

      return {
        status: HealthStatus.UNHEALTHY,
        message: "Storage health check failed",
        lastCheck: now,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Check preprocessor component health
   */
  private checkPreprocessorHealth(): ComponentHealth {
    const now = Date.now();

    try {
      // Check if preprocessor operations are working
      const preprocessorMetrics = metrics.getOperationMetrics("preprocess");

      if (preprocessorMetrics && preprocessorMetrics.errors > 0) {
        const errorRate =
          preprocessorMetrics.errors / preprocessorMetrics.count;

        if (errorRate > 0.5) {
          return {
            status: HealthStatus.DEGRADED,
            message: "High error rate in preprocessor",
            lastCheck: now,
            details: {
              errorRate: `${(errorRate * 100).toFixed(2)}%`,
              totalErrors: preprocessorMetrics.errors,
              totalOperations: preprocessorMetrics.count,
            },
          };
        }
      }

      return {
        status: HealthStatus.HEALTHY,
        message: "Preprocessor is operational",
        lastCheck: now,
        details: preprocessorMetrics
          ? {
              operations: preprocessorMetrics.count,
              avgDuration: `${preprocessorMetrics.avgDuration.toFixed(2)}ms`,
            }
          : undefined,
      };
    } catch (error) {
      logger.error("Preprocessor health check failed", error as Error, {
        component: "health",
      });

      return {
        status: HealthStatus.UNHEALTHY,
        message: "Preprocessor health check failed",
        lastCheck: now,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Get the last health check result
   */
  getLastHealthCheck(): HealthCheckResult | undefined {
    return this.lastHealthCheck;
  }

  /**
   * Quick health check - just returns last result or performs new check
   */
  async quickCheck(): Promise<HealthStatus> {
    if (
      this.lastHealthCheck &&
      Date.now() - this.lastHealthCheck.timestamp < 60000
    ) {
      return this.lastHealthCheck.status;
    }

    const result = await this.performHealthCheck();
    return result.status;
  }
}

// Export singleton instance
export const healthChecker = HealthChecker.getInstance();
