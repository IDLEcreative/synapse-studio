/**
 * Business metrics and analytics tracking system
 * Tracks key performance indicators and user behavior
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";

export interface BaseMetric {
  timestamp: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  referrer?: string;
  [key: string]: unknown;
}

export interface PerformanceMetric extends BaseMetric {
  type: "performance";
  operation: string;
  duration: number;
  success: boolean;
  errorType?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessMetric extends BaseMetric {
  type: "business";
  event: string;
  value?: number;
  properties?: Record<string, unknown>;
}

export interface UsageMetric extends BaseMetric {
  type: "usage";
  feature: string;
  action: string;
  context?: Record<string, unknown>;
}

export type Metric = PerformanceMetric | BusinessMetric | UsageMetric;

class MetricsCollector {
  private static instance: MetricsCollector;
  private metricsBuffer: Metric[] = [];
  private maxBufferSize = 500;
  private flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  constructor() {
    // Auto-flush metrics periodically
    if (typeof window !== "undefined") {
      this.startAutoFlush();
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  private getBaseMetric(): BaseMetric {
    const base: BaseMetric = {
      timestamp: new Date().toISOString(),
    };

    // Add browser context if available
    if (typeof window !== "undefined") {
      base.userAgent = navigator.userAgent;
      base.referrer = document.referrer;
      base.sessionId = this.getSessionId();
    }

    return base;
  }

  private getSessionId(): string {
    const storageKey = "synapse_session_id";
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36);
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  private addToBuffer(metric: Metric): void {
    this.metricsBuffer.push(metric);

    // Log metric for debugging
    logger.debug("Metric collected", {
      operation: "metrics_collection",
      metricType: metric.type,
      event:
        "event" in metric
          ? metric.event
          : "operation" in metric
            ? metric.operation
            : "feature" in metric
              ? metric.feature
              : "unknown",
    });

    // Keep buffer size manageable
    if (this.metricsBuffer.length > this.maxBufferSize) {
      this.flush();
    }
  }

  // Performance metrics
  trackPerformance(
    operation: string,
    duration: number,
    success: boolean = true,
    errorType?: string,
    metadata?: Record<string, unknown>,
    userId?: string,
  ): void {
    const metric: PerformanceMetric = {
      ...this.getBaseMetric(),
      type: "performance",
      operation,
      duration,
      success,
      errorType,
      metadata,
      userId,
    };

    this.addToBuffer(metric);

    // Send performance data to Sentry
    Sentry.addBreadcrumb({
      category: "performance",
      message: `${operation}: ${duration}ms`,
      level: success ? "info" : "error",
      data: { duration, operation, success },
    });
  }

  // Business metrics
  trackBusinessEvent(
    event: string,
    value?: number,
    properties?: Record<string, unknown>,
    userId?: string,
  ): void {
    const metric: BusinessMetric = {
      ...this.getBaseMetric(),
      type: "business",
      event,
      value,
      properties,
      userId,
    };

    this.addToBuffer(metric);

    // Send to analytics/monitoring service
    logger.info(`Business event: ${event}`, {
      operation: "business_metric",
      event,
      value,
      userId,
    });
  }

  // Usage metrics
  trackUsage(
    feature: string,
    action: string,
    context?: Record<string, unknown>,
    userId?: string,
  ): void {
    const metric: UsageMetric = {
      ...this.getBaseMetric(),
      type: "usage",
      feature,
      action,
      context,
      userId,
    };

    this.addToBuffer(metric);
  }

  // Convenience methods for common events
  trackPageView(page: string, userId?: string): void {
    this.trackUsage("navigation", "page_view", { page }, userId);
  }

  trackButtonClick(
    button: string,
    context?: Record<string, unknown>,
    userId?: string,
  ): void {
    this.trackUsage(
      "interaction",
      "button_click",
      { button, ...context },
      userId,
    );
  }

  trackAIGeneration(
    model: string,
    duration: number,
    success: boolean,
    outputType: string,
    inputTokens?: number,
    outputTokens?: number,
    userId?: string,
  ): void {
    this.trackPerformance(
      "ai_generation",
      duration,
      success,
      success ? undefined : "generation_failed",
      {
        model,
        outputType,
        inputTokens,
        outputTokens,
      },
      userId,
    );

    this.trackBusinessEvent(
      "ai_generation",
      1,
      {
        model,
        outputType,
        success,
        duration,
      },
      userId,
    );
  }

  trackFileUpload(
    fileType: string,
    fileSize: number,
    duration: number,
    success: boolean,
    userId?: string,
  ): void {
    this.trackPerformance(
      "file_upload",
      duration,
      success,
      success ? undefined : "upload_failed",
      {
        fileType,
        fileSize,
      },
      userId,
    );

    this.trackBusinessEvent(
      "file_upload",
      1,
      {
        fileType,
        fileSize: Math.round(fileSize / 1024 / 1024), // MB
        success,
      },
      userId,
    );
  }

  trackVideoExport(
    duration: number,
    success: boolean,
    outputFormat: string,
    videoLength: number,
    userId?: string,
  ): void {
    this.trackPerformance(
      "video_export",
      duration,
      success,
      success ? undefined : "export_failed",
      {
        outputFormat,
        videoLength,
      },
      userId,
    );

    this.trackBusinessEvent(
      "video_export",
      1,
      {
        outputFormat,
        videoLength,
        success,
        duration,
      },
      userId,
    );
  }

  trackError(
    error: Error,
    context?: Record<string, unknown>,
    userId?: string,
  ): void {
    this.trackPerformance(
      "error_occurred",
      0,
      false,
      error.name,
      {
        errorMessage: error.message,
        errorStack: error.stack?.substring(0, 500), // Limit stack trace length
        ...context,
      },
      userId,
    );
  }

  // Buffer management
  getMetrics(): Metric[] {
    return [...this.metricsBuffer];
  }

  clearMetrics(): void {
    this.metricsBuffer = [];
  }

  flush(): void {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    logger.debug(`Flushing ${metrics.length} metrics`, {
      operation: "metrics_flush",
      count: metrics.length,
    });

    // In production, send metrics to your analytics service
    if (process.env.NODE_ENV === "production") {
      this.sendToAnalyticsService(metrics);
    }
  }

  private async sendToAnalyticsService(metrics: Metric[]): Promise<void> {
    try {
      // Example: Send to your analytics endpoint
      const response = await fetch("/api/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        logger.error(
          "Failed to send metrics to analytics service",
          new Error(`HTTP ${response.status}`),
          {
            operation: "metrics_send",
            status: response.status,
            count: metrics.length,
          },
        );
      }
    } catch (error) {
      logger.error("Error sending metrics to analytics service", error, {
        operation: "metrics_send",
        count: metrics.length,
      });
    }
  }

  // Performance budgets and alerting
  checkPerformanceBudget(operation: string, duration: number): void {
    const budgets: Record<string, number> = {
      ai_generation: 30000, // 30 seconds
      file_upload: 60000, // 1 minute
      video_export: 120000, // 2 minutes
      page_load: 3000, // 3 seconds
      api_request: 5000, // 5 seconds
    };

    const budget = budgets[operation];
    if (budget && duration > budget) {
      logger.warn(`Performance budget exceeded for ${operation}`, {
        operation: "performance_budget_exceeded",
        budgetOperation: operation,
        duration,
        budget,
        overagePercentage: Math.round(((duration - budget) / budget) * 100),
      });

      // Send alert to monitoring system
      Sentry.addBreadcrumb({
        category: "performance",
        message: `Performance budget exceeded: ${operation}`,
        level: "warning",
        data: { duration, budget, operation },
      });
    }
  }

  // Analytics aggregation helpers
  getMetricsByType(type: Metric["type"]): Metric[] {
    return this.metricsBuffer.filter((metric) => metric.type === type);
  }

  getPerformanceStats(operation: string): {
    count: number;
    averageDuration: number;
    successRate: number;
    totalDuration: number;
  } {
    const performanceMetrics = this.getMetricsByType(
      "performance",
    ) as PerformanceMetric[];
    const operationMetrics = performanceMetrics.filter(
      (m) => m.operation === operation,
    );

    if (operationMetrics.length === 0) {
      return { count: 0, averageDuration: 0, successRate: 0, totalDuration: 0 };
    }

    const totalDuration = operationMetrics.reduce(
      (sum, m) => sum + m.duration,
      0,
    );
    const successCount = operationMetrics.filter((m) => m.success).length;

    return {
      count: operationMetrics.length,
      averageDuration: totalDuration / operationMetrics.length,
      successRate: (successCount / operationMetrics.length) * 100,
      totalDuration,
    };
  }

  // Cleanup
  destroy(): void {
    this.flush();
    this.stopAutoFlush();
  }
}

// Create singleton instance
export const metrics = MetricsCollector.getInstance();

// Convenience exports
export const trackPerformance = (
  operation: string,
  duration: number,
  success?: boolean,
  errorType?: string,
  metadata?: Record<string, unknown>,
  userId?: string,
) =>
  metrics.trackPerformance(
    operation,
    duration,
    success,
    errorType,
    metadata,
    userId,
  );

export const trackBusinessEvent = (
  event: string,
  value?: number,
  properties?: Record<string, unknown>,
  userId?: string,
) => metrics.trackBusinessEvent(event, value, properties, userId);

export const trackUsage = (
  feature: string,
  action: string,
  context?: Record<string, unknown>,
  userId?: string,
) => metrics.trackUsage(feature, action, context, userId);

export const trackAIGeneration = (
  model: string,
  duration: number,
  success: boolean,
  outputType: string,
  inputTokens?: number,
  outputTokens?: number,
  userId?: string,
) =>
  metrics.trackAIGeneration(
    model,
    duration,
    success,
    outputType,
    inputTokens,
    outputTokens,
    userId,
  );

export default metrics;
