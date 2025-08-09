/**
 * Health check utilities for monitoring system dependencies
 */

import { logger } from "./logger";

export interface HealthCheck {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  responseTime: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private cache: Map<string, { result: HealthCheck; expiry: number }> =
    new Map();
  private cacheTimeout = 30000; // 30 seconds

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  constructor() {
    this.registerDefaultChecks();
  }

  private registerDefaultChecks(): void {
    // Database/Storage health check
    this.registerCheck("database", this.checkDatabase.bind(this));

    // External API health checks
    this.registerCheck("fal_ai", this.checkFalAI.bind(this));
    this.registerCheck("supabase", this.checkSupabase.bind(this));

    // System resources
    this.registerCheck("memory", this.checkMemory.bind(this));
    this.registerCheck("disk", this.checkDisk.bind(this));
  }

  registerCheck(name: string, checkFunction: () => Promise<HealthCheck>): void {
    this.checks.set(name, checkFunction);
  }

  private async executeCheck(name: string): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const checkFunction = this.checks.get(name);
      if (!checkFunction) {
        return {
          name,
          status: "unhealthy",
          responseTime: 0,
          error: "Check function not found",
        };
      }

      // Check cache first
      const cached = this.cache.get(name);
      if (cached && Date.now() < cached.expiry) {
        return cached.result;
      }

      const result = await checkFunction();

      // Cache the result
      this.cache.set(name, {
        result,
        expiry: Date.now() + this.cacheTimeout,
      });

      logger.debug(`Health check completed: ${name}`, {
        operation: "health_check",
        checkName: name,
        status: result.status,
        responseTime: result.responseTime,
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error(`Health check failed: ${name}`, error, {
        operation: "health_check",
        checkName: name,
        responseTime,
      });

      return {
        name,
        status: "unhealthy",
        responseTime,
        error: errorMessage,
      };
    }
  }

  async runAllChecks(): Promise<SystemHealth> {
    const startTime = Date.now();
    const checkNames = Array.from(this.checks.keys());

    logger.info("Starting system health checks", {
      operation: "system_health_check",
      checkCount: checkNames.length,
    });

    // Run all checks in parallel
    const checkPromises = checkNames.map((name) => this.executeCheck(name));
    const checks = await Promise.all(checkPromises);

    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      unhealthy: checks.filter((c) => c.status === "unhealthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
    };

    // Determine overall system status
    let systemStatus: SystemHealth["status"] = "healthy";
    if (summary.unhealthy > 0) {
      systemStatus = "unhealthy";
    } else if (summary.degraded > 0) {
      systemStatus = "degraded";
    }

    const totalTime = Date.now() - startTime;

    const health: SystemHealth = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
      checks,
      summary,
    };

    logger.info("System health check completed", {
      operation: "system_health_check",
      systemStatus,
      duration: totalTime,
      summary,
    });

    return health;
  }

  async runCheck(name: string): Promise<HealthCheck | null> {
    if (!this.checks.has(name)) {
      return null;
    }

    return this.executeCheck(name);
  }

  // Individual health check implementations
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check if we can perform a simple database operation
      // This would typically be a lightweight query
      const isHealthy = await this.isDatabaseHealthy();

      return {
        name: "database",
        status: isHealthy ? "healthy" : "unhealthy",
        responseTime: Date.now() - startTime,
        metadata: {
          connectionPool: "active", // Would get real pool stats
        },
      };
    } catch (error) {
      return {
        name: "database",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkFalAI(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check if FAL AI service is responding
      const response = await fetch("https://fal.run/health", {
        method: "GET",
        headers: {
          Authorization: `Key ${process.env.FAL_KEY}`,
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          name: "fal_ai",
          status: "healthy",
          responseTime,
          metadata: {
            statusCode: response.status,
          },
        };
      } else {
        return {
          name: "fal_ai",
          status: response.status >= 500 ? "unhealthy" : "degraded",
          responseTime,
          error: `HTTP ${response.status}`,
          metadata: {
            statusCode: response.status,
          },
        };
      }
    } catch (error) {
      return {
        name: "fal_ai",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkSupabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        return {
          name: "supabase",
          status: "unhealthy",
          responseTime: Date.now() - startTime,
          error: "Supabase URL not configured",
        };
      }

      const response = await fetch(`${supabaseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          name: "supabase",
          status: "healthy",
          responseTime,
          metadata: {
            statusCode: response.status,
          },
        };
      } else {
        return {
          name: "supabase",
          status: response.status >= 500 ? "unhealthy" : "degraded",
          responseTime,
          error: `HTTP ${response.status}`,
          metadata: {
            statusCode: response.status,
          },
        };
      }
    } catch (error) {
      return {
        name: "supabase",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      let status: HealthCheck["status"] = "healthy";
      if (memoryPercentage > 90) {
        status = "unhealthy";
      } else if (memoryPercentage > 80) {
        status = "degraded";
      }

      return {
        name: "memory",
        status,
        responseTime: Date.now() - startTime,
        metadata: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: Math.round(memoryPercentage),
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
      };
    } catch (error) {
      return {
        name: "memory",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkDisk(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // In a real implementation, you'd check actual disk usage
      // For now, we'll simulate a basic check

      return {
        name: "disk",
        status: "healthy",
        responseTime: Date.now() - startTime,
        metadata: {
          usage: "simulated", // Would contain real disk usage data
        },
      };
    } catch (error) {
      return {
        name: "disk",
        status: "unhealthy",
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async isDatabaseHealthy(): Promise<boolean> {
    // Placeholder for database health check
    // In a real app, this would test database connectivity
    return true;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCachedResults(): Map<string, HealthCheck> {
    const results = new Map<string, HealthCheck>();

    for (const [name, cached] of this.cache.entries()) {
      if (Date.now() < cached.expiry) {
        results.set(name, cached.result);
      }
    }

    return results;
  }
}

export const healthChecker = HealthChecker.getInstance();
