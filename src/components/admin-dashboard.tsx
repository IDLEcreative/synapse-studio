"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  Clock,
  Database,
  Download,
  Eye,
  Flag,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import { StatusPage } from "./status-page";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { alertManager, type Alert, type AlertThreshold } from "@/lib/alerting";
import { featureFlags, type FeatureFlag } from "@/lib/feature-flags";
import type { SystemHealth } from "@/lib/health-checks";

interface AdminDashboardProps {
  className?: string;
}

export function AdminDashboard({ className = "" }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch system health
      const healthResponse = await fetch("/api/health");
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setSystemHealth(health);
      }

      // Get metrics from local buffer
      setMetricsData(metrics.getMetrics());

      // Get alerts
      setAlerts(alertManager.getActiveAlerts());

      // Get alert thresholds
      setThresholds(alertManager.getAllThresholds());

      // Get feature flags
      setFlags(featureFlags.getAllFlags());

      setLastUpdated(new Date());
    } catch (error) {
      logger.error("Failed to fetch admin dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricsSummary = () => {
    const performanceMetrics = metricsData.filter(
      (m) => m.type === "performance",
    );
    const businessMetrics = metricsData.filter((m) => m.type === "business");
    const usageMetrics = metricsData.filter((m) => m.type === "usage");

    const totalErrors = performanceMetrics.filter((m) => !m.success).length;
    const errorRate =
      performanceMetrics.length > 0
        ? (totalErrors / performanceMetrics.length) * 100
        : 0;

    const avgResponseTime =
      performanceMetrics.length > 0
        ? performanceMetrics.reduce((sum, m) => sum + m.duration, 0) /
          performanceMetrics.length
        : 0;

    return {
      total: metricsData.length,
      performance: performanceMetrics.length,
      business: businessMetrics.length,
      usage: usageMetrics.length,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
    };
  };

  const getAlertsSummary = () => {
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const error = alerts.filter((a) => a.severity === "error").length;
    const warning = alerts.filter((a) => a.severity === "warning").length;
    const info = alerts.filter((a) => a.severity === "info").length;

    return { total: alerts.length, critical, error, warning, info };
  };

  const getFlagsSummary = () => {
    const enabled = flags.filter((f) => f.enabled).length;
    const withRollout = flags.filter(
      (f) => f.rolloutPercentage && f.rolloutPercentage < 100,
    ).length;

    return {
      total: flags.length,
      enabled,
      disabled: flags.length - enabled,
      withRollout,
    };
  };

  const handleToggleFlag = (key: string, enabled: boolean) => {
    featureFlags.updateFlag(key, { enabled });
    setFlags(featureFlags.getAllFlags());

    logger.info(`Feature flag ${enabled ? "enabled" : "disabled"}: ${key}`, {
      operation: "admin_toggle_flag",
      flagKey: key,
      enabled,
    });
  };

  const handleToggleThreshold = (id: string, enabled: boolean) => {
    alertManager.updateThreshold(id, { enabled });
    setThresholds(alertManager.getAllThresholds());

    logger.info(`Alert threshold ${enabled ? "enabled" : "disabled"}: ${id}`, {
      operation: "admin_toggle_threshold",
      thresholdId: id,
      enabled,
    });
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    alertManager.acknowledgeAlert(alertId, "admin");
    setAlerts(alertManager.getActiveAlerts());
  };

  const handleResolveAlert = (alertId: string) => {
    alertManager.resolveAlert(alertId);
    setAlerts(alertManager.getActiveAlerts());
  };

  const exportMetrics = () => {
    const data = JSON.stringify(metricsData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportLogs = () => {
    const data = logger.exportLogs("json");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const metricsSummary = getMetricsSummary();
  const alertsSummary = getAlertsSummary();
  const flagsSummary = getFlagsSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System monitoring and configuration
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        <Button onClick={fetchAllData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Health
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="flags">
            <Flag className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {systemHealth ? (
                    <Badge
                      variant={
                        systemHealth.status === "healthy"
                          ? "default"
                          : systemHealth.status === "degraded"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {systemHealth.status}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Loading...</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {systemHealth &&
                    `${systemHealth.summary.healthy}/${systemHealth.summary.total} services`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Alerts
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{alertsSummary.total}</div>
                <p className="text-xs text-muted-foreground">
                  {alertsSummary.critical} critical, {alertsSummary.error}{" "}
                  errors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsSummary.errorRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Last {metricsSummary.performance} operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsSummary.avgResponseTime}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Performance metrics
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                Active alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No active alerts
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            alert.severity === "critical"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Flags Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags Summary</CardTitle>
              <CardDescription>Current feature flag status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Flags</p>
                  <p className="text-2xl font-bold">{flagsSummary.total}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Enabled</p>
                  <p className="text-2xl font-bold text-green-600">
                    {flagsSummary.enabled}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Disabled</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {flagsSummary.disabled}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">With Rollout</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {flagsSummary.withRollout}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <StatusPage />
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Metrics Overview</h3>
              <p className="text-muted-foreground">
                {metricsSummary.total} total metrics collected
              </p>
            </div>
            <Button onClick={exportMetrics}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsSummary.performance}
                </div>
                <p className="text-sm text-muted-foreground">
                  Operations tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Business Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metricsSummary.business}
                </div>
                <p className="text-sm text-muted-foreground">Events recorded</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metricsSummary.usage}</div>
                <p className="text-sm text-muted-foreground">User actions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {metricsData.slice(-20).map((metric, index) => (
                  <div key={index} className="p-3 border rounded text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{metric.type}</Badge>
                      <span className="text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">
                      {JSON.stringify(metric, null, 2).substring(0, 200)}...
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Alert Management</h3>
              <p className="text-muted-foreground">
                {thresholds.length} thresholds configured
              </p>
            </div>
            <Button onClick={() => alertManager.triggerTestAlert("info")}>
              Test Alert
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No active alerts
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              alert.severity === "critical"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium mt-2">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {thresholds.map((threshold) => (
                    <div
                      key={threshold.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <h4 className="font-medium">{threshold.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {threshold.description}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {threshold.severity}
                        </Badge>
                      </div>
                      <Switch
                        checked={threshold.enabled}
                        onCheckedChange={(enabled) =>
                          handleToggleThreshold(threshold.id, enabled)
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feature Flags Tab */}
        <TabsContent value="flags" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Feature Flags</h3>
              <p className="text-muted-foreground">
                {flags.length} flags configured
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {flags.map((flag) => (
              <Card key={flag.key}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{flag.name}</h4>
                        <Badge variant="outline">{flag.key}</Badge>
                        {flag.rolloutPercentage !== undefined &&
                          flag.rolloutPercentage < 100 && (
                            <Badge variant="secondary">
                              {flag.rolloutPercentage}% rollout
                            </Badge>
                          )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                      {flag.userSegments && flag.userSegments.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Users className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">
                            Segments: {flag.userSegments.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleFlag(flag.key, enabled)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Global system settings and utilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Log Level</Label>
                  <Select
                    value={logger.getLevel().toString()}
                    onValueChange={(v) => logger.setLevel(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">DEBUG</SelectItem>
                      <SelectItem value="1">INFO</SelectItem>
                      <SelectItem value="2">WARN</SelectItem>
                      <SelectItem value="3">ERROR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Data Export</h4>
                <div className="flex space-x-2">
                  <Button onClick={exportLogs} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                  <Button onClick={exportMetrics} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Metrics
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">System Actions</h4>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => logger.clearLogBuffer()}
                    variant="outline"
                  >
                    Clear Logs
                  </Button>
                  <Button
                    onClick={() => metrics.clearMetrics()}
                    variant="outline"
                  >
                    Clear Metrics
                  </Button>
                  <Button
                    onClick={() => alertManager.triggerTestAlert("warning")}
                    variant="outline"
                  >
                    Test Alert
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
