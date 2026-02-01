/**
 * Structured logging system for Context Processor
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private minLevel: LogLevel = LogLevel.INFO;
  private enabledContexts: Set<string> = new Set();

  private constructor() {
    // Configure from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.minLevel = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  enableContext(context: string): void {
    this.enabledContexts.add(context);
  }

  disableContext(context: string): void {
    this.enabledContexts.delete(context);
  }

  private shouldLog(level: LogLevel, context?: string): boolean {
    if (level < this.minLevel) {
      return false;
    }
    if (context && this.enabledContexts.size > 0) {
      return this.enabledContexts.has(context);
    }
    return true;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // Write to stderr for structured logging (stdout is used for MCP protocol)
    console.error(JSON.stringify(entry));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG, context?.component as string)) {
      const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
      this.writeLog(entry);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO, context?.component as string)) {
      const entry = this.formatLogEntry(LogLevel.INFO, message, context);
      this.writeLog(entry);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN, context?.component as string)) {
      const entry = this.formatLogEntry(LogLevel.WARN, message, context);
      this.writeLog(entry);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR, context?.component as string)) {
      const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
      this.writeLog(entry);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
