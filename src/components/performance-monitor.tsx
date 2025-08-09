"use client";

import { useEffect, useState } from "react";
import { performanceDebug } from "@/lib/performance";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
// Using div instead of Card component as it's not available
import {
  TrendingUpIcon,
  ClockIcon,
  MemoryStickIcon,
  ZapIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceMonitor({
  isOpen,
  onClose,
}: PerformanceMonitorProps) {
  const [summary, setSummary] = useState<any>(null);
  const [report, setReport] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      updateData();
      const interval = setInterval(updateData, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const updateData = () => {
    setSummary(performanceDebug.getSummary());
    setReport(performanceDebug.getReport().slice(0, 10)); // Top 10 components
  };

  if (!isOpen || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto">
      <div className="bg-gray-900/95 border border-gray-700 backdrop-blur-sm rounded-lg">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUpIcon className="w-5 h-5 text-blue-400" />
              Performance Monitor
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          {summary && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ZapIcon className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-400">Components</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {summary.totalComponents}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ClockIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-gray-400">Slow</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {summary.slowComponents}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCwIcon className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400">Re-renders</span>
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {summary.frequentRerenderers}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MemoryStickIcon className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-400">Memory</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {typeof window !== "undefined" &&
                    (window.performance as any).memory
                      ? `${((window.performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangleIcon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">
                      Recommendations
                    </span>
                  </div>
                  <div className="space-y-1">
                    {summary.recommendations.map(
                      (rec: string, index: number) => (
                        <p key={index} className="text-xs text-gray-300">
                          • {rec}
                        </p>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Component Performance */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Component Performance
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {report.map((component, index) => (
                    <div
                      key={component.name}
                      className="bg-gray-800/30 rounded-lg p-2 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium truncate">
                          {component.name}
                        </span>
                        <div className="flex gap-1">
                          {component.averageRenderTime > 16 && (
                            <Badge
                              variant="destructive"
                              className="text-xs px-1 py-0 h-4"
                            >
                              slow
                            </Badge>
                          )}
                          {component.renderCount > 100 && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0 h-4"
                            >
                              frequent
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>
                          {component.averageRenderTime.toFixed(1)}ms avg
                        </span>
                        <span>{component.renderCount} renders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => performanceDebug.measureBundleSize()}
                  className="text-xs"
                >
                  Measure Bundle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={updateData}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Development-only performance overlay component
export function PerformanceOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-40 bg-gray-900/90 border-gray-700 text-gray-300 hover:text-white text-xs"
      >
        <TrendingUpIcon className="w-3 h-3 mr-1" />
        Perf
      </Button>

      <PerformanceMonitor isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
