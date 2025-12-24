import type { ApiResponse } from '@erp/shared-types';
import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';

import {
  type AccessTokenPayload,
  extractBearerToken,
  getJwtConfig,
  getTokenErrorMessage,
  verifyAccessToken,
} from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

/**
 * Authentication middleware that verifies JWT and sets user context
 */
export function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  try {
    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: getTokenErrorMessage('TOKEN_MISSING'),
        },
      };
      reply.status(401).send(response);
      return;
    }

    const config = getJwtConfig();
    const payload = verifyAccessToken(token, config);

    // Set user context on request
    request.user = payload;
    request.tenantId = payload.tid;
    request.tier = payload.tier;

    done();
  } catch (error) {
    logger.warn('Authentication failed', { error });

    let errorCode = 'TOKEN_INVALID';
    const statusCode = 401;

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
      } else if (error.name === 'JsonWebTokenError') {
        errorCode = 'TOKEN_INVALID';
      }
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message: getTokenErrorMessage(errorCode as 'TOKEN_INVALID' | 'TOKEN_EXPIRED'),
      },
    };

    reply.status(statusCode).send(response);
  }
}

/**
 * Async version of auth middleware for use with preHandler
 */
export async function authMiddlewareAsync(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: getTokenErrorMessage('TOKEN_MISSING'),
        },
      };
      return reply.status(401).send(response);
    }

    const config = getJwtConfig();
    const payload = verifyAccessToken(token, config);

    // Set user context on request
    request.user = payload;
    request.tenantId = payload.tid;
    request.tier = payload.tier;
  } catch (error) {
    logger.warn('Authentication failed', { error });

    let errorCode = 'TOKEN_INVALID';

    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
      }
    }

    const response: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message: getTokenErrorMessage(errorCode as 'TOKEN_INVALID' | 'TOKEN_EXPIRED'),
      },
    };

    return reply.status(401).send(response);
  }
}

/**
 * Optional authentication - sets user context if token is present, but doesn't fail if not
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      return; // No token, but that's okay
    }

    const config = getJwtConfig();
    const payload = verifyAccessToken(token, config);

    request.user = payload;
    request.tenantId = payload.tid;
    request.tier = payload.tier;
  } catch {
    // Token invalid, but we don't fail - just don't set user context
    logger.debug('Optional auth token invalid');
  }
}

/**
 * Get the authenticated user from request or throw
 */
export function getAuthUser(request: FastifyRequest): AccessTokenPayload {
  if (!request.user) {
    throw new Error('User not authenticated');
  }
  return request.user;
}

/**
 * Get the tenant ID from request or throw
 */
export function getTenantId(request: FastifyRequest): string {
  if (!request.tenantId) {
    throw new Error('Tenant context not available');
  }
  return request.tenantId;
}

/**
 * Check if the user has a specific permission
 */
export function hasPermission(request: FastifyRequest, permission: string): boolean {
  if (!request.user) {
    return false;
  }
  return request.user.permissions.includes(permission);
}

/**
 * Require a specific permission or return 403
 */
export async function requirePermission(
  request: FastifyRequest,
  reply: FastifyReply,
  permission: string
): Promise<boolean> {
  if (!hasPermission(request, permission)) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `You don't have permission to perform this action`,
      },
    };
    reply.status(403).send(response);
    return false;
  }
  return true;
}

/**
 * Create a permission guard middleware
 */
export function permissionGuard(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userPermissions = request.user?.permissions || [];
    const hasAllPermissions = permissions.every((p) => userPermissions.includes(p));

    if (!hasAllPermissions) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permissions: ${permissions.join(', ')}`,
        },
      };
      return reply.status(403).send(response);
    }
  };
}

/**
 * Create a role guard middleware
 */
export function roleGuard(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userRole = request.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of the following roles: ${roles.join(', ')}`,
        },
      };
      return reply.status(403).send(response);
    }
  };
}

