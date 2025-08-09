/**
 * Production-ready logging utility with multiple levels and conditional output
 * Includes correlation IDs, structured logging, and Sentry integration
 * Replaces console.log statements throughout the application
 */

import * as Sentry from "@sentry/nextjs";

// Simple random ID generator for correlation IDs
function generateRandomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LogContext {
  component?: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: unknown;
}

interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
  metadata?: {
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
  };
}

// Correlation ID management
class CorrelationManager {
  private static instance: CorrelationManager;
  private correlationMap = new Map<string, string>();

  static getInstance(): CorrelationManager {
    if (!CorrelationManager.instance) {
      CorrelationManager.instance = new CorrelationManager();
    }
    return CorrelationManager.instance;
  }

  generateCorrelationId(): string {
    return generateRandomId();
  }

  setCorrelationId(key: string, correlationId: string): void {
    this.correlationMap.set(key, correlationId);
  }

  getCorrelationId(key: string): string | undefined {
    return this.correlationMap.get(key);
  }

  clearCorrelationId(key: string): void {
    this.correlationMap.delete(key);
  }
}

const correlationManager = CorrelationManager.getInstance();

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private logBuffer: StructuredLogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === "development";

    // Set log level based on environment
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLogLevel) {
      case "debug":
        this.level = LogLevel.DEBUG;
        break;
      case "info":
        this.level = LogLevel.INFO;
        break;
      case "warn":
        this.level = LogLevel.WARN;
        break;
      case "error":
        this.level = LogLevel.ERROR;
        break;
      case "silent":
        this.level = LogLevel.SILENT;
        break;
      default:
        // Default to INFO in production, DEBUG in development
        this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private enrichContext(context?: LogContext): LogContext {
    const enriched: LogContext = { ...context };

    // Add correlation ID if not present
    if (!enriched.correlationId) {
      enriched.correlationId = correlationManager.generateCorrelationId();
    }

    // Add Sentry tracing information if available
    const activeSpan = Sentry.getActiveSpan();
    if (activeSpan) {
      const spanContext = Sentry.spanToJSON(activeSpan);
      enriched.traceId = spanContext.trace_id;
      enriched.spanId = spanContext.span_id;
    }

    // Add browser session information if available
    if (typeof window !== "undefined" && !enriched.sessionId) {
      enriched.sessionId = this.getBrowserSessionId();
    }

    return enriched;
  }

  private getBrowserSessionId(): string {
    const storageKey = "synapse_session_id";
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = generateRandomId();
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  private createStructuredLogEntry(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error | unknown,
    performance?: { duration: number; operation: string },
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.enrichContext(context),
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    if (performance) {
      entry.performance = performance;
    }

    // Add request metadata if available (server-side)
    if (typeof window === "undefined" && context?.requestId) {
      entry.metadata = {
        method: context.method as string,
        url: context.url as string,
        statusCode: context.statusCode as number,
      };
    }

    return entry;
  }

  private addToBuffer(entry: StructuredLogEntry): void {
    this.logBuffer.push(entry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private formatMessage(entry: StructuredLogEntry): string {
    const { timestamp, level, message, context } = entry;
    const prefix = `[${timestamp}] ${level}`;

    if (context) {
      const contextStr = Object.entries(context)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${String(value)}`)
        .join(" ");

      return contextStr
        ? `${prefix} ${message} | ${contextStr}`
        : `${prefix} ${message}`;
    }

    return `${prefix} ${message}`;
  }

  private outputLog(entry: StructuredLogEntry): void {
    const formatted = this.formatMessage(entry);

    switch (entry.level) {
      case "DEBUG":
        console.debug(formatted);
        break;
      case "INFO":
        console.info(formatted);
        break;
      case "WARN":
        console.warn(formatted);
        break;
      case "ERROR":
        console.error(formatted);
        break;
    }

    // Output structured JSON in production for log aggregation
    if (!this.isDevelopment && process.env.LOG_FORMAT === "json") {
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createStructuredLogEntry("DEBUG", message, context);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createStructuredLogEntry("INFO", message, context);
      this.addToBuffer(entry);
      this.outputLog(entry);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createStructuredLogEntry("WARN", message, context);
      this.addToBuffer(entry);
      this.outputLog(entry);

      // Send warning to Sentry
      Sentry.captureMessage(message, "warning");
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createStructuredLogEntry(
        "ERROR",
        message,
        context,
        error,
      );
      this.addToBuffer(entry);
      this.outputLog(entry);

      // Send error to Sentry
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, "error");
      }

      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        });
      } else if (error !== undefined) {
        console.error("Error details:", error);
      }
    }
  }

  // Performance logging
  performance(
    operationName: string,
    duration: number,
    context?: LogContext,
  ): void {
    const message = `${operationName}: ${duration.toFixed(2)}ms`;

    if (duration > 1000) {
      this.warn(`Slow operation detected - ${message}`, context);
    } else {
      this.debug(`Performance - ${message}`, context);
    }
  }

  // API request/response logging
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.debug(`API ${method} ${url}`, {
      ...context,
      operation: "api_request",
    });
  }

  apiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const message = `API ${method} ${url} ${status}${duration ? ` (${duration.toFixed(2)}ms)` : ""}`;

    if (status >= 400) {
      this.error(message, undefined, { ...context, operation: "api_response" });
    } else if (status >= 300) {
      this.warn(message, { ...context, operation: "api_response" });
    } else {
      this.info(message, { ...context, operation: "api_response" });
    }
  }

  // Component lifecycle logging
  componentMount(componentName: string, context?: LogContext): void {
    this.debug(`Component mounted: ${componentName}`, {
      ...context,
      component: componentName,
      operation: "mount",
    });
  }

  componentUnmount(componentName: string, context?: LogContext): void {
    this.debug(`Component unmounted: ${componentName}`, {
      ...context,
      component: componentName,
      operation: "unmount",
    });
  }

  // File operation logging
  fileOperation(
    operation: string,
    filename: string,
    success: boolean,
    context?: LogContext,
  ): void {
    const message = `File ${operation}: ${filename}`;

    if (success) {
      this.debug(message, { ...context, operation: "file_operation" });
    } else {
      this.error(`Failed ${message}`, undefined, {
        ...context,
        operation: "file_operation",
      });
    }
  }

  // User action logging
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      operation: "user_action",
    });
  }

  // AI model operation logging
  aiOperation(
    model: string,
    operation: string,
    success: boolean,
    duration?: number,
    context?: LogContext,
  ): void {
    const message = `AI ${operation} with ${model}${duration ? ` (${duration.toFixed(2)}ms)` : ""}`;

    if (success) {
      this.info(`✅ ${message}`, {
        ...context,
        operation: "ai_operation",
        model,
      });
    } else {
      this.error(`❌ ${message}`, undefined, {
        ...context,
        operation: "ai_operation",
        model,
      });
    }
  }

  // Memory usage logging
  memoryUsage(componentOrOperation: string): void {
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "memory" in performance
    ) {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);

      this.debug(
        `Memory usage for ${componentOrOperation}: ${usedMB}MB / ${totalMB}MB`,
      );

      if (memory.usedJSHeapSize > 100 * 1024 * 1024) {
        // 100MB threshold
        this.warn(
          `High memory usage detected in ${componentOrOperation}: ${usedMB}MB`,
        );
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  // Buffer management methods
  getLogBuffer(): StructuredLogEntry[] {
    return [...this.logBuffer];
  }

  clearLogBuffer(): void {
    this.logBuffer = [];
  }

  exportLogs(format: "json" | "csv" = "json"): string {
    if (format === "json") {
      return JSON.stringify(this.logBuffer, null, 2);
    } else {
      // Simple CSV format
      const headers =
        "timestamp,level,message,component,operation,correlationId";
      const rows = this.logBuffer.map((entry) =>
        [
          entry.timestamp,
          entry.level,
          `"${entry.message.replace(/"/g, '""')}"`,
          entry.context?.component || "",
          entry.context?.operation || "",
          entry.context?.correlationId || "",
        ].join(","),
      );

      return [headers, ...rows].join("\n");
    }
  }

  // Correlation ID management
  setCorrelationId(key: string, correlationId?: string): string {
    const id = correlationId || correlationManager.generateCorrelationId();
    correlationManager.setCorrelationId(key, id);
    return id;
  }

  getCorrelationId(key: string): string | undefined {
    return correlationManager.getCorrelationId(key);
  }

  clearCorrelationId(key: string): void {
    correlationManager.clearCorrelationId(key);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common use cases
export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) =>
  logger.warn(message, context);
export const logError = (
  message: string,
  error?: Error | unknown,
  context?: LogContext,
) => logger.error(message, error, context);
export const logPerformance = (
  operationName: string,
  duration: number,
  context?: LogContext,
) => logger.performance(operationName, duration, context);

// High-level wrapper functions for common logging patterns
export const withLogging = <T>(
  operationName: string,
  fn: () => T,
  context?: LogContext,
): T => {
  const startTime = Date.now();
  logger.debug(`Starting ${operationName}`, context);

  try {
    const result = fn();
    const duration = Date.now() - startTime;
    logger.performance(operationName, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operationName} failed after ${duration}ms`, error, context);
    throw error;
  }
};

export const withAsyncLogging = async <T>(
  operationName: string,
  fn: () => Promise<T>,
  context?: LogContext,
): Promise<T> => {
  const startTime = Date.now();
  logger.debug(`Starting ${operationName}`, context);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.performance(operationName, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operationName} failed after ${duration}ms`, error, context);
    throw error;
  }
};

export default logger;
