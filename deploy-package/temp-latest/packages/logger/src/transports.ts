/**
 * @fileoverview Winston transport configurations for ERP Logger
 * 
 * Provides configured transports for console, file, and external services.
 * Each transport is optimized for its target environment.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { LoggerConfig, LogLevel, LOG_LEVELS } from './types';

// ============================================
// FORMAT HELPERS
// ============================================

/**
 * Custom format for colorized console output
 */
const colorizedFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, event, context, stack }) => {
    const colors: Record<LogLevel, string> = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[32m',  // Green
      http: '\x1b[36m',  // Cyan
      debug: '\x1b[90m', // Gray
    };
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const dim = '\x1b[2m';

    const levelColor = colors[level as LogLevel] || reset;
    const levelStr = level.toUpperCase().padEnd(5);
    
    let output = `${dim}${timestamp}${reset} ${levelColor}${bold}${levelStr}${reset}`;
    
    if (service) {
      output += ` ${dim}[${service}]${reset}`;
    }
    
    if (event) {
      output += ` ${bold}${event}${reset}`;
    }
    
    output += ` ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context, null, 0);
      if (contextStr !== '{}') {
        output += ` ${dim}${contextStr}${reset}`;
      }
    }
    
    if (stack) {
      output += `\n${dim}${stack}${reset}`;
    }
    
    return output;
  })
);

/**
 * JSON format for production/aggregation
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Simple format for file logging in development
 */
const simpleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, event, context, stack }) => {
    let output = `${timestamp} [${level.toUpperCase().padEnd(5)}]`;
    
    if (service) {
      output += ` [${service}]`;
    }
    
    if (event) {
      output += ` ${event}`;
    }
    
    output += ` ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }
    
    if (stack) {
      output += `\n${stack}`;
    }
    
    return output;
  })
);

// ============================================
// TRANSPORT FACTORIES
// ============================================

/**
 * Create console transport with appropriate formatting
 */
export function createConsoleTransport(config: LoggerConfig): winston.transport {
  const format = config.colorize ? colorizedFormat : (config.json ? jsonFormat : simpleFormat);
  
  return new winston.transports.Console({
    level: config.level,
    format,
    handleExceptions: true,
    handleRejections: true,
  });
}

/**
 * Create file transport with daily rotation
 */
export function createFileTransport(config: LoggerConfig, type: 'combined' | 'error' = 'combined'): winston.transport {
  const logDir = config.logDir || path.join(process.cwd(), 'logs');
  const filename = type === 'error' ? 'error-%DATE%.log' : 'app-%DATE%.log';
  
  return new DailyRotateFile({
    dirname: logDir,
    filename,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: type === 'error' ? 'error' : config.level,
    format: config.json ? jsonFormat : simpleFormat,
    handleExceptions: type === 'error',
    handleRejections: type === 'error',
  });
}

/**
 * Create HTTP transport for external log aggregation
 */
export function createHttpTransport(
  endpoint: string,
  apiKey?: string,
  config?: LoggerConfig
): winston.transport {
  return new winston.transports.Http({
    host: new URL(endpoint).hostname,
    port: parseInt(new URL(endpoint).port) || 443,
    path: new URL(endpoint).pathname,
    ssl: endpoint.startsWith('https'),
    level: config?.level || 'info',
    format: jsonFormat,
    headers: apiKey ? { 'X-API-Key': apiKey } : undefined,
  });
}

/**
 * Create all transports based on configuration
 */
export function createTransports(config: LoggerConfig): winston.transport[] {
  const transports: winston.transport[] = [];
  
  // Console transport (always in development, optional in production)
  if (config.console) {
    transports.push(createConsoleTransport(config));
  }
  
  // File transports
  if (config.file) {
    // Combined log (all levels)
    transports.push(createFileTransport(config, 'combined'));
    // Error log (errors only)
    transports.push(createFileTransport(config, 'error'));
  }
  
  // External transport
  if (config.externalTransport?.endpoint) {
    transports.push(
      createHttpTransport(
        config.externalTransport.endpoint,
        config.externalTransport.apiKey,
        config
      )
    );
  }
  
  return transports;
}

// ============================================
// LOG LEVEL UTILITIES
// ============================================

/**
 * Get log level for environment
 */
export function getLogLevelForEnvironment(env: string): LogLevel {
  switch (env) {
    case 'production':
      return 'info';
    case 'staging':
      return 'debug';
    case 'test':
      return 'error';
    default:
      return 'debug';
  }
}

/**
 * Check if a level should be logged
 */
export function shouldLog(currentLevel: LogLevel, targetLevel: LogLevel): boolean {
  return LOG_LEVELS[currentLevel] <= LOG_LEVELS[targetLevel];
}

