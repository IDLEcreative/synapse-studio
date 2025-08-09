import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay - capture 10% of all sessions, 100% of error sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA || "development",

  // Error filtering
  beforeSend(event, hint) {
    // Filter out known development errors
    if (process.env.NODE_ENV === "development") {
      const error = hint.originalException;
      if (error instanceof Error) {
        // Filter out HMR and development-only errors
        if (
          error.message.includes("ChunkLoadError") ||
          error.message.includes("Loading chunk") ||
          error.message.includes("ResizeObserver loop limit exceeded")
        ) {
          return null;
        }
      }
    }

    // Filter out bot/crawler errors
    const userAgent = event.request?.headers?.["user-agent"];
    if (userAgent && /bot|crawler|spider|scraper/i.test(userAgent)) {
      return null;
    }

    return event;
  },

  // Custom tags for better error grouping
  initialScope: {
    tags: {
      component: "client",
    },
  },

  // Performance profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Integrate with performance API
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
