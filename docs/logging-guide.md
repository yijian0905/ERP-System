# ERP System - Logging Guide

Comprehensive guide for implementing and using the logging system throughout the ERP application.

## Table of Contents

1. [Overview](#overview)
2. [Log Levels](#log-levels)
3. [Where to Log](#where-to-log)
4. [Log Event Categories](#log-event-categories)
5. [Best Practices](#best-practices)
6. [Troubleshooting with Logs](#troubleshooting-with-logs)
7. [Log Aggregation](#log-aggregation)

---

## Overview

The ERP system uses a structured logging approach to ensure:

- **Traceability**: Every request can be traced end-to-end
- **Debuggability**: Issues can be diagnosed quickly
- **Compliance**: Audit trails for regulatory requirements
- **Performance**: Slow operations are identified
- **Security**: Sensitive data is masked

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │ AI Service  │
│   (React)   │     │  (Fastify)  │     │  (Python)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ requestId         │ requestId         │ requestId
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│                  Log Aggregator                       │
│            (ELK / Loki / Datadog)                    │
└──────────────────────────────────────────────────────┘
```

---

## Log Levels

### Error (Critical)
System errors that require immediate attention.

```typescript
// When to use:
// - Unhandled exceptions
// - Database connection failures
// - External service failures
// - Data integrity issues

logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  context: 'DatabaseService.connect',
});
```

### Warn (Warning)
Issues that don't prevent operation but indicate problems.

```typescript
// When to use:
// - Deprecated API usage
// - Rate limit approaching
// - Recovery from transient errors
// - Cache misses
// - Slow operations

logger.warn('Rate limit approaching', {
  currentRate: 90,
  limit: 100,
  tenantId: tenant.id,
});
```

### Info (Information)
Important business events and state changes.

```typescript
// When to use:
// - User authentication
// - Order creation
// - Invoice generation
// - Configuration changes
// - License validation

logger.info('Order created', {
  orderId: order.id,
  customerId: customer.id,
  total: order.total,
  items: order.items.length,
});
```

### HTTP (Request/Response)
HTTP request and response logging.

```typescript
// Automatically logged by Fastify plugin
// Format: METHOD /path STATUS DURATIONms

// GET /api/products 200 45ms
// POST /api/orders 201 123ms
// GET /api/users/123 404 12ms
```

### Debug (Diagnostic)
Detailed information for debugging (development only).

```typescript
// When to use:
// - Cache hits/misses
// - Query parameters
// - Function entry/exit
// - Variable values

logger.debug('Processing order items', {
  items: orderItems.map(i => i.id),
  calculatedTax: taxAmount,
});
```

---

## Where to Log

### Backend API

#### Authentication (`apps/api/src/routes/auth.ts`)

```typescript
// Login success
logger.info('User logged in', {
  event: 'AUTH_LOGIN_SUCCESS',
  userId: user.id,
  tenantId: user.tenantId,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
});

// Login failure
logger.warn('Login failed', {
  event: 'AUTH_LOGIN_FAILED',
  email,
  reason: 'Invalid password',
  ipAddress: request.ip,
  attempts: failedAttempts,
});

// Token refresh
logger.debug('Token refreshed', {
  event: 'AUTH_TOKEN_REFRESH',
  userId: user.id,
});
```

#### Database Operations (`packages/database/src/index.ts`)

```typescript
// Slow queries (automatically tracked via middleware)
if (duration > 100) {
  logger.warn('Slow query detected', {
    event: 'DB_QUERY_SLOW',
    model: params.model,
    action: params.action,
    duration,
    tenantId: context.tenantId,
  });
}

// Query errors
logger.error('Database query failed', {
  event: 'DB_QUERY_ERROR',
  model: params.model,
  action: params.action,
  error: error.message,
});
```

#### Business Operations

```typescript
// Order creation
logger.event('ORDER_CREATED', 'New order created', {
  orderId: order.id,
  customerId: order.customerId,
  total: order.total,
  items: order.items.length,
});

// Invoice printing
logger.event('INVOICE_PRINTED', 'Invoice printed', {
  invoiceId: invoice.id,
  customerId: invoice.customerId,
  amount: invoice.total,
});

// Inventory deduction
logger.event('INVENTORY_DEDUCTED', 'Inventory deducted', {
  products: items.map(i => ({
    productId: i.productId,
    quantity: i.quantity,
  })),
  orderId: order.id,
});

// Low stock warning
logger.event('INVENTORY_LOW_STOCK', 'Low stock warning', {
  productId: product.id,
  currentStock: product.quantity,
  minStock: product.minStock,
  warehouseId: warehouse.id,
});
```

#### License Validation

```typescript
// Validation success
logger.licenseCheck({
  tenantId,
  tier: license.tier,
  feature: requestedFeature,
  valid: true,
});

// Validation failure
logger.licenseCheck({
  tenantId,
  tier: license.tier,
  feature: requestedFeature,
  valid: false,
  reason: 'Feature not available in L1 tier',
});
```

#### AI Operations

```typescript
// Prediction request
logger.aiOperation({
  type: 'prediction',
  model: 'demand-forecast',
  tenantId,
  duration: 230,
  cached: false,
});

// Chat request (L3)
logger.aiOperation({
  type: 'chat',
  tenantId,
  duration: 1500,
  tokens: 150,
});
```

### Frontend

#### Component Events

```typescript
// Page views
logger.pageView('/dashboard', 'Dashboard');

// User actions
logger.userAction('click', 'print-invoice-button', {
  invoiceId: invoice.id,
});

// Form submissions
logger.userAction('submit', 'order-form', {
  orderId: result.id,
  success: true,
});
```

#### API Calls

```typescript
// Automatically logged via axios interceptor
// Logs: endpoint, method, status, duration, errors
```

#### Error Boundaries

```typescript
// In ErrorBoundary component
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logger.errorBoundary(error, errorInfo.componentStack);
}
```

#### Performance

```typescript
// Track slow operations
const perf = logger.track('loadProducts');
const products = await fetchProducts();
perf.end({ count: products.length });

// If > threshold, logs warning automatically
```

---

## Log Event Categories

### Authentication Events
| Event | Description | Required Context |
|-------|-------------|------------------|
| `AUTH_LOGIN_SUCCESS` | User logged in | userId, tenantId, ipAddress |
| `AUTH_LOGIN_FAILED` | Login attempt failed | email, reason, ipAddress |
| `AUTH_LOGOUT` | User logged out | userId |
| `AUTH_TOKEN_EXPIRED` | Token expired | userId |
| `AUTH_TOKEN_REFRESH` | Token refreshed | userId |

### Database Events
| Event | Description | Required Context |
|-------|-------------|------------------|
| `DB_QUERY_SLOW` | Query exceeded threshold | model, action, duration |
| `DB_QUERY_ERROR` | Query failed | model, action, error |
| `DB_CONNECTION_LOST` | Connection dropped | error |
| `DB_MIGRATION_START` | Migration starting | version |
| `DB_MIGRATION_COMPLETE` | Migration finished | version, duration |

### Business Events
| Event | Description | Required Context |
|-------|-------------|------------------|
| `ORDER_CREATED` | New order | orderId, customerId, total |
| `ORDER_SHIPPED` | Order shipped | orderId, trackingNumber |
| `INVOICE_PRINTED` | Invoice printed | invoiceId, amount |
| `INVENTORY_DEDUCTED` | Stock reduced | productId, quantity |
| `INVENTORY_LOW_STOCK` | Below threshold | productId, currentStock |
| `PAYMENT_RECEIVED` | Payment recorded | paymentId, amount |

### License Events
| Event | Description | Required Context |
|-------|-------------|------------------|
| `LICENSE_VALIDATED` | Check passed | tenantId, tier |
| `LICENSE_INVALID` | Check failed | tenantId, reason |
| `LICENSE_EXPIRED` | License expired | tenantId |
| `LICENSE_GENERATED` | New license | tenantId, tier |
| `LICENSE_REVOKED` | License revoked | tenantId, reason |

### System Events
| Event | Description | Required Context |
|-------|-------------|------------------|
| `SYSTEM_STARTUP` | Service started | service, environment |
| `SYSTEM_SHUTDOWN` | Service stopping | service |
| `HEALTH_CHECK_FAILED` | Health check failed | service, reason |
| `BACKUP_COMPLETED` | Backup finished | filename, size |

---

## Best Practices

### 1. Always Include Context

```typescript
// ❌ Bad - No context
logger.info('Order created');

// ✅ Good - Full context
logger.info('Order created', {
  requestId,
  tenantId,
  userId,
  orderId: order.id,
  customerId: order.customerId,
  total: order.total,
});
```

### 2. Use Appropriate Levels

```typescript
// ❌ Bad - Everything is info
logger.info('Starting database query');
logger.info('Query completed');
logger.info('Error occurred');

// ✅ Good - Appropriate levels
logger.debug('Starting database query');
logger.debug('Query completed in 45ms');
logger.error('Query failed', { error });
```

### 3. Log Business Events, Not Just Errors

```typescript
// ❌ Bad - Only logging errors
try {
  await createOrder(data);
} catch (error) {
  logger.error('Order failed', { error });
}

// ✅ Good - Log the business event
try {
  const order = await createOrder(data);
  logger.event('ORDER_CREATED', 'Order created', {
    orderId: order.id,
    total: order.total,
  });
} catch (error) {
  logger.error('Order creation failed', {
    error: error.message,
    customerData: data.customerId,
  });
}
```

### 4. Mask Sensitive Data

```typescript
// ❌ Bad - Exposing sensitive data
logger.info('User registered', {
  email: user.email,
  password: user.password,  // Never!
  creditCard: card.number,
});

// ✅ Good - Use automatic masking or manual redaction
logger.info('User registered', {
  email: user.email,        // Automatically masked
  hasPassword: true,        // Boolean instead of value
  cardLast4: card.last4,    // Only last 4 digits
});
```

### 5. Track Performance

```typescript
// ❌ Bad - No timing
const products = await db.product.findMany();

// ✅ Good - Track duration
const perf = logger.track('db.product.findMany');
const products = await db.product.findMany();
perf.end({ count: products.length });
```

### 6. Use Child Loggers for Modules

```typescript
// In route handler
const log = logger.child({
  requestId: request.id,
  module: 'orders',
});

log.info('Processing order');  // Includes requestId and module
```

---

## Troubleshooting with Logs

### Finding a Specific Request

```bash
# Search by request ID
grep "requestId\":\"abc-123" logs/app-*.log

# In Kibana/Grafana
requestId: "abc-123"
```

### Tracing a User's Actions

```bash
# All actions by a user
grep "userId\":\"user-123" logs/app-*.log | grep -E "(INFO|WARN|ERROR)"

# In query language
userId: "user-123" AND level: (info OR warn OR error)
```

### Finding Slow Operations

```bash
# Queries > 100ms
grep "DB_QUERY_SLOW" logs/app-*.log

# Requests > 500ms
grep "HTTP_REQUEST_SLOW" logs/app-*.log
```

### Investigating Errors

```bash
# All errors in last hour
grep "ERROR" logs/error-$(date +%Y-%m-%d).log

# With stack traces
grep -A 20 "ERROR" logs/error-*.log
```

### Debugging a Tenant

```bash
# All activity for a tenant
grep "tenantId\":\"tenant-123" logs/app-*.log

# Errors only
grep "tenantId\":\"tenant-123" logs/error-*.log
```

---

## Log Aggregation

### Development

```bash
# Logs are in ./logs directory
tail -f logs/app-$(date +%Y-%m-%d).log

# Filter by level
tail -f logs/app-*.log | grep "ERROR\|WARN"
```

### Production with ELK

```yaml
# docker-compose.elk.yml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
  
  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  
  kibana:
    image: kibana:8.11.0
```

### Production with Loki

```yaml
# docker-compose.loki.yml
services:
  loki:
    image: grafana/loki:2.9.0
  
  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
  
  grafana:
    image: grafana/grafana:latest
```

### Log Retention

| Environment | Console | File | Aggregator |
|-------------|---------|------|------------|
| Development | Always | 7 days | N/A |
| Staging | Always | 14 days | 30 days |
| Production | stdout | N/A | 90 days |

---

## Monitoring Dashboards

### Recommended Panels

1. **Error Rate** - Errors per minute
2. **Response Times** - P50, P95, P99 latency
3. **Request Volume** - Requests per second
4. **Slow Queries** - Queries > 100ms
5. **Active Users** - Unique users per tenant
6. **License Usage** - Requests by tier
7. **AI Usage** - Predictions/chat per hour

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 10 errors/min | Critical |
| Slow Response | P95 > 1s | Warning |
| Database Errors | Any DB_QUERY_ERROR | Critical |
| License Expired | LICENSE_EXPIRED | Warning |
| Low Disk Space | < 10% free | Critical |

---

## Summary

1. **Log at the right level** - error, warn, info, http, debug
2. **Include context** - requestId, tenantId, userId
3. **Use events** - Categorize logs for filtering
4. **Track performance** - Monitor slow operations
5. **Mask PII** - Protect sensitive data
6. **Aggregate logs** - Use ELK/Loki in production
7. **Set up alerts** - Monitor for issues

For questions, contact the platform team.

