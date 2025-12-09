# @erp/logger

Structured logging package for the ERP System. Provides consistent, contextual logging across all services.

## Features

- 📊 **Structured JSON logging** for log aggregation
- 🔗 **Request correlation IDs** for distributed tracing
- 🔐 **PII masking** for security compliance
- ⏱️ **Performance tracking** utilities
- 📝 **Audit logging** for compliance
- 🎨 **Colorized console output** for development
- 🗂️ **File rotation** with compression

## Installation

```bash
pnpm add @erp/logger
```

## Quick Start

```typescript
import { createLogger } from '@erp/logger';

const logger = createLogger({
  service: 'api',
  environment: process.env.NODE_ENV || 'development',
});

// Basic logging
logger.info('Application started', { port: 3000 });
logger.warn('Rate limit approaching', { currentRate: 90 });
logger.error('Database connection failed', { error: err.message });

// With context
const requestLogger = logger.child({
  requestId: 'abc-123',
  tenantId: 'tenant-456',
  userId: 'user-789',
});
requestLogger.info('Processing order', { orderId: 'order-001' });
```

## Configuration

```typescript
interface LoggerConfig {
  // Service identification
  service: string;              // e.g., 'api', 'web', 'ai-service'
  environment: string;          // e.g., 'development', 'production'
  
  // Output configuration
  level: LogLevel;              // 'error' | 'warn' | 'info' | 'http' | 'debug'
  console: boolean;             // Enable console output
  file: boolean;                // Enable file output
  logDir: string;               // Directory for log files
  
  // Formatting
  json: boolean;                // JSON format (for production)
  colorize: boolean;            // Colorized output (for development)
  
  // Security
  piiFields: string[];          // Fields to mask
  
  // Performance
  slowQueryThreshold: number;   // Threshold in ms for slow query warnings
}
```

### Default Configuration

```typescript
{
  service: 'erp',
  environment: 'development',
  level: 'debug',           // 'info' in production
  console: true,
  file: true,               // false in production (use stdout)
  logDir: './logs',
  json: false,              // true in production
  colorize: true,           // false in production
  piiFields: ['password', 'token', 'secret', ...],
  slowQueryThreshold: 100,  // ms
}
```

## Log Levels

| Level | Usage |
|-------|-------|
| `error` | System errors, unhandled exceptions, critical failures |
| `warn` | Degraded performance, deprecated usage, recoverable errors |
| `info` | Business events, state changes, audit-worthy actions |
| `http` | HTTP request/response logging |
| `debug` | Detailed diagnostic information (dev only) |

## Event Types

The logger supports categorized events for easier filtering:

```typescript
// Authentication events
logger.event('AUTH_LOGIN_SUCCESS', 'User logged in', { userId, ipAddress });
logger.event('AUTH_LOGIN_FAILED', 'Login failed', { email, reason });

// Database events
logger.event('DB_QUERY_SLOW', 'Slow query detected', { query, duration });

// Business events
logger.event('ORDER_CREATED', 'New order', { orderId, customerId, total });
logger.event('INVOICE_PRINTED', 'Invoice printed', { invoiceId });
logger.event('INVENTORY_LOW_STOCK', 'Low stock warning', { productId, qty });

// License events
logger.event('LICENSE_VALIDATED', 'License check passed', { tenantId, tier });
logger.event('LICENSE_EXPIRED', 'License expired', { tenantId });
```

## Context Management

### Request Context

```typescript
// Create a child logger with request context
const requestLogger = logger.child({
  requestId: req.id,
  tenantId: req.tenant.id,
  userId: req.user.id,
});

// All subsequent logs include this context
requestLogger.info('Processing request');
// Output includes: { requestId, tenantId, userId, ... }
```

### Global Context

```typescript
// Set context for all logs from this logger instance
logger.setContext({
  deploymentId: 'deploy-123',
  region: 'us-east-1',
});
```

## Performance Tracking

```typescript
// Track operation duration
const perf = logger.track('database.findProducts');
const products = await db.product.findMany();
perf.end({ count: products.length });
// Output: "database.findProducts completed in 45ms { count: 150 }"

// Automatic slow query detection
// If duration > slowQueryThreshold, logs at 'warn' level
```

## Specialized Logging Methods

### HTTP Requests

```typescript
logger.httpRequest({
  method: 'GET',
  path: '/api/products',
  statusCode: 200,
  duration: 45,
  requestId: 'req-123',
  tenantId: 'tenant-456',
  userId: 'user-789',
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
});
```

### Database Operations

```typescript
logger.dbOperation({
  operation: 'query',
  model: 'Product',
  action: 'findMany',
  duration: 45,
  tenantId: 'tenant-456',
  rowsAffected: 150,
});
```

### License Validation

```typescript
logger.licenseCheck({
  tenantId: 'tenant-456',
  tier: 'L2',
  feature: 'predictions',
  valid: true,
});
```

### AI Operations

```typescript
logger.aiOperation({
  type: 'prediction',
  model: 'demand-forecast',
  tenantId: 'tenant-456',
  duration: 230,
  cached: false,
});
```

## PII Masking

Sensitive data is automatically masked in logs:

```typescript
logger.info('User data', {
  email: 'user@example.com',     // → u***@example.com
  password: 'secret123',         // → [REDACTED]
  creditCard: '4532-1234-5678',  // → ****-****-****-5678
  phone: '555-123-4567',         // → ***-***-4567
});
```

### Custom PII Fields

```typescript
const logger = createLogger({
  piiFields: ['ssn', 'taxId', 'bankAccount'],
});
```

## Audit Logging

For compliance and security tracking:

```typescript
logger.audit({
  event: 'USER_ROLE_CHANGED',
  actorId: adminUser.id,
  actorType: 'user',
  targetType: 'user',
  targetId: targetUser.id,
  tenantId: tenant.id,
  oldValues: { role: 'user' },
  newValues: { role: 'admin' },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});
```

## File Output

In development, logs are written to files with daily rotation:

```
logs/
├── app-2024-12-07.log      # All logs
├── app-2024-12-06.log.gz   # Compressed previous day
├── error-2024-12-07.log    # Error logs only
└── error-2024-12-06.log.gz
```

Configuration:
- Max file size: 20MB
- Max retention: 14 days
- Automatic compression

## Production Configuration

```typescript
const logger = createLogger({
  service: 'api',
  environment: 'production',
  level: 'info',
  console: true,        // stdout for container logs
  file: false,          // Use log aggregator instead
  json: true,           // Structured for parsing
  colorize: false,      // No ANSI codes
});
```

### Docker/Kubernetes

Logs go to stdout in JSON format for collection by log aggregators:

```json
{"timestamp":"2024-12-07T10:30:00.000Z","level":"info","message":"User logged in","service":"api","context":{"userId":"123","tenantId":"456","requestId":"req-789"}}
```

## Integration Examples

### Fastify

```typescript
import loggerPlugin from './plugins/logger.plugin';

fastify.register(loggerPlugin, {
  service: 'api',
  logRequests: true,
  slowRequestThreshold: 500,
});

// In route handlers
fastify.get('/products', async (request, reply) => {
  const logger = createRouteLogger(request, 'products');
  logger.info('Fetching products');
  // ...
});
```

### Express

```typescript
import { createLogger } from '@erp/logger';

const logger = createLogger({ service: 'api' });

app.use((req, res, next) => {
  req.logger = logger.child({
    requestId: req.id,
    tenantId: req.tenant?.id,
  });
  next();
});
```

### React

```typescript
import { logger, useLogger } from '@/lib/logger';

function ProductList() {
  const log = useLogger('ProductList');
  
  useEffect(() => {
    log.info('Component mounted');
  }, []);
  
  const handleClick = () => {
    log.userAction('click', 'add-product-button');
  };
}
```

## Error Handling

```typescript
try {
  await processOrder(orderId);
} catch (error) {
  logger.error('Order processing failed', {
    orderId,
    error: error.message,
    stack: error.stack,
    code: error.code,
  });
  throw error;
}
```

## Best Practices

1. **Always include context** - Request ID, tenant ID, user ID
2. **Use appropriate levels** - Don't log debug in production
3. **Log business events** - Not just errors, but meaningful actions
4. **Mask sensitive data** - Add custom PII fields as needed
5. **Track performance** - Use `track()` for critical operations
6. **Structure for search** - Use consistent field names

## API Reference

### `createLogger(config?)`

Creates a new logger instance.

### `logger.error(message, context?)`
### `logger.warn(message, context?)`
### `logger.info(message, context?)`
### `logger.http(message, context?)`
### `logger.debug(message, context?)`

Log at specified level.

### `logger.event(eventType, message, context?)`

Log with event categorization.

### `logger.child(context)`

Create child logger with additional context.

### `logger.setContext(context)`

Set default context for all logs.

### `logger.track(operation)`

Start performance tracking, returns `{ end: (metadata?) => void }`.

### `logger.audit(entry)`

Log audit trail entry.

### `logger.maskPII(data)`

Manually mask PII in an object.

### `logger.close()`

Flush and close all transports.

