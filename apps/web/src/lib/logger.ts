/**
 * @fileoverview Frontend Logger for ERP System
 * 
 * Provides client-side logging capabilities with:
 * - Console output with colors in development
 * - Remote logging support for production
 * - Performance tracking
 * - Error boundary integration
 * - User context
 * 
 * @example
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User action', { action: 'click', button: 'submit' });
 * logger.error('API error', { endpoint: '/api/products', status: 500 });
 * ```
 */

// ============================================
// TYPES
// ============================================

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  route?: string;
  component?: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  service: string;
  environment: string;
}

interface LoggerConfig {
  /** Enable console logging */
  console: boolean;
  /** Enable remote logging */
  remote: boolean;
  /** Remote logging endpoint */
  remoteEndpoint?: string;
  /** Minimum log level */
  level: LogLevel;
  /** Service name */
  service: string;
  /** Batch logs before sending */
  batchSize: number;
  /** Batch timeout in ms */
  batchTimeout: number;
}

// ============================================
// CONFIGURATION
// ============================================

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const DEFAULT_CONFIG: LoggerConfig = {
  console: import.meta.env.DEV,
  remote: import.meta.env.PROD,
  remoteEndpoint: '/api/logs',
  level: import.meta.env.DEV ? 'debug' : 'info',
  service: 'web',
  batchSize: 10,
  batchTimeout: 5000,
};

// ============================================
// LOGGER CLASS
// ============================================

class FrontendLogger {
  private config: LoggerConfig;
  private context: LogContext = {};
  private buffer: LogEntry[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    
    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  // ============================================
  // LOG METHODS
  // ============================================

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  // ============================================
  // CONTEXT MANAGEMENT
  // ============================================

  /**
   * Set global context for all subsequent logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Set user context
   */
  setUser(userId: string, tenantId?: string): void {
    this.context.userId = userId;
    if (tenantId) {
      this.context.tenantId = tenantId;
    }
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    delete this.context.userId;
    delete this.context.tenantId;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): FrontendLogger {
    const child = new FrontendLogger(this.config);
    child.context = { ...this.context, ...context };
    child.sessionId = this.sessionId;
    return child;
  }

  // ============================================
  // SPECIALIZED LOGGING
  // ============================================

  /**
   * Log an API request/response
   */
  apiCall(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    error?: string
  ): void {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'debug';
    
    this.log(level, `API ${method} ${endpoint}`, {
      method,
      endpoint,
      status,
      duration,
      error,
      event: 'API_CALL',
    });
  }

  /**
   * Log a page view
   */
  pageView(route: string, title?: string): void {
    this.info('Page view', {
      route,
      title,
      event: 'PAGE_VIEW',
    });
  }

  /**
   * Log a user action
   */
  userAction(action: string, target?: string, metadata?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, {
      action,
      target,
      event: 'USER_ACTION',
      ...metadata,
    });
  }

  /**
   * Log a React error boundary catch
   */
  errorBoundary(error: Error, componentStack: string): void {
    this.error('React error boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack,
      event: 'ERROR_BOUNDARY',
    });
  }

  /**
   * Log performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      event: 'PERFORMANCE',
    });
  }

  // ============================================
  // PERFORMANCE TRACKING
  // ============================================

  /**
   * Track an operation's duration
   */
  track(operation: string): { end: (metadata?: Record<string, unknown>) => void } {
    const startTime = performance.now();
    
    return {
      end: (metadata?: Record<string, unknown>) => {
        const duration = Math.round(performance.now() - startTime);
        this.performance(operation, duration, 'ms');
        
        if (metadata) {
          this.debug(`${operation} completed`, {
            ...metadata,
            duration,
            operation,
          });
        }
      },
    };
  }

  // ============================================
  // INTERNAL METHODS
  // ============================================

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if we should log at this level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        ...context,
        sessionId: this.sessionId,
        route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      },
      service: this.config.service,
      environment: import.meta.env.MODE,
    };

    // Console logging
    if (this.config.console) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.remote) {
      this.addToBuffer(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const colors: Record<LogLevel, string> = {
      error: 'color: #ff4444; font-weight: bold;',
      warn: 'color: #ffaa00; font-weight: bold;',
      info: 'color: #4488ff;',
      debug: 'color: #888888;',
    };

    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `%c[${timestamp}] [${entry.level.toUpperCase()}]`;
    
    const args: unknown[] = [prefix, colors[entry.level], entry.message];
    
    if (Object.keys(entry.context).length > 0) {
      args.push(entry.context);
    }

    switch (entry.level) {
      case 'error':
        console.error(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'debug':
        console.log(...args);
        break;
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.config.batchTimeout);
    }
  }

  /**
   * Send buffered logs to remote endpoint
   */
  async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          this.config.remoteEndpoint,
          JSON.stringify({ logs: entries })
        );
      } else {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs: entries }),
          keepalive: true,
        });
      }
    } catch (error) {
      // Don't log errors to avoid infinite loop
      console.error('Failed to send logs:', error);
    }
  }

  private generateSessionId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const logger = new FrontendLogger();

// ============================================
// REACT HOOKS
// ============================================

/**
 * Create a logger for a specific component
 */
export function useLogger(componentName: string) {
  return logger.child({ component: componentName });
}

// ============================================
// ERROR BOUNDARY HELPER
// ============================================

/**
 * Log error from React error boundary
 */
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  logger.errorBoundary(error, errorInfo.componentStack);
}

// ============================================
// API CLIENT INTEGRATION
// ============================================

/**
 * Create axios interceptor for logging
 */
export function createApiLoggerInterceptor() {
  return {
    request: (config: any) => {
      config.metadata = { startTime: performance.now() };
      return config;
    },
    response: (response: any) => {
      const duration = Math.round(
        performance.now() - (response.config.metadata?.startTime || 0)
      );
      logger.apiCall(
        response.config.method?.toUpperCase() || 'GET',
        response.config.url || '',
        response.status,
        duration
      );
      return response;
    },
    error: (error: any) => {
      const duration = Math.round(
        performance.now() - (error.config?.metadata?.startTime || 0)
      );
      logger.apiCall(
        error.config?.method?.toUpperCase() || 'GET',
        error.config?.url || '',
        error.response?.status || 0,
        duration,
        error.message
      );
      return Promise.reject(error);
    },
  };
}

export default logger;

