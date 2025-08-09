/**
 * Alerting system for monitoring and notifying about system issues
 */

import * as Sentry from "@sentry/nextjs";
import { logger } from "./logger";
import { metrics, type Metric } from "./metrics";
import type { HealthCheck, SystemHealth } from "./health-checks";

export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type AlertChannel = "sentry" | "email" | "slack" | "webhook" | "console";

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  enabled: boolean;
  channels: AlertChannel[];
  conditions: AlertCondition[];
  cooldownMinutes?: number; // Prevent alert spam
  metadata?: Record<string, unknown>;
}

export interface AlertCondition {
  type: "metric" | "health_check" | "error_rate" | "response_time" | "custom";
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "contains" | "not_contains";
  value: number | string;
  field?: string; // For metric/health check specific fields
  timeWindow?: number; // Minutes to aggregate over
}

export interface Alert {
  id: string;
  thresholdId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  status: "active" | "acknowledged" | "resolved";
  metadata?: Record<string, unknown>;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

class AlertManager {
  private static instance: AlertManager;
  private thresholds: Map<string, AlertThreshold> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private cooldowns: Map<string, number> = new Map(); // threshold_id -> last_alert_time
  private evaluationInterval = 60000; // 1 minute
  private evaluationTimer?: NodeJS.Timeout;

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  constructor() {
    this.initializeDefaultThresholds();
    this.startEvaluationLoop();
  }

  private initializeDefaultThresholds(): void {
    // Default performance thresholds
    this.addThreshold({
      id: "high_error_rate",
      name: "High Error Rate",
      description: "Error rate exceeds 5% over 5 minutes",
      severity: "error",
      enabled: true,
      channels: ["sentry", "console"],
      conditions: [
        {
          type: "error_rate",
          operator: "gt",
          value: 0.05, // 5%
          timeWindow: 5,
        },
      ],
      cooldownMinutes: 15,
    });

    this.addThreshold({
      id: "slow_response_time",
      name: "Slow Response Time",
      description: "Average response time exceeds 5 seconds",
      severity: "warning",
      enabled: true,
      channels: ["console"],
      conditions: [
        {
          type: "response_time",
          operator: "gt",
          value: 5000, // 5 seconds
          timeWindow: 10,
        },
      ],
      cooldownMinutes: 10,
    });

    this.addThreshold({
      id: "service_unhealthy",
      name: "Service Unhealthy",
      description: "Critical service is unhealthy",
      severity: "critical",
      enabled: true,
      channels: ["sentry", "console"],
      conditions: [
        {
          type: "health_check",
          operator: "eq",
          value: "unhealthy",
          field: "status",
        },
      ],
      cooldownMinutes: 5,
    });

    this.addThreshold({
      id: "high_memory_usage",
      name: "High Memory Usage",
      description: "Memory usage exceeds 90%",
      severity: "warning",
      enabled: true,
      channels: ["console"],
      conditions: [
        {
          type: "metric",
          operator: "gt",
          value: 90,
          field: "memory_percentage",
        },
      ],
      cooldownMinutes: 5,
    });

    this.addThreshold({
      id: "ai_generation_failures",
      name: "AI Generation Failures",
      description: "AI generation failure rate exceeds 20% over 10 minutes",
      severity: "error",
      enabled: true,
      channels: ["sentry", "console"],
      conditions: [
        {
          type: "metric",
          operator: "gt",
          value: 0.2, // 20%
          field: "ai_generation_failure_rate",
          timeWindow: 10,
        },
      ],
      cooldownMinutes: 20,
    });
  }

  private startEvaluationLoop(): void {
    this.evaluationTimer = setInterval(() => {
      this.evaluateAllThresholds();
    }, this.evaluationInterval);
  }

  private stopEvaluationLoop(): void {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
    }
  }

  addThreshold(threshold: AlertThreshold): void {
    this.thresholds.set(threshold.id, threshold);
    logger.debug(`Added alert threshold: ${threshold.name}`, {
      operation: "add_alert_threshold",
      thresholdId: threshold.id,
      severity: threshold.severity,
    });
  }

  removeThreshold(id: string): void {
    this.thresholds.delete(id);
    logger.debug(`Removed alert threshold: ${id}`, {
      operation: "remove_alert_threshold",
      thresholdId: id,
    });
  }

  updateThreshold(id: string, updates: Partial<AlertThreshold>): void {
    const existing = this.thresholds.get(id);
    if (existing) {
      this.thresholds.set(id, { ...existing, ...updates });
      logger.debug(`Updated alert threshold: ${id}`, {
        operation: "update_alert_threshold",
        thresholdId: id,
      });
    }
  }

  getThreshold(id: string): AlertThreshold | undefined {
    return this.thresholds.get(id);
  }

  getAllThresholds(): AlertThreshold[] {
    return Array.from(this.thresholds.values());
  }

  private async evaluateAllThresholds(): Promise<void> {
    const enabledThresholds = Array.from(this.thresholds.values()).filter(
      (t) => t.enabled,
    );

    for (const threshold of enabledThresholds) {
      try {
        await this.evaluateThreshold(threshold);
      } catch (error) {
        logger.error(`Failed to evaluate threshold: ${threshold.id}`, error, {
          operation: "evaluate_threshold",
          thresholdId: threshold.id,
        });
      }
    }
  }

  private async evaluateThreshold(threshold: AlertThreshold): Promise<void> {
    // Check cooldown
    if (this.isInCooldown(threshold.id)) {
      return;
    }

    // Evaluate all conditions (AND logic)
    let triggered = true;

    for (const condition of threshold.conditions) {
      const conditionMet = await this.evaluateCondition(condition);
      if (!conditionMet) {
        triggered = false;
        break;
      }
    }

    if (triggered) {
      await this.triggerAlert(threshold);
    }
  }

  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    switch (condition.type) {
      case "health_check":
        return this.evaluateHealthCheckCondition(condition);

      case "metric":
        return this.evaluateMetricCondition(condition);

      case "error_rate":
        return this.evaluateErrorRateCondition(condition);

      case "response_time":
        return this.evaluateResponseTimeCondition(condition);

      case "custom":
        return this.evaluateCustomCondition(condition);

      default:
        return false;
    }
  }

  private async evaluateHealthCheckCondition(
    condition: AlertCondition,
  ): Promise<boolean> {
    try {
      const response = await fetch("/api/health");
      const health: SystemHealth = await response.json();

      if (condition.field === "status") {
        return this.compareValues(
          health.status,
          condition.operator,
          condition.value,
        );
      }

      // Check individual service health
      const unhealthyServices = health.checks.filter(
        (check) => check.status === "unhealthy",
      );
      return unhealthyServices.length > 0;
    } catch (error) {
      // If we can't fetch health status, consider it unhealthy
      return condition.operator === "eq" && condition.value === "unhealthy";
    }
  }

  private evaluateMetricCondition(condition: AlertCondition): boolean {
    const metricsData = metrics.getMetrics();
    const timeWindow = condition.timeWindow || 5; // Default 5 minutes
    const cutoffTime = Date.now() - timeWindow * 60 * 1000;

    const recentMetrics = metricsData.filter(
      (m) => new Date(m.timestamp).getTime() > cutoffTime,
    );

    switch (condition.field) {
      case "ai_generation_failure_rate":
        return this.calculateAIGenerationFailureRate(recentMetrics, condition);

      case "memory_percentage":
        // This would need to be implemented based on your memory tracking
        return false;

      default:
        return false;
    }
  }

  private calculateAIGenerationFailureRate(
    metricsData: Metric[],
    condition: AlertCondition,
  ): boolean {
    const aiMetrics = metricsData.filter(
      (m) =>
        m.type === "performance" &&
        "operation" in m &&
        m.operation === "ai_generation",
    );

    if (aiMetrics.length === 0) return false;

    const failures = aiMetrics.filter(
      (m) => "success" in m && !m.success,
    ).length;
    const failureRate = failures / aiMetrics.length;

    return this.compareValues(failureRate, condition.operator, condition.value);
  }

  private evaluateErrorRateCondition(condition: AlertCondition): boolean {
    // Calculate error rate from recent metrics
    const metricsData = metrics.getMetrics();
    const timeWindow = condition.timeWindow || 5;
    const cutoffTime = Date.now() - timeWindow * 60 * 1000;

    const recentMetrics = metricsData.filter(
      (m) =>
        new Date(m.timestamp).getTime() > cutoffTime &&
        m.type === "performance",
    );

    if (recentMetrics.length === 0) return false;

    const errors = recentMetrics.filter(
      (m) => "success" in m && !m.success,
    ).length;
    const errorRate = errors / recentMetrics.length;

    return this.compareValues(errorRate, condition.operator, condition.value);
  }

  private evaluateResponseTimeCondition(condition: AlertCondition): boolean {
    const metricsData = metrics.getMetrics();
    const timeWindow = condition.timeWindow || 5;
    const cutoffTime = Date.now() - timeWindow * 60 * 1000;

    const recentMetrics = metricsData.filter(
      (m) =>
        new Date(m.timestamp).getTime() > cutoffTime &&
        m.type === "performance" &&
        "duration" in m,
    );

    if (recentMetrics.length === 0) return false;

    const totalDuration = recentMetrics.reduce(
      (sum, m) => sum + ("duration" in m ? (m as any).duration : 0),
      0,
    );
    const averageResponseTime = totalDuration / recentMetrics.length;

    return this.compareValues(
      averageResponseTime,
      condition.operator,
      condition.value,
    );
  }

  private evaluateCustomCondition(condition: AlertCondition): boolean {
    // Placeholder for custom condition evaluation
    // This would be implemented based on specific business logic
    return false;
  }

  private compareValues(
    actual: any,
    operator: AlertCondition["operator"],
    expected: any,
  ): boolean {
    switch (operator) {
      case "gt":
        return actual > expected;
      case "lt":
        return actual < expected;
      case "eq":
        return actual === expected;
      case "gte":
        return actual >= expected;
      case "lte":
        return actual <= expected;
      case "contains":
        return String(actual).includes(String(expected));
      case "not_contains":
        return !String(actual).includes(String(expected));
      default:
        return false;
    }
  }

  private async triggerAlert(threshold: AlertThreshold): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      thresholdId: threshold.id,
      severity: threshold.severity,
      title: threshold.name,
      message: threshold.description,
      timestamp: new Date().toISOString(),
      status: "active",
      metadata: threshold.metadata,
    };

    // Add to active alerts
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    // Set cooldown
    if (threshold.cooldownMinutes) {
      this.cooldowns.set(
        threshold.id,
        Date.now() + threshold.cooldownMinutes * 60 * 1000,
      );
    }

    logger.error(`Alert triggered: ${threshold.name}`, undefined, {
      operation: "alert_triggered",
      alertId: alert.id,
      thresholdId: threshold.id,
      severity: threshold.severity,
    });

    // Send to configured channels
    for (const channel of threshold.channels) {
      try {
        await this.sendAlertToChannel(alert, channel);
      } catch (error) {
        logger.error(`Failed to send alert to ${channel}`, error, {
          operation: "send_alert",
          alertId: alert.id,
          channel,
        });
      }
    }

    // Track alert metric
    metrics.trackBusinessEvent("alert_triggered", 1, {
      thresholdId: threshold.id,
      severity: threshold.severity,
      channels: threshold.channels,
    });
  }

  private async sendAlertToChannel(
    alert: Alert,
    channel: AlertChannel,
  ): Promise<void> {
    switch (channel) {
      case "sentry":
        Sentry.captureMessage(
          alert.message,
          alert.severity === "critical" ? "fatal" : (alert.severity as any),
        );
        break;

      case "console":
        console.error(`[ALERT] ${alert.title}: ${alert.message}`);
        break;

      case "email":
        // Implement email notification
        await this.sendEmailAlert(alert);
        break;

      case "slack":
        // Implement Slack notification
        await this.sendSlackAlert(alert);
        break;

      case "webhook":
        // Implement webhook notification
        await this.sendWebhookAlert(alert);
        break;
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Placeholder for email implementation
    logger.info("Email alert would be sent", {
      operation: "send_email_alert",
      alertId: alert.id,
    });
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    // Placeholder for Slack implementation
    logger.info("Slack alert would be sent", {
      operation: "send_slack_alert",
      alertId: alert.id,
    });
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    // Placeholder for webhook implementation
    logger.info("Webhook alert would be sent", {
      operation: "send_webhook_alert",
      alertId: alert.id,
    });
  }

  private isInCooldown(thresholdId: string): boolean {
    const cooldownEnd = this.cooldowns.get(thresholdId);
    return cooldownEnd ? Date.now() < cooldownEnd : false;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for alert management
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert && alert.status === "active") {
      alert.status = "acknowledged";
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();

      logger.info(`Alert acknowledged: ${alertId}`, {
        operation: "alert_acknowledged",
        alertId,
        acknowledgedBy,
      });

      return true;
    }
    return false;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.status = "resolved";
      alert.resolvedAt = new Date().toISOString();
      this.activeAlerts.delete(alertId);

      logger.info(`Alert resolved: ${alertId}`, {
        operation: "alert_resolved",
        alertId,
      });

      return true;
    }
    return false;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit?: number): Alert[] {
    if (limit) {
      return this.alertHistory.slice(-limit);
    }
    return this.alertHistory;
  }

  getAlert(alertId: string): Alert | undefined {
    return (
      this.activeAlerts.get(alertId) ||
      this.alertHistory.find((alert) => alert.id === alertId)
    );
  }

  // Test method for triggering test alerts
  triggerTestAlert(severity: AlertSeverity = "info"): void {
    const testThreshold: AlertThreshold = {
      id: "test_alert",
      name: "Test Alert",
      description: "This is a test alert to verify the alerting system",
      severity,
      enabled: true,
      channels: ["console"],
      conditions: [],
    };

    this.triggerAlert(testThreshold);
  }

  // Cleanup
  destroy(): void {
    this.stopEvaluationLoop();
  }
}

export const alertManager = AlertManager.getInstance();

// Convenience exports
export const addThreshold = (threshold: AlertThreshold) =>
  alertManager.addThreshold(threshold);
export const triggerTestAlert = (severity?: AlertSeverity) =>
  alertManager.triggerTestAlert(severity);
export const acknowledgeAlert = (alertId: string, acknowledgedBy: string) =>
  alertManager.acknowledgeAlert(alertId, acknowledgedBy);
export const resolveAlert = (alertId: string) =>
  alertManager.resolveAlert(alertId);

export default alertManager;
