"use client";

import React from "react";
import ErrorBoundary from "@/components/error-boundary";
import { logger } from "@/lib/logger";

interface GlobalErrorProviderProps {
  children: React.ReactNode;
}

export const GlobalErrorProvider: React.FC<GlobalErrorProviderProps> = ({
  children,
}) => {
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send error to monitoring service (e.g., Sentry, LogRocket, etc.)
    // This is where you'd integrate with your error monitoring solution

    logger.error("Global React Error", error, {
      operation: "global_error_boundary",
      componentStack: errorInfo.componentStack,
    });

    // You could also send to an analytics service
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      });
    }
  };

  return (
    <ErrorBoundary
      componentName="GlobalErrorProvider"
      onError={handleGlobalError}
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-gray-900">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600">
                  We&apos;re sorry, but something unexpected happened. Our team
                  has been notified and is working to fix the issue.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-3 justify-center">
                  <button
                    onClick={resetError}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => (window.location.href = "/")}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Go Home
                  </button>
                </div>

                {process.env.NODE_ENV === "development" && (
                  <details className="text-left text-sm bg-gray-100 p-3 rounded border">
                    <summary className="cursor-pointer font-medium text-gray-700">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
                      {error.name}: {error.message}
                      {error.stack && `\n\nStack Trace:\n${error.stack}`}
                    </pre>
                  </details>
                )}
              </div>

              <div className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default GlobalErrorProvider;
