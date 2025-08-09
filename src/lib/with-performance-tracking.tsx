"use client";

import React, { ComponentType, useEffect, useRef } from "react";
import { usePerformanceTracking } from "./performance";

/**
 * Higher-Order Component for automatic performance tracking
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: ComponentType<P>,
  componentName?: string,
) {
  const displayName =
    componentName ||
    WrappedComponent.displayName ||
    WrappedComponent.name ||
    "Component";

  const PerformanceTrackedComponent = (props: P) => {
    const { startRender, endRender } = usePerformanceTracking(displayName);
    const renderCountRef = useRef(0);

    // Track render start
    useEffect(() => {
      startRender();
    });

    // Track render completion
    useEffect(() => {
      renderCountRef.current++;
      endRender();
    });

    return <WrappedComponent {...props} />;
  };

  PerformanceTrackedComponent.displayName = `withPerformanceTracking(${displayName})`;

  return PerformanceTrackedComponent;
}

/**
 * Hook for manual performance measurement within components
 */
export function useManualPerformanceTracking() {
  const measureAsync = async <T,>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === "development") {
        console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);

        if (duration > 1000) {
          console.warn(
            `⚠️ Slow async operation: ${operationName} took ${duration.toFixed(2)}ms`,
          );
        }
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === "development") {
        console.error(
          `❌ ${operationName} failed after ${duration.toFixed(2)}ms:`,
          error,
        );
      }

      throw error;
    }
  };

  const measureSync = <T,>(operationName: string, operation: () => T): T => {
    const startTime = performance.now();

    try {
      const result = operation();
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === "development") {
        console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);

        if (duration > 100) {
          console.warn(
            `⚠️ Slow sync operation: ${operationName} took ${duration.toFixed(2)}ms`,
          );
        }
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      if (process.env.NODE_ENV === "development") {
        console.error(
          `❌ ${operationName} failed after ${duration.toFixed(2)}ms:`,
          error,
        );
      }

      throw error;
    }
  };

  return { measureAsync, measureSync };
}

/**
 * Performance boundary component - catches and reports performance issues
 */
interface PerformanceBoundaryProps {
  children: React.ReactNode;
  name: string;
  maxRenderTime?: number;
}

export function PerformanceBoundary({
  children,
  name,
  maxRenderTime = 100,
}: PerformanceBoundaryProps) {
  const renderStartRef = useRef<number>();

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    if (renderStartRef.current) {
      const renderTime = performance.now() - renderStartRef.current;

      if (
        renderTime > maxRenderTime &&
        process.env.NODE_ENV === "development"
      ) {
        console.warn(
          `⚠️ Performance boundary exceeded: ${name} took ${renderTime.toFixed(2)}ms (max: ${maxRenderTime}ms)`,
        );
      }
    }
  });

  return <>{children}</>;
}

export default withPerformanceTracking;
