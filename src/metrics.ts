/**
 * Metrics collection and monitoring for Context Processor
 */

import { logger } from "./logger.js";

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface OperationMetrics {
  count: number;
  totalDuration: number;
  avgDuration: number;
  errors: number;
  lastExecuted?: number;
}

export interface MetricsSummary {
  uptime: number;
  operations: Record<string, OperationMetrics>;
  storage: {
    totalContexts: number;
    lastSaved?: number;
    lastLoaded?: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private startTime: number;
  private operations: Map<string, OperationMetrics> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private storageMetrics = {
    totalContexts: 0,
    lastSaved: 0,
    lastLoaded: 0,
  };

  private constructor() {
    this.startTime = Date.now();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record the start of an operation
   */
  startOperation(operation: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.recordOperation(operation, duration);
    };
  }

  /**
   * Record a completed operation with its duration
   */
  private recordOperation(operation: string, duration: number): void {
    const metrics = this.operations.get(operation) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      errors: 0,
    };

    metrics.count++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    metrics.lastExecuted = Date.now();

    this.operations.set(operation, metrics);

    logger.debug(`Operation completed: ${operation}`, {
      component: "metrics",
      operation,
      duration,
      count: metrics.count,
    });
  }

  /**
   * Record an operation error
   */
  recordError(operation: string, errorType: string): void {
    const metrics = this.operations.get(operation);
    if (metrics) {
      metrics.errors++;
      this.operations.set(operation, metrics);
    }

    const currentCount = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, currentCount + 1);

    logger.warn(`Error recorded: ${operation}`, {
      component: "metrics",
      operation,
      errorType,
    });
  }

  /**
   * Update storage metrics
   */
  recordContextSaved(): void {
    this.storageMetrics.totalContexts++;
    this.storageMetrics.lastSaved = Date.now();
  }

  recordContextLoaded(): void {
    this.storageMetrics.lastLoaded = Date.now();
  }

  recordContextDeleted(): void {
    this.storageMetrics.totalContexts = Math.max(
      0,
      this.storageMetrics.totalContexts - 1
    );
  }

  setTotalContexts(count: number): void {
    this.storageMetrics.totalContexts = count;
  }

  /**
   * Get current metrics summary
   */
  getSummary(): MetricsSummary {
    const uptime = Date.now() - this.startTime;
    const operations: Record<string, OperationMetrics> = {};

    this.operations.forEach((metrics, name) => {
      operations[name] = { ...metrics };
    });

    const errorsByType: Record<string, number> = {};
    let totalErrors = 0;

    this.errorCounts.forEach((count, type) => {
      errorsByType[type] = count;
      totalErrors += count;
    });

    return {
      uptime,
      operations,
      storage: {
        totalContexts: this.storageMetrics.totalContexts,
        lastSaved: this.storageMetrics.lastSaved || undefined,
        lastLoaded: this.storageMetrics.lastLoaded || undefined,
      },
      errors: {
        total: totalErrors,
        byType: errorsByType,
      },
    };
  }

  /**
   * Get metrics for a specific operation
   */
  getOperationMetrics(operation: string): OperationMetrics | undefined {
    return this.operations.get(operation);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.operations.clear();
    this.errorCounts.clear();
    this.storageMetrics = {
      totalContexts: 0,
      lastSaved: 0,
      lastLoaded: 0,
    };
    this.startTime = Date.now();

    logger.info("Metrics reset", { component: "metrics" });
  }
}

// Export singleton instance
export const metrics = MetricsCollector.getInstance();
