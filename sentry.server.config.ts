import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA || "development",

  // Error filtering for server
  beforeSend(event, hint) {
    // Filter out known server errors that aren't actionable
    const error = hint.originalException;
    if (error instanceof Error) {
      // Filter out client disconnect errors
      if (
        error.message.includes("ECONNRESET") ||
        error.message.includes("Client closed connection")
      ) {
        return null;
      }

      // Filter out timeout errors from AI services (we'll handle these separately)
      if (
        error.message.includes("timeout") &&
        (error.stack?.includes("fal") || error.stack?.includes("openai"))
      ) {
        // Still capture but with lower priority
        event.level = "warning";
      }
    }

    return event;
  },

  // Custom tags for better error grouping
  initialScope: {
    tags: {
      component: "server",
    },
  },

  // Server-specific integrations
  integrations: [Sentry.httpIntegration()],

  // Performance profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
