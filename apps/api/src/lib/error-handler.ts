import type { ApiResponse } from '@erp/shared-types';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

import { logger } from './logger.js';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error({
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.flatten().fieldErrors,
      },
    };
    return reply.status(400).send(response);
  }

  // JWT errors
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is missing',
      },
    };
    return reply.status(401).send(response);
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
    };
    return reply.status(401).send(response);
  }

  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token is invalid',
      },
    };
    return reply.status(401).send(response);
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    };
    return reply.status(429).send(response);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const response: ApiResponse = {
    success: false,
    error: {
      code: statusCode === 500 ? 'INTERNAL_ERROR' : 'ERROR',
      message: statusCode === 500 ? 'Internal server error' : error.message,
    },
  };

  return reply.status(statusCode).send(response);
}

