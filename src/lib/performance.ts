/**
 * Performance monitoring utilities for Synapse Studio
 * Provides comprehensive performance tracking and optimization insights
 */

export interface PerformanceMetrics {
  bundleSize: number;
  renderTime: number;
  memoryUsage: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timestamp: number;
}

export interface ComponentMetrics {
  name: string;
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  propsChanges: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private componentMetrics = new Map<string, ComponentMetrics>();
  private isEnabled = process.env.NODE_ENV === "development";
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (this.isEnabled && typeof window !== "undefined") {
      this.initializeWebVitals();
      this.initializeMemoryMonitoring();
    }
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initializeWebVitals() {
    // Largest Contentful Paint
    this.observeMetric("largest-contentful-paint", (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.logMetric("LCP", lastEntry.startTime);
    });

    // First Input Delay
    this.observeMetric("first-input", (entries) => {
      const firstEntry = entries[0] as any; // PerformanceEventTiming
      this.logMetric(
        "FID",
        (firstEntry.processingStart || 0) - firstEntry.startTime,
      );
    });

    // Cumulative Layout Shift
    this.observeMetric("layout-shift", (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        const layoutShiftEntry = entry as any; // LayoutShift
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      if (clsValue > 0) {
        this.logMetric("CLS", clsValue);
      }
    });

    // Long Tasks (performance bottlenecks)
    this.observeMetric("longtask", (entries) => {
      for (const entry of entries) {
        console.warn(`🐌 Long task detected: ${entry.duration}ms`, {
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    });
  }

  /**
   * Observe specific performance metrics
   */
  private observeMetric(
    type: string,
    callback: (entries: PerformanceEntry[]) => void,
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported`, error);
    }
  }

  /**
   * Initialize memory usage monitoring
   */
  private initializeMemoryMonitoring() {
    if ("memory" in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          this.logMemoryUsage(memory.usedJSHeapSize);
        }
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(componentName) || {
      name: componentName,
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      propsChanges: 0,
    };

    existing.renderCount += 1;
    existing.lastRenderTime = renderTime;
    existing.averageRenderTime =
      (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) /
      existing.renderCount;

    this.componentMetrics.set(componentName, existing);

    // Warn about slow renders
    if (renderTime > 16) {
      // 60fps threshold
      console.warn(
        `⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`,
      );
    }
  }

  /**
   * Track component prop changes (useful for memo optimization)
   */
  trackPropsChange(componentName: string) {
    if (!this.isEnabled) return;

    const existing = this.componentMetrics.get(componentName);
    if (existing) {
      existing.propsChanges += 1;
    }
  }

  /**
   * Log performance metrics
   */
  private logMetric(name: string, value: number) {
    console.log(`📊 ${name}: ${value.toFixed(2)}ms`);
  }

  /**
   * Log memory usage
   */
  private logMemoryUsage(memoryUsage: number) {
    const mb = memoryUsage / (1024 * 1024);
    console.log(`🧠 Memory Usage: ${mb.toFixed(2)} MB`);

    // Warn about high memory usage (>100MB)
    if (mb > 100) {
      console.warn(`⚠️ High memory usage detected: ${mb.toFixed(2)} MB`);
    }
  }

  /**
   * Get component performance report
   */
  getComponentReport(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values()).sort(
      (a, b) => b.averageRenderTime - a.averageRenderTime,
    );
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const report = this.getComponentReport();
    const slowComponents = report.filter((c) => c.averageRenderTime > 16);
    const frequentRerenderers = report.filter((c) => c.renderCount > 100);

    return {
      totalComponents: report.length,
      slowComponents: slowComponents.length,
      frequentRerenderers: frequentRerenderers.length,
      slowestComponent: report[0],
      recommendations: this.getRecommendations(report),
    };
  }

  /**
   * Generate performance recommendations
   */
  private getRecommendations(report: ComponentMetrics[]) {
    const recommendations: string[] = [];

    const slowComponents = report.filter((c) => c.averageRenderTime > 16);
    if (slowComponents.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowComponents.length} slow components: ${slowComponents
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}`,
      );
    }

    const frequentRerenderers = report.filter((c) => c.renderCount > 100);
    if (frequentRerenderers.length > 0) {
      recommendations.push(
        `Components with frequent re-renders (>100): ${frequentRerenderers
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}`,
      );
    }

    const highPropsChanges = report.filter(
      (c) => c.propsChanges > c.renderCount * 0.8,
    );
    if (highPropsChanges.length > 0) {
      recommendations.push(
        `Components with frequent prop changes: ${highPropsChanges
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ")}`,
      );
    }

    return recommendations;
  }

  /**
   * Measure bundle size impact
   */
  measureBundleSize() {
    if (typeof window !== "undefined") {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      let totalSize = 0;

      scripts.forEach(async (script) => {
        try {
          const response = await fetch((script as HTMLScriptElement).src, {
            method: "HEAD",
          });
          const size = parseInt(response.headers.get("content-length") || "0");
          totalSize += size;
        } catch (error) {
          // Ignore errors for bundle size measurement
        }
      });

      console.log(
        `📦 Estimated bundle size: ${(totalSize / 1024).toFixed(2)} KB`,
      );
    }
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(interactionName: string, startTime: number) {
    if (!this.isEnabled) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`🖱️ ${interactionName}: ${duration.toFixed(2)}ms`);

    if (duration > 100) {
      console.warn(
        `⚠️ Slow interaction: ${interactionName} took ${duration.toFixed(2)}ms`,
      );
    }
  }

  /**
   * Cleanup observers
   */
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(componentName: string) {
  if (process.env.NODE_ENV !== "development") {
    return { startRender: () => {}, endRender: () => {} };
  }

  let startTime: number;

  const startRender = () => {
    startTime = performance.now();
  };

  const endRender = () => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.trackComponentRender(componentName, renderTime);
  };

  return { startRender, endRender };
}

// React hook for interaction tracking
export function useInteractionTracking() {
  if (process.env.NODE_ENV !== "development") {
    return { trackClick: () => {}, trackNavigation: () => {} };
  }

  const trackClick = (elementName: string) => {
    const startTime = performance.now();
    return () =>
      performanceMonitor.trackInteraction(`Click: ${elementName}`, startTime);
  };

  const trackNavigation = (routeName: string) => {
    const startTime = performance.now();
    return () =>
      performanceMonitor.trackInteraction(
        `Navigation: ${routeName}`,
        startTime,
      );
  };

  return { trackClick, trackNavigation };
}

// Export performance debugging utilities
export const performanceDebug = {
  getReport: () => performanceMonitor.getComponentReport(),
  getSummary: () => performanceMonitor.getPerformanceSummary(),
  measureBundleSize: () => performanceMonitor.measureBundleSize(),
  cleanup: () => performanceMonitor.cleanup(),
};

// Development helper to expose performance utilities globally
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as any).__SYNAPSE_PERFORMANCE__ = performanceDebug;
}

export default performanceMonitor;
