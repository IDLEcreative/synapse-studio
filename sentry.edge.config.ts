import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Edge runtime has limited resources, so use lower sample rates
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,

  // Environment and release tracking
  environment: process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA || "development",

  // Custom tags for edge runtime
  initialScope: {
    tags: {
      component: "edge",
    },
  },

  // Minimal integrations for edge runtime
  integrations: [],
});
