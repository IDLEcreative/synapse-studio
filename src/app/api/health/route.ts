import { NextRequest, NextResponse } from "next/server";
import { healthChecker, type SystemHealth } from "@/lib/health-checks";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = logger.setCorrelationId("health-check");

  try {
    logger.info("Health check requested", {
      operation: "health_check_api",
      correlationId,
      url: request.url,
      userAgent: request.headers.get("user-agent"),
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const checkName = searchParams.get("check");
    const format = searchParams.get("format") || "json";
    const includeDetails = searchParams.get("details") !== "false";

    let result: SystemHealth | any;

    if (checkName) {
      // Run specific health check
      const singleCheck = await healthChecker.runCheck(checkName);

      if (!singleCheck) {
        return NextResponse.json(
          {
            error: "Health check not found",
            availableChecks: Array.from(healthChecker["checks"].keys()),
          },
          { status: 404 },
        );
      }

      result = singleCheck;
    } else {
      // Run all health checks
      result = await healthChecker.runAllChecks();
    }

    const duration = Date.now() - startTime;

    // Track metrics
    metrics.trackPerformance("health_check", duration, true, undefined, {
      checkName: checkName || "all",
      systemStatus: "status" in result ? result.status : result.status,
    });

    logger.info("Health check completed", {
      operation: "health_check_api",
      correlationId,
      duration,
      status: "status" in result ? result.status : result.status,
      checkName: checkName || "all",
    });

    // Format response based on requested format
    if (format === "prometheus") {
      return new NextResponse(formatPrometheusMetrics(result), {
        headers: {
          "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
          "X-Correlation-Id": correlationId,
        },
      });
    }

    // Determine HTTP status code based on health status
    let statusCode = 200;
    const healthStatus = "status" in result ? result.status : result.status;

    if (healthStatus === "unhealthy") {
      statusCode = 503; // Service Unavailable
    } else if (healthStatus === "degraded") {
      statusCode = 200; // OK but with warnings
    }

    // Filter response based on details parameter
    let responseBody = result;
    if (!includeDetails && "checks" in result) {
      responseBody = {
        status: result.status,
        timestamp: result.timestamp,
        summary: result.summary,
        version: result.version,
        environment: result.environment,
      };
    }

    return NextResponse.json(responseBody, {
      status: statusCode,
      headers: {
        "X-Correlation-Id": correlationId,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Status": healthStatus,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error("Health check failed", error, {
      operation: "health_check_api",
      correlationId,
      duration,
    });

    metrics.trackPerformance(
      "health_check",
      duration,
      false,
      "health_check_error",
      {
        errorType: error instanceof Error ? error.name : "unknown",
      },
    );

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId,
      },
      {
        status: 500,
        headers: {
          "X-Correlation-Id": correlationId,
        },
      },
    );
  } finally {
    logger.clearCorrelationId("health-check");
  }
}

function formatPrometheusMetrics(health: SystemHealth | any): string {
  const timestamp = Date.now();
  const isSystemHealth = "checks" in health;

  if (isSystemHealth) {
    const systemHealth = health as SystemHealth;

    const metrics = [
      `# HELP system_health_status System health status (0=unhealthy, 1=degraded, 2=healthy)`,
      `# TYPE system_health_status gauge`,
      `system_health_status ${getHealthValue(systemHealth.status)} ${timestamp}`,
      "",
      `# HELP system_uptime_seconds System uptime in seconds`,
      `# TYPE system_uptime_seconds counter`,
      `system_uptime_seconds ${systemHealth.uptime} ${timestamp}`,
      "",
      `# HELP health_check_duration_ms Health check execution duration in milliseconds`,
      `# TYPE health_check_duration_ms histogram`,
    ];

    // Add individual check metrics
    for (const check of systemHealth.checks) {
      metrics.push(
        `health_check_status{check="${check.name}"} ${getHealthValue(check.status)} ${timestamp}`,
        `health_check_duration_ms{check="${check.name}"} ${check.responseTime} ${timestamp}`,
      );
    }

    return metrics.join("\n");
  } else {
    // Single check
    return [
      `# HELP health_check_status Health check status (0=unhealthy, 1=degraded, 2=healthy)`,
      `# TYPE health_check_status gauge`,
      `health_check_status{check="${health.name}"} ${getHealthValue(health.status)} ${timestamp}`,
      "",
      `# HELP health_check_duration_ms Health check duration in milliseconds`,
      `# TYPE health_check_duration_ms gauge`,
      `health_check_duration_ms{check="${health.name}"} ${health.responseTime} ${timestamp}`,
    ].join("\n");
  }
}

function getHealthValue(status: string): number {
  switch (status) {
    case "healthy":
      return 2;
    case "degraded":
      return 1;
    case "unhealthy":
      return 0;
    default:
      return 0;
  }
}

// HEAD request for simple health check
export async function HEAD(request: NextRequest) {
  try {
    // Quick health check without full details
    const health = await healthChecker.runAllChecks();

    let statusCode = 200;
    if (health.status === "unhealthy") {
      statusCode = 503;
    }

    return new NextResponse(null, {
      status: statusCode,
      headers: {
        "X-Health-Status": health.status,
        "X-Timestamp": health.timestamp,
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 500,
      headers: {
        "X-Health-Status": "unhealthy",
        "X-Timestamp": new Date().toISOString(),
      },
    });
  }
}
