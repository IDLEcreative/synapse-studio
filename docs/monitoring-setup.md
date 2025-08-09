# Monitoring and Observability Setup

This document outlines the comprehensive monitoring and observability system implemented for Synapse Studio.

## Overview

The monitoring system provides:
- **Error Tracking**: Sentry integration for error capture and performance monitoring
- **Structured Logging**: Enhanced logging with correlation IDs and context
- **Business Metrics**: Tracking of key performance indicators and user behavior
- **Health Monitoring**: System health checks with dependency monitoring
- **Alerting**: Configurable thresholds with multi-channel notifications
- **Feature Flags**: Controlled rollouts and A/B testing
- **Debug Tools**: Development debugging and admin dashboard

## Components

### 1. Sentry Integration (`/sentry.*.config.ts`)

**Purpose**: Error tracking and performance monitoring

**Features**:
- Client, server, and edge runtime configurations
- Performance tracing with sample rates
- Session replay for debugging
- Error filtering and environment-specific settings

**Setup**:
```bash
npm install @sentry/nextjs
```

Add to environment variables:
```env
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

### 2. Enhanced Logging (`/src/lib/logger.ts`)

**Purpose**: Structured logging with correlation IDs and Sentry integration

**Features**:
- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Correlation ID tracking for request tracing
- Sentry integration for errors and warnings
- Log buffering and export capabilities
- Performance logging with thresholds

**Usage**:
```typescript
import { logger } from '@/lib/logger';

logger.info('User action performed', {
  userId: 'user123',
  operation: 'generate_video'
});
```

### 3. Metrics System (`/src/lib/metrics.ts`)

**Purpose**: Business metrics and analytics tracking

**Features**:
- Performance metrics (duration, success rate)
- Business event tracking
- Usage metrics for features
- Automatic batching and flushing
- Performance budget monitoring

**Usage**:
```typescript
import { metrics } from '@/lib/metrics';

metrics.trackAIGeneration(
  'flux-pro',
  1500, // duration in ms
  true, // success
  'image',
  100, // input tokens
  200  // output tokens
);
```

### 4. Health Monitoring (`/src/lib/health-checks.ts`)

**Purpose**: System dependency health monitoring

**Features**:
- Database connectivity checks
- External API health verification
- System resource monitoring
- Configurable health check intervals
- Prometheus metrics format support

**API Endpoints**:
- `GET /api/health` - Full system health report
- `GET /api/health?check=database` - Specific check
- `GET /api/health?format=prometheus` - Prometheus format
- `HEAD /api/health` - Quick status check

### 5. Alerting System (`/src/lib/alerting.ts`)

**Purpose**: Configurable alerting with multiple notification channels

**Features**:
- Threshold-based alerting
- Multiple alert severities (info, warning, error, critical)
- Multi-channel notifications (Sentry, email, Slack, webhook)
- Cooldown periods to prevent spam
- Alert acknowledgment and resolution

**Default Thresholds**:
- High error rate (>5% over 5 minutes)
- Slow response time (>5 seconds)
- Service unhealthy status
- High memory usage (>90%)
- AI generation failures (>20% over 10 minutes)

### 6. Feature Flags (`/src/lib/feature-flags.ts`)

**Purpose**: Controlled feature rollouts and A/B testing

**Features**:
- Boolean, string, number, and object flag values
- Percentage-based rollouts
- User segment targeting
- Environment-based enabling
- Date range controls
- Override system for testing

**Usage**:
```typescript
import { featureFlags } from '@/lib/feature-flags';

if (featureFlags.isEnabled('new_ui_design')) {
  // Show new UI
}

const maxFileSize = featureFlags.getValue('max_file_size_mb', 100);
```

### 7. Debug Panel (`/src/components/debug-panel.tsx`)

**Purpose**: Development debugging tools

**Features** (Development only):
- Real-time log viewing
- Metrics visualization
- Alert monitoring
- System information display
- Test utilities for logs, metrics, alerts

### 8. Status Page (`/src/components/status-page.tsx`)

**Purpose**: Public-facing system status display

**Features**:
- Overall system health status
- Individual service status
- Uptime tracking
- Response time monitoring
- Auto-refresh capabilities

### 9. Admin Dashboard (`/src/components/admin-dashboard.tsx`)

**Purpose**: Administrative monitoring and configuration

**Features**:
- System overview with key metrics
- Health monitoring integration
- Metrics management and export
- Alert management (acknowledge/resolve)
- Feature flag configuration
- System settings and utilities

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @sentry/nextjs @sentry/node @sentry/browser
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Sentry
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
NEXT_PUBLIC_SENTRY_DSN="https://your-dsn@sentry.io/project-id"

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# Feature flags (optional)
FEATURE_FLAG_DEBUG_MODE_ENABLED="true"
```

### 3. Import Components

Add to your app layout or specific pages:

```typescript
// For development debugging
import { DebugPanel } from '@/components/debug-panel';

// For status monitoring
import { StatusPage } from '@/components/status-page';

// For admin dashboard
import { AdminDashboard } from '@/components/admin-dashboard';
```

### 4. Initialize Monitoring

In your app startup:

```typescript
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { featureFlags } from '@/lib/feature-flags';

// Set user context for feature flags
featureFlags.setUserContext({
  userId: user.id,
  tier: user.tier,
  segments: ['beta']
});

// Track app startup
metrics.trackBusinessEvent('app_startup');
```

## Production Deployment

### 1. Sentry Configuration

1. Create a Sentry project at https://sentry.io
2. Configure DSN in environment variables
3. Adjust sample rates for production load
4. Set up alerts in Sentry dashboard

### 2. Log Aggregation

For production log aggregation, set:
```env
LOG_FORMAT="json"
```

This enables structured JSON logging suitable for systems like:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Fluentd
- DataDog
- New Relic

### 3. Metrics Collection

The metrics system can be extended to send data to:
- Prometheus + Grafana
- DataDog
- New Relic
- Custom analytics platforms

Modify `/src/lib/metrics.ts` `sendToAnalyticsService()` method to integrate with your chosen platform.

### 4. Health Check Monitoring

Set up external monitoring to check:
- `https://yourdomain.com/api/health`
- Configure alerts based on HTTP status codes
- Monitor response times and availability

### 5. Alerting Channels

Configure notification channels in production:

**Email**: Implement `sendEmailAlert()` in alerting system
**Slack**: Add Slack webhook integration
**PagerDuty**: Integrate for critical alerts
**Custom Webhooks**: Send to incident management systems

## Monitoring Best Practices

### 1. Alert Tuning

- Start with default thresholds and adjust based on actual traffic
- Use cooldown periods to prevent alert spam
- Prioritize actionable alerts over informational ones
- Regular review of alert effectiveness

### 2. Performance Budget

- Monitor bundle size and page load times
- Set performance budgets for key operations
- Track Core Web Vitals
- Monitor AI generation response times

### 3. Error Handling

- Implement proper error boundaries
- Log contextual information with errors
- Track error patterns and trends
- Monitor third-party service errors separately

### 4. Feature Flag Management

- Use descriptive names and documentation
- Clean up expired flags regularly
- Monitor flag evaluation performance
- Use gradual rollouts for new features

### 5. Metrics Strategy

- Focus on business-relevant metrics
- Implement proper sampling for high-volume events
- Use correlation IDs for request tracing
- Monitor both technical and business KPIs

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check log buffer sizes
   - Monitor metrics collection frequency
   - Review feature flag cache settings

2. **Slow Health Checks**
   - Adjust timeout values
   - Implement caching for expensive checks
   - Review external service dependencies

3. **Alert Noise**
   - Tune alert thresholds
   - Implement proper cooldown periods
   - Review alert conditions

### Debug Steps

1. Check browser console for client-side issues
2. Review server logs for API errors
3. Use debug panel in development
4. Check Sentry dashboard for error patterns
5. Verify health check endpoints

## API Reference

### Health Check API

```
GET /api/health
  ?check=<specific_check>
  &format=<json|prometheus>
  &details=<true|false>

HEAD /api/health
  (Quick status check)
```

### Metrics API

```
POST /api/metrics
  Body: { metrics: Metric[] }

GET /api/metrics
  ?type=<performance|business|usage>
  &format=<json|csv>
  &since=<ISO_date>
  &until=<ISO_date>
```

## Runbook

### Critical Alert Response

1. **Service Down**
   - Check health dashboard
   - Verify external dependencies
   - Review recent deployments
   - Check server resources

2. **High Error Rate**
   - Review error patterns in Sentry
   - Check for recent code changes
   - Verify external service status
   - Consider rollback if needed

3. **Performance Degradation**
   - Check response time metrics
   - Review database performance
   - Monitor server resources
   - Analyze slow operations

### Regular Maintenance

- Weekly review of alert thresholds
- Monthly cleanup of expired feature flags
- Quarterly review of monitoring effectiveness
- Regular testing of alert channels

## Future Enhancements

- Real-time dashboard with WebSocket updates
- Machine learning-based anomaly detection
- Advanced A/B testing framework
- Custom metric visualization
- Automated incident response workflows