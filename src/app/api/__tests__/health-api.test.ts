import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { NextRequest } from "next/server";
import { GET, HEAD } from "../health/route";

// Mock dependencies
jest.mock("@/lib/health-checks", () => ({
  healthChecker: {
    runAllChecks: jest.fn(),
    runCheck: jest.fn(),
    checks: new Map(),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    setCorrelationId: jest.fn(() => "test-correlation-id"),
    clearCorrelationId: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/metrics", () => ({
  metrics: {
    trackPerformance: jest.fn(),
  },
}));

const createMockRequest = (
  url: string,
  headers: Record<string, string> = {},
) => {
  const headersMap = new Map(Object.entries(headers));

  return {
    url,
    headers: {
      get: (name: string) => headersMap.get(name.toLowerCase()) || null,
    },
  } as NextRequest;
};

describe("Health API Route Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return healthy status when all checks pass", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 3600,
        version: "1.0.0",
        environment: "test",
        summary: {
          total: 3,
          healthy: 3,
          degraded: 0,
          unhealthy: 0,
        },
        checks: [
          {
            name: "database",
            status: "healthy",
            responseTime: 50,
            details: "Connected successfully",
          },
          {
            name: "external-api",
            status: "healthy",
            responseTime: 100,
            details: "API responding normally",
          },
          {
            name: "storage",
            status: "healthy",
            responseTime: 25,
            details: "Storage accessible",
          },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await GET(req);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.status).toBe("healthy");
      expect(responseData.checks).toHaveLength(3);
      expect(responseData.summary.total).toBe(3);
      expect(responseData.summary.healthy).toBe(3);
    });

    it("should return degraded status with 200 when some checks are degraded", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "degraded",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 3600,
        version: "1.0.0",
        environment: "test",
        summary: {
          total: 3,
          healthy: 2,
          degraded: 1,
          unhealthy: 0,
        },
        checks: [
          {
            name: "database",
            status: "healthy",
            responseTime: 50,
            details: "Connected successfully",
          },
          {
            name: "external-api",
            status: "degraded",
            responseTime: 2000,
            details: "API responding slowly",
            error: "Response time above threshold",
          },
          {
            name: "storage",
            status: "healthy",
            responseTime: 25,
            details: "Storage accessible",
          },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await GET(req);

      expect(response.status).toBe(200);

      const responseData = await response.json();
      expect(responseData.status).toBe("degraded");
      expect(responseData.summary.degraded).toBe(1);
      expect(response.headers.get("X-Health-Status")).toBe("degraded");
    });

    it("should return unhealthy status with 503 when checks fail", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "unhealthy",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 3600,
        version: "1.0.0",
        environment: "test",
        summary: {
          total: 3,
          healthy: 1,
          degraded: 0,
          unhealthy: 2,
        },
        checks: [
          {
            name: "database",
            status: "unhealthy",
            responseTime: 0,
            details: "Connection failed",
            error: "ECONNREFUSED",
          },
          {
            name: "external-api",
            status: "unhealthy",
            responseTime: 0,
            details: "API unreachable",
            error: "Network timeout",
          },
          {
            name: "storage",
            status: "healthy",
            responseTime: 25,
            details: "Storage accessible",
          },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await GET(req);

      expect(response.status).toBe(503);

      const responseData = await response.json();
      expect(responseData.status).toBe("unhealthy");
      expect(responseData.summary.unhealthy).toBe(2);
      expect(response.headers.get("X-Health-Status")).toBe("unhealthy");
    });

    it("should run specific health check when check parameter is provided", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockSingleCheck = {
        name: "database",
        status: "healthy",
        responseTime: 50,
        details: "Connected successfully",
      };

      healthChecker.runCheck.mockResolvedValue(mockSingleCheck);

      const req = createMockRequest(
        "http://localhost:3000/api/health?check=database",
      );
      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(healthChecker.runCheck).toHaveBeenCalledWith("database");

      const responseData = await response.json();
      expect(responseData.name).toBe("database");
      expect(responseData.status).toBe("healthy");
    });

    it("should return 404 for non-existent health check", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      healthChecker.runCheck.mockResolvedValue(null);
      healthChecker.checks = new Map([
        ["database", {}],
        ["api", {}],
      ]);

      const req = createMockRequest(
        "http://localhost:3000/api/health?check=nonexistent",
      );
      const response = await GET(req);

      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData.error).toBe("Health check not found");
      expect(responseData.availableChecks).toEqual(["database", "api"]);
    });

    it("should return simplified response when details=false", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 3600,
        version: "1.0.0",
        environment: "test",
        summary: {
          total: 3,
          healthy: 3,
          degraded: 0,
          unhealthy: 0,
        },
        checks: [
          {
            name: "database",
            status: "healthy",
            responseTime: 50,
            details: "Connected successfully",
          },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest(
        "http://localhost:3000/api/health?details=false",
      );
      const response = await GET(req);

      const responseData = await response.json();
      expect(responseData.checks).toBeUndefined();
      expect(responseData.status).toBe("healthy");
      expect(responseData.summary).toBeDefined();
      expect(responseData.version).toBeDefined();
    });

    it("should return Prometheus format when format=prometheus", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        uptime: 3600,
        version: "1.0.0",
        environment: "test",
        summary: {
          total: 2,
          healthy: 2,
          degraded: 0,
          unhealthy: 0,
        },
        checks: [
          {
            name: "database",
            status: "healthy",
            responseTime: 50,
          },
          {
            name: "api",
            status: "healthy",
            responseTime: 100,
          },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest(
        "http://localhost:3000/api/health?format=prometheus",
      );
      const response = await GET(req);

      expect(response.headers.get("Content-Type")).toBe(
        "text/plain; version=0.0.4; charset=utf-8",
      );

      const responseText = await response.text();
      expect(responseText).toContain("# HELP system_health_status");
      expect(responseText).toContain("system_health_status 2");
      expect(responseText).toContain('health_check_status{check="database"} 2');
      expect(responseText).toContain('health_check_status{check="api"} 2');
    });

    it("should handle errors gracefully", async () => {
      const { healthChecker } = require("@/lib/health-checks");
      const { logger } = require("@/lib/logger");
      const { metrics } = require("@/lib/metrics");

      healthChecker.runAllChecks.mockRejectedValue(
        new Error("Health check failed"),
      );

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await GET(req);

      expect(response.status).toBe(500);

      const responseData = await response.json();
      expect(responseData.status).toBe("unhealthy");
      expect(responseData.error).toBe("Health check failed");
      expect(responseData.correlationId).toBe("test-correlation-id");

      expect(logger.error).toHaveBeenCalledWith(
        "Health check failed",
        expect.any(Error),
        expect.objectContaining({ operation: "health_check_api" }),
      );

      expect(metrics.trackPerformance).toHaveBeenCalledWith(
        "health_check",
        expect.any(Number),
        false,
        "health_check_error",
        expect.objectContaining({ errorType: "Error" }),
      );
    });

    it("should set proper cache control headers", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      healthChecker.runAllChecks.mockResolvedValue({
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        checks: [],
      });

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await GET(req);

      expect(response.headers.get("Cache-Control")).toBe(
        "no-cache, no-store, must-revalidate",
      );
      expect(response.headers.get("X-Correlation-Id")).toBe(
        "test-correlation-id",
      );
    });

    it("should track metrics for successful checks", async () => {
      const { healthChecker } = require("@/lib/health-checks");
      const { metrics } = require("@/lib/metrics");

      const mockHealthData = {
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
        checks: [],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest("http://localhost:3000/api/health");
      await GET(req);

      expect(metrics.trackPerformance).toHaveBeenCalledWith(
        "health_check",
        expect.any(Number),
        true,
        undefined,
        expect.objectContaining({
          checkName: "all",
          systemStatus: "healthy",
        }),
      );
    });
  });

  describe("HEAD /api/health", () => {
    it("should return 200 for healthy status", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      healthChecker.runAllChecks.mockResolvedValue({
        status: "healthy",
        timestamp: "2024-01-01T00:00:00Z",
      });

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await HEAD(req);

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Health-Status")).toBe("healthy");
      expect(response.headers.get("X-Timestamp")).toBe("2024-01-01T00:00:00Z");

      // HEAD should not have a body
      const text = await response.text();
      expect(text).toBe("");
    });

    it("should return 503 for unhealthy status", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      healthChecker.runAllChecks.mockResolvedValue({
        status: "unhealthy",
        timestamp: "2024-01-01T00:00:00Z",
      });

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await HEAD(req);

      expect(response.status).toBe(503);
      expect(response.headers.get("X-Health-Status")).toBe("unhealthy");
    });

    it("should handle errors in HEAD request", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      healthChecker.runAllChecks.mockRejectedValue(
        new Error("Health check failed"),
      );

      const req = createMockRequest("http://localhost:3000/api/health");
      const response = await HEAD(req);

      expect(response.status).toBe(500);
      expect(response.headers.get("X-Health-Status")).toBe("unhealthy");
      expect(response.headers.get("X-Timestamp")).toBeTruthy();
    });
  });

  describe("Prometheus metrics formatting", () => {
    it("should format single check for Prometheus", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockSingleCheck = {
        name: "database",
        status: "healthy",
        responseTime: 50,
      };

      healthChecker.runCheck.mockResolvedValue(mockSingleCheck);

      const req = createMockRequest(
        "http://localhost:3000/api/health?check=database&format=prometheus",
      );
      const response = await GET(req);

      const responseText = await response.text();
      expect(responseText).toContain('health_check_status{check="database"} 2');
      expect(responseText).toContain(
        'health_check_duration_ms{check="database"} 50',
      );
    });

    it("should handle different health status values in Prometheus format", async () => {
      const { healthChecker } = require("@/lib/health-checks");

      const mockHealthData = {
        status: "degraded",
        uptime: 3600,
        checks: [
          { name: "healthy-check", status: "healthy", responseTime: 50 },
          { name: "degraded-check", status: "degraded", responseTime: 1500 },
          { name: "unhealthy-check", status: "unhealthy", responseTime: 0 },
        ],
      };

      healthChecker.runAllChecks.mockResolvedValue(mockHealthData);

      const req = createMockRequest(
        "http://localhost:3000/api/health?format=prometheus",
      );
      const response = await GET(req);

      const responseText = await response.text();
      expect(responseText).toContain("system_health_status 1"); // degraded = 1
      expect(responseText).toContain(
        'health_check_status{check="healthy-check"} 2',
      ); // healthy = 2
      expect(responseText).toContain(
        'health_check_status{check="degraded-check"} 1',
      ); // degraded = 1
      expect(responseText).toContain(
        'health_check_status{check="unhealthy-check"} 0',
      ); // unhealthy = 0
    });
  });
});
