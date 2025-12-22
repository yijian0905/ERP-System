import type { ApiResponse } from '@erp/shared-types';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@erp/database';

import { logger } from './logger.js';

/**
 * Standard error codes used across the API
 */
export const ErrorCodes = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_ID: 'INVALID_ID',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

  // License errors
  LICENSE_REQUIRED: 'LICENSE_REQUIRED',
  LICENSE_INVALID: 'LICENSE_INVALID',
  LICENSE_EXPIRED: 'LICENSE_EXPIRED',
  TIER_INSUFFICIENT: 'TIER_INSUFFICIENT',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Create a not found error
 */
export function notFoundError(resource: string): AppError {
  return new AppError(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    404
  );
}

/**
 * Create a validation error
 */
export function validationError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    message,
    400,
    details
  );
}

/**
 * Create an unauthorized error
 */
export function unauthorizedError(message: string = 'Authentication required'): AppError {
  return new AppError(
    ErrorCodes.UNAUTHORIZED,
    message,
    401
  );
}

/**
 * Create a forbidden error
 */
export function forbiddenError(message: string = 'Access denied'): AppError {
  return new AppError(
    ErrorCodes.FORBIDDEN,
    message,
    403
  );
}

/**
 * Create a conflict error
 */
export function conflictError(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(
    ErrorCodes.CONFLICT,
    message,
    409,
    details
  );
}

/**
 * Get appropriate error code from Prisma error
 */
function getPrismaErrorCode(error: Prisma.PrismaClientKnownRequestError): ErrorCode {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return ErrorCodes.CONFLICT;
    case 'P2025': // Record not found
      return ErrorCodes.NOT_FOUND;
    default:
      return ErrorCodes.DATABASE_ERROR;
  }
}

/**
 * Get user-friendly message from Prisma error
 */
function getPrismaErrorMessage(error: Prisma.PrismaClientKnownRequestError): string {
  switch (error.code) {
    case 'P2002':
      return 'A record with this value already exists';
    case 'P2025':
      return 'The requested record was not found';
    case 'P2003':
      return 'Related record not found';
    default:
      return 'A database error occurred';
  }
}

/**
 * Main error handler for Fastify
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the error with context
  logger.error({
    message: error.message,
    stack: isProduction ? undefined : error.stack,
    url: request.url,
    method: request.method,
    requestId: request.id,
    errorName: error.name,
  });

  // Handle custom AppError
  if (error instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && !isProduction && { details: error.details }),
      },
    };
    return reply.status(error.statusCode).send(response);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: {
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
    };
    return reply.status(400).send(response);
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    const code = getPrismaErrorCode(prismaError);
    const message = getPrismaErrorMessage(prismaError);
    const statusCode = code === ErrorCodes.NOT_FOUND ? 404 :
      code === ErrorCodes.CONFLICT ? 409 : 500;

    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(!isProduction && { details: { prismaCode: prismaError.code } }),
      },
    };
    return reply.status(statusCode).send(response);
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.SERVICE_UNAVAILABLE,
        message: 'Database connection error',
      },
    };
    return reply.status(503).send(response);
  }

  // Handle JWT errors (Fastify JWT plugin codes)
  const fastifyError = error as FastifyError;

  if (fastifyError.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.UNAUTHORIZED,
        message: 'Authorization header is missing',
      },
    };
    return reply.status(401).send(response);
  }

  if (fastifyError.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.TOKEN_EXPIRED,
        message: 'Token has expired',
      },
    };
    return reply.status(401).send(response);
  }

  if (fastifyError.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.INVALID_TOKEN,
        message: 'Token is invalid',
      },
    };
    return reply.status(401).send(response);
  }

  // Handle rate limit errors
  if (fastifyError.statusCode === 429) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests, please try again later',
      },
    };
    return reply.status(429).send(response);
  }

  // Default error handling
  const statusCode = fastifyError.statusCode || 500;
  const response: ApiResponse = {
    success: false,
    error: {
      code: statusCode >= 500 ? ErrorCodes.INTERNAL_ERROR : 'ERROR',
      message: statusCode >= 500 ? 'An unexpected error occurred' : error.message,
      // Include debug info in non-production
      ...(!isProduction && statusCode >= 500 && {
        details: {
          errorName: error.name,
          errorMessage: error.message,
        }
      }),
    },
  };

  return reply.status(statusCode).send(response);
}

/**
 * Not found handler for undefined routes
 */
export function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const response: ApiResponse = {
    success: false,
    error: {
      code: ErrorCodes.NOT_FOUND,
      message: `Route ${request.method} ${request.url} not found`,
    },
  };
  return reply.status(404).send(response);
}
