/**
 * Feature flags system for controlled rollouts and A/B testing
 */

import { logger } from "./logger";
import { metrics } from "./metrics";

export type FeatureFlagValue = boolean | string | number | object;

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  value?: FeatureFlagValue;
  rolloutPercentage?: number; // 0-100
  userSegments?: string[];
  environment?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
}

export interface UserContext {
  userId?: string;
  email?: string;
  tier?: "free" | "pro" | "enterprise";
  segments?: string[];
  version?: string;
  experiment?: string;
}

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, FeatureFlag> = new Map();
  private userContext: UserContext = {};
  private overrides: Map<string, FeatureFlagValue> = new Map();
  private evaluationCache: Map<
    string,
    { value: FeatureFlagValue; expiry: number }
  > = new Map();
  private cacheTimeout = 60000; // 1 minute

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  constructor() {
    this.initializeDefaultFlags();
    this.loadFromEnvironment();
  }

  private initializeDefaultFlags(): void {
    const defaultFlags: FeatureFlag[] = [
      {
        key: "new_ui_design",
        name: "New UI Design",
        description: "Enable the new user interface design",
        enabled: false,
        rolloutPercentage: 10,
        environment: ["development", "staging"],
      },
      {
        key: "advanced_ai_features",
        name: "Advanced AI Features",
        description: "Enable advanced AI generation features",
        enabled: false,
        userSegments: ["pro", "enterprise"],
        rolloutPercentage: 25,
      },
      {
        key: "beta_video_editor",
        name: "Beta Video Editor",
        description: "New video editing interface",
        enabled: false,
        rolloutPercentage: 5,
        userSegments: ["beta"],
        startDate: "2025-01-01T00:00:00Z",
        endDate: "2025-03-01T00:00:00Z",
      },
      {
        key: "performance_optimizations",
        name: "Performance Optimizations",
        description: "Enable experimental performance optimizations",
        enabled: true,
        rolloutPercentage: 50,
      },
      {
        key: "analytics_tracking",
        name: "Analytics Tracking",
        description: "Enhanced analytics and tracking",
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        key: "debug_mode",
        name: "Debug Mode",
        description: "Show debug information and tools",
        enabled: false,
        environment: ["development"],
        rolloutPercentage: 100,
      },
      {
        key: "maintenance_mode",
        name: "Maintenance Mode",
        description: "Enable maintenance mode banner",
        enabled: false,
        value: {
          message: "Scheduled maintenance in progress",
          severity: "info",
        },
      },
      {
        key: "max_file_size_mb",
        name: "Max File Size",
        description: "Maximum file upload size in MB",
        enabled: true,
        value: 100,
        userSegments: ["free"],
      },
      {
        key: "api_rate_limit",
        name: "API Rate Limit",
        description: "Rate limit for API requests per minute",
        enabled: true,
        value: 60,
      },
    ];

    defaultFlags.forEach((flag) => this.flags.set(flag.key, flag));
  }

  private loadFromEnvironment(): void {
    // Load feature flags from environment variables
    // Format: FEATURE_FLAG_KEY=value or FEATURE_FLAG_KEY_ENABLED=true
    if (typeof process !== "undefined" && process.env) {
      Object.entries(process.env).forEach(([key, value]) => {
        if (key.startsWith("FEATURE_FLAG_")) {
          const flagKey = key.replace("FEATURE_FLAG_", "").toLowerCase();

          if (key.endsWith("_ENABLED")) {
            const actualKey = flagKey.replace("_enabled", "");
            this.updateFlag(actualKey, { enabled: value === "true" });
          } else {
            // Try to parse as JSON, fallback to string
            let parsedValue: FeatureFlagValue = value || "";
            try {
              parsedValue = JSON.parse(value || "");
            } catch {
              parsedValue = value || "";
            }

            this.updateFlag(flagKey, { value: parsedValue, enabled: true });
          }
        }
      });
    }
  }

  setUserContext(context: UserContext): void {
    this.userContext = { ...this.userContext, ...context };
    this.clearCache(); // Clear cache when context changes

    logger.debug("Feature flag user context updated", {
      operation: "feature_flags_context",
      userId: context.userId,
      tier: context.tier,
      segments: context.segments,
    });
  }

  getUserContext(): UserContext {
    return { ...this.userContext };
  }

  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
    logger.debug(`Feature flag added: ${flag.key}`, {
      operation: "add_feature_flag",
      flagKey: flag.key,
      enabled: flag.enabled,
    });
  }

  updateFlag(key: string, updates: Partial<FeatureFlag>): void {
    const existing = this.flags.get(key);
    if (existing) {
      this.flags.set(key, { ...existing, ...updates });
      this.clearCacheForFlag(key);

      logger.debug(`Feature flag updated: ${key}`, {
        operation: "update_feature_flag",
        flagKey: key,
        updates,
      });
    }
  }

  removeFlag(key: string): void {
    this.flags.delete(key);
    this.clearCacheForFlag(key);
    this.overrides.delete(key);

    logger.debug(`Feature flag removed: ${key}`, {
      operation: "remove_feature_flag",
      flagKey: key,
    });
  }

  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Override a flag value (useful for testing)
  override(key: string, value: FeatureFlagValue): void {
    this.overrides.set(key, value);
    this.clearCacheForFlag(key);

    logger.debug(`Feature flag overridden: ${key}`, {
      operation: "override_feature_flag",
      flagKey: key,
      value,
    });
  }

  clearOverride(key: string): void {
    this.overrides.delete(key);
    this.clearCacheForFlag(key);
  }

  clearAllOverrides(): void {
    this.overrides.clear();
    this.clearCache();
  }

  // Main evaluation method
  isEnabled(key: string, defaultValue: boolean = false): boolean {
    const result = this.evaluate(key, defaultValue);
    return typeof result === "boolean" ? result : !!result;
  }

  getValue<T extends FeatureFlagValue = FeatureFlagValue>(
    key: string,
    defaultValue: T,
  ): T {
    const result = this.evaluate(key, defaultValue);
    return result as T;
  }

  private evaluate(
    key: string,
    defaultValue: FeatureFlagValue,
  ): FeatureFlagValue {
    // Check cache first
    const cached = this.evaluationCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    // Check override first
    if (this.overrides.has(key)) {
      const overrideValue = this.overrides.get(key)!;
      this.cacheResult(key, overrideValue);
      return overrideValue;
    }

    const flag = this.flags.get(key);
    if (!flag) {
      logger.debug(`Feature flag not found: ${key}`, {
        operation: "evaluate_feature_flag",
        flagKey: key,
        defaultValue,
      });
      return defaultValue;
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      this.cacheResult(key, false);
      return flag.value !== undefined ? flag.value : false;
    }

    // Check environment
    if (flag.environment && flag.environment.length > 0) {
      const currentEnv = process.env.NODE_ENV || "development";
      if (!flag.environment.includes(currentEnv)) {
        this.cacheResult(key, false);
        return flag.value !== undefined ? flag.value : false;
      }
    }

    // Check date range
    if (flag.startDate || flag.endDate) {
      const now = new Date();

      if (flag.startDate && now < new Date(flag.startDate)) {
        this.cacheResult(key, false);
        return flag.value !== undefined ? flag.value : false;
      }

      if (flag.endDate && now > new Date(flag.endDate)) {
        this.cacheResult(key, false);
        return flag.value !== undefined ? flag.value : false;
      }
    }

    // Check user segments
    if (flag.userSegments && flag.userSegments.length > 0) {
      const userSegments = this.userContext.segments || [];
      const userTier = this.userContext.tier;

      const hasMatchingSegment = flag.userSegments.some(
        (segment) => userSegments.includes(segment) || segment === userTier,
      );

      if (!hasMatchingSegment) {
        this.cacheResult(key, false);
        return flag.value !== undefined ? flag.value : false;
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUser(key);
      const bucket = hash % 100;

      if (bucket >= flag.rolloutPercentage) {
        this.cacheResult(key, false);
        return flag.value !== undefined ? flag.value : false;
      }
    }

    // Flag is enabled
    const result = flag.value !== undefined ? flag.value : true;
    this.cacheResult(key, result);

    // Track flag evaluation
    metrics.trackUsage("feature_flags", "flag_evaluation", {
      flagKey: key,
      result: result,
      userId: this.userContext.userId,
    });

    logger.debug(`Feature flag evaluated: ${key}`, {
      operation: "evaluate_feature_flag",
      flagKey: key,
      result,
      userId: this.userContext.userId,
    });

    return result;
  }

  private hashUser(flagKey: string): number {
    const input = `${this.userContext.userId || "anonymous"}_${flagKey}`;
    let hash = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  private cacheResult(key: string, value: FeatureFlagValue): void {
    this.evaluationCache.set(key, {
      value,
      expiry: Date.now() + this.cacheTimeout,
    });
  }

  private clearCache(): void {
    this.evaluationCache.clear();
  }

  private clearCacheForFlag(key: string): void {
    this.evaluationCache.delete(key);
  }

  // Utilities for common patterns
  isInExperiment(experimentName: string): boolean {
    return this.userContext.experiment === experimentName;
  }

  getExperimentVariant(experimentName: string): string | null {
    const flag = this.flags.get(`experiment_${experimentName}`);
    if (!flag || !this.isEnabled(`experiment_${experimentName}`)) {
      return null;
    }

    const variants = (flag.metadata?.variants as string[]) || [
      "control",
      "treatment",
    ];
    const hash = this.hashUser(experimentName);
    const variantIndex = hash % variants.length;

    return variants[variantIndex];
  }

  // Bulk operations
  evaluateMultiple(keys: string[]): Record<string, FeatureFlagValue> {
    const results: Record<string, FeatureFlagValue> = {};

    keys.forEach((key) => {
      results[key] = this.evaluate(key, false);
    });

    return results;
  }

  // Export configuration (for admin panel)
  exportConfiguration(): {
    flags: FeatureFlag[];
    userContext: UserContext;
    overrides: Record<string, FeatureFlagValue>;
  } {
    return {
      flags: this.getAllFlags(),
      userContext: this.getUserContext(),
      overrides: Object.fromEntries(this.overrides.entries()),
    };
  }

  // Import configuration (for admin panel)
  importConfiguration(config: {
    flags?: FeatureFlag[];
    userContext?: UserContext;
    overrides?: Record<string, FeatureFlagValue>;
  }): void {
    if (config.flags) {
      config.flags.forEach((flag) => this.addFlag(flag));
    }

    if (config.userContext) {
      this.setUserContext(config.userContext);
    }

    if (config.overrides) {
      Object.entries(config.overrides).forEach(([key, value]) => {
        this.override(key, value);
      });
    }
  }

  // Statistics
  getEvaluationStats(): {
    totalFlags: number;
    enabledFlags: number;
    flagsWithRollout: number;
    flagsWithSegments: number;
    cacheSize: number;
    overrideCount: number;
  } {
    const flags = this.getAllFlags();

    return {
      totalFlags: flags.length,
      enabledFlags: flags.filter((f) => f.enabled).length,
      flagsWithRollout: flags.filter(
        (f) => f.rolloutPercentage !== undefined && f.rolloutPercentage < 100,
      ).length,
      flagsWithSegments: flags.filter(
        (f) => f.userSegments && f.userSegments.length > 0,
      ).length,
      cacheSize: this.evaluationCache.size,
      overrideCount: this.overrides.size,
    };
  }
}

// Create singleton instance
export const featureFlags = FeatureFlagManager.getInstance();

// React hook for feature flags
export function useFeatureFlag(
  key: string,
  defaultValue: boolean = false,
): boolean {
  return featureFlags.isEnabled(key, defaultValue);
}

export function useFeatureValue<T extends FeatureFlagValue = FeatureFlagValue>(
  key: string,
  defaultValue: T,
): T {
  return featureFlags.getValue(key, defaultValue);
}

// Convenience exports
export const isEnabled = (key: string, defaultValue?: boolean) =>
  featureFlags.isEnabled(key, defaultValue);
export const getValue = <T extends FeatureFlagValue = FeatureFlagValue>(
  key: string,
  defaultValue: T,
) => featureFlags.getValue(key, defaultValue);
export const setUserContext = (context: UserContext) =>
  featureFlags.setUserContext(context);

export default featureFlags;
