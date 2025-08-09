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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Bug,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Clock,
  Database,
  Zap,
  Activity,
} from "lucide-react";
import { logger, LogLevel } from "@/lib/logger";
import { metrics } from "@/lib/metrics";
import { alertManager } from "@/lib/alerting";

interface DebugPanelProps {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  defaultVisible?: boolean;
}

export function DebugPanel({
  position = "bottom-right",
  defaultVisible = false,
}: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [activeTab, setActiveTab] = useState("logs");
  const [logLevel, setLogLevel] = useState<LogLevel>(logger.getLevel());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [logs, setLogs] = useState<any[]>([]);
  const [metricsData, setMetricsData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>({});

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    // Get logs from logger buffer
    setLogs(logger.getLogBuffer());

    // Get metrics
    setMetricsData(metrics.getMetrics());

    // Get alerts
    setAlerts(alertManager.getActiveAlerts());

    // Get system info
    setSystemInfo({
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "N/A",
      url: typeof window !== "undefined" ? window.location.href : "N/A",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "N/A",
      memory: getMemoryInfo(),
      performance: getPerformanceInfo(),
    });
  };

  const getMemoryInfo = () => {
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      };
    }
    return null;
  };

  const getPerformanceInfo = () => {
    if (typeof window !== "undefined" && "performance" in window) {
      return {
        timeOrigin: Math.round(performance.timeOrigin),
        now: Math.round(performance.now()),
        navigation: performance.navigation
          ? {
              type: performance.navigation.type,
              redirectCount: performance.navigation.redirectCount,
            }
          : null,
      };
    }
    return null;
  };

  const handleLogLevelChange = (newLevel: string) => {
    const level = parseInt(newLevel) as LogLevel;
    setLogLevel(level);
    logger.setLevel(level);
  };

  const clearLogs = () => {
    logger.clearLogBuffer();
    setLogs([]);
  };

  const clearMetrics = () => {
    metrics.clearMetrics();
    setMetricsData([]);
  };

  const exportLogs = (format: "json" | "csv" = "json") => {
    const data = logger.exportLogs(format);
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synapse-logs-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportMetrics = () => {
    const data = JSON.stringify(metricsData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synapse-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerTestLog = (level: string) => {
    const message = `Test ${level} message - ${new Date().toISOString()}`;
    switch (level) {
      case "debug":
        logger.debug(message, { component: "debug_panel", test: true });
        break;
      case "info":
        logger.info(message, { component: "debug_panel", test: true });
        break;
      case "warn":
        logger.warn(message, { component: "debug_panel", test: true });
        break;
      case "error":
        logger.error(message, new Error("Test error"), {
          component: "debug_panel",
          test: true,
        });
        break;
    }
    refreshData();
  };

  const triggerTestMetric = (type: string) => {
    switch (type) {
      case "performance":
        metrics.trackPerformance(
          "test_operation",
          Math.random() * 1000,
          Math.random() > 0.5,
        );
        break;
      case "business":
        metrics.trackBusinessEvent(
          "test_event",
          Math.floor(Math.random() * 100),
        );
        break;
      case "usage":
        metrics.trackUsage("debug_panel", "test_action");
        break;
    }
    refreshData();
  };

  const triggerTestAlert = () => {
    alertManager.triggerTestAlert("warning");
    refreshData();
  };

  const getPositionClasses = () => {
    switch (position) {
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      default:
        return "bottom-4 right-4";
    }
  };

  const formatLogLevel = (level: string) => {
    const colors = {
      DEBUG: "text-blue-600",
      INFO: "text-green-600",
      WARN: "text-yellow-600",
      ERROR: "text-red-600",
    };
    return (
      <span className={colors[level as keyof typeof colors] || "text-gray-600"}>
        {level}
      </span>
    );
  };

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          className={`fixed ${getPositionClasses()} z-50 shadow-lg`}
          variant="outline"
        >
          <Bug className="h-4 w-4" />
        </Button>
      )}

      {/* Debug Panel */}
      {isVisible && (
        <div
          className={`fixed ${getPositionClasses()} z-50 w-[600px] h-[500px] shadow-2xl border rounded-lg bg-background`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bug className="h-5 w-5" />
                  <CardTitle className="text-lg">Debug Panel</CardTitle>
                  <Badge variant="secondary">DEV</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    size="sm"
                    variant="outline"
                  >
                    {autoRefresh ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button onClick={refreshData} size="sm" variant="outline">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => setIsVisible(false)}
                    size="sm"
                    variant="outline"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="h-full flex flex-col"
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="logs" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Logs
                  </TabsTrigger>
                  <TabsTrigger value="metrics" className="text-xs">
                    <Database className="h-3 w-3 mr-1" />
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Alerts
                  </TabsTrigger>
                  <TabsTrigger value="system" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    System
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="text-xs">
                    Tools
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="logs"
                  className="flex-1 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="log-level">Level:</Label>
                      <Select
                        value={logLevel.toString()}
                        onValueChange={handleLogLevelChange}
                      >
                        <SelectTrigger className="w-24">
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
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => exportLogs("json")}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button onClick={clearLogs} size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-[320px] overflow-y-auto text-xs font-mono bg-muted/50 rounded p-2">
                    {logs.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">
                        No logs available
                      </div>
                    ) : (
                      logs.slice(-50).map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-muted-foreground">
                            {log.timestamp.slice(11, 19)}
                          </span>{" "}
                          {formatLogLevel(log.level)} <span>{log.message}</span>
                          {log.context && (
                            <span className="text-muted-foreground">
                              {" "}
                              | {JSON.stringify(log.context)}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="metrics"
                  className="flex-1 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {metricsData.length} metrics
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        onClick={exportMetrics}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={clearMetrics}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="h-[320px] overflow-y-auto text-xs bg-muted/50 rounded p-2">
                    {metricsData.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">
                        No metrics available
                      </div>
                    ) : (
                      metricsData.slice(-20).map((metric, index) => (
                        <div key={index} className="mb-2 p-2 border rounded">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{metric.type}</Badge>
                            <span className="text-muted-foreground">
                              {new Date(metric.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {JSON.stringify(metric, null, 2)}
                          </pre>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="alerts"
                  className="flex-1 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">
                      {alerts.length} active alerts
                    </Badge>
                    <Button
                      onClick={triggerTestAlert}
                      size="sm"
                      variant="outline"
                    >
                      Test Alert
                    </Button>
                  </div>

                  <div className="h-[320px] overflow-y-auto text-xs bg-muted/50 rounded p-2">
                    {alerts.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">
                        No active alerts
                      </div>
                    ) : (
                      alerts.map((alert, index) => (
                        <div key={index} className="mb-2 p-2 border rounded">
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
                            <span className="text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="mt-1">
                            <div className="font-semibold">{alert.title}</div>
                            <div className="text-muted-foreground">
                              {alert.message}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="system"
                  className="flex-1 space-y-2 overflow-hidden"
                >
                  <div className="h-[360px] overflow-y-auto text-xs bg-muted/50 rounded p-2">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(systemInfo, null, 2)}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent
                  value="tools"
                  className="flex-1 space-y-4 overflow-hidden"
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Test Logs</h4>
                      <div className="flex space-x-2">
                        {["debug", "info", "warn", "error"].map((level) => (
                          <Button
                            key={level}
                            onClick={() => triggerTestLog(level)}
                            size="sm"
                            variant="outline"
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Test Metrics</h4>
                      <div className="flex space-x-2">
                        {["performance", "business", "usage"].map((type) => (
                          <Button
                            key={type}
                            onClick={() => triggerTestMetric(type)}
                            size="sm"
                            variant="outline"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-2">Settings</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-refresh"
                            checked={autoRefresh}
                            onCheckedChange={setAutoRefresh}
                          />
                          <Label htmlFor="auto-refresh">Auto Refresh</Label>
                        </div>

                        {autoRefresh && (
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="interval">Interval (ms):</Label>
                            <Select
                              value={refreshInterval.toString()}
                              onValueChange={(v) =>
                                setRefreshInterval(parseInt(v))
                              }
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1000">1s</SelectItem>
                                <SelectItem value="5000">5s</SelectItem>
                                <SelectItem value="10000">10s</SelectItem>
                                <SelectItem value="30000">30s</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
