import { NextRequest, NextResponse } from "next/server";
import { metrics, type Metric } from "@/lib/metrics";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const correlationId = logger.setCorrelationId("metrics-ingestion");

  try {
    const body = await request.json();
    const { metrics: incomingMetrics } = body;

    if (!Array.isArray(incomingMetrics)) {
      return NextResponse.json(
        { error: "Invalid metrics format. Expected array of metrics." },
        { status: 400 },
      );
    }

    logger.info(`Received ${incomingMetrics.length} metrics for processing`, {
      operation: "metrics_ingestion",
      correlationId,
      count: incomingMetrics.length,
    });

    // Validate and process metrics
    const processedMetrics: Metric[] = [];

    for (const metric of incomingMetrics) {
      if (isValidMetric(metric)) {
        processedMetrics.push(metric);
      } else {
        logger.warn("Invalid metric received", {
          operation: "metrics_validation",
          correlationId,
          metric: JSON.stringify(metric).substring(0, 200),
        });
      }
    }

    // In a production environment, you would:
    // 1. Store metrics in a time-series database
    // 2. Send to analytics platforms
    // 3. Trigger alerts based on thresholds
    // 4. Update dashboards

    // For now, we'll log them for debugging
    if (process.env.NODE_ENV === "development") {
      logger.debug("Metrics received", {
        operation: "metrics_debug",
        correlationId,
        metrics: processedMetrics,
      });
    }

    return NextResponse.json({
      success: true,
      processed: processedMetrics.length,
      rejected: incomingMetrics.length - processedMetrics.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error processing metrics", error, {
      operation: "metrics_ingestion",
      correlationId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    logger.clearCorrelationId("metrics-ingestion");
  }
}

export async function GET(request: NextRequest) {
  const correlationId = logger.setCorrelationId("metrics-export");

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as Metric["type"] | null;
    const format = searchParams.get("format") || "json";
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    // Get metrics from buffer (in production, this would query your metrics store)
    let metricsData = metrics.getMetrics();

    // Filter by type if specified
    if (type) {
      metricsData = metricsData.filter((m) => m.type === type);
    }

    // Filter by date range if specified
    if (since || until) {
      const sinceDate = since ? new Date(since) : new Date(0);
      const untilDate = until ? new Date(until) : new Date();

      metricsData = metricsData.filter((m) => {
        const metricDate = new Date(m.timestamp);
        return metricDate >= sinceDate && metricDate <= untilDate;
      });
    }

    logger.info(`Exporting ${metricsData.length} metrics`, {
      operation: "metrics_export",
      correlationId,
      type,
      format,
      count: metricsData.length,
    });

    if (format === "csv") {
      const csv = convertMetricsToCSV(metricsData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=metrics.csv",
          "X-Correlation-Id": correlationId,
        },
      });
    }

    // Default JSON format
    return NextResponse.json(
      {
        metrics: metricsData,
        count: metricsData.length,
        timestamp: new Date().toISOString(),
        filters: { type, since, until },
      },
      {
        headers: {
          "X-Correlation-Id": correlationId,
        },
      },
    );
  } catch (error) {
    logger.error("Error exporting metrics", error, {
      operation: "metrics_export",
      correlationId,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    logger.clearCorrelationId("metrics-export");
  }
}

function isValidMetric(metric: any): metric is Metric {
  return (
    typeof metric === "object" &&
    metric !== null &&
    typeof metric.timestamp === "string" &&
    typeof metric.type === "string" &&
    ["performance", "business", "usage"].includes(metric.type)
  );
}

function convertMetricsToCSV(metricsData: Metric[]): string {
  if (metricsData.length === 0) {
    return "timestamp,type\n";
  }

  // Get all unique keys from all metrics
  const allKeys = new Set<string>();
  metricsData.forEach((metric) => {
    Object.keys(metric).forEach((key) => allKeys.add(key));
  });

  const headers = Array.from(allKeys).sort();
  const csvRows = [headers.join(",")];

  metricsData.forEach((metric) => {
    const row = headers.map((header) => {
      const value = (metric as any)[header];
      if (value === undefined || value === null) {
        return "";
      }
      if (typeof value === "object") {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      if (
        typeof value === "string" &&
        (value.includes(",") || value.includes('"'))
      ) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}
