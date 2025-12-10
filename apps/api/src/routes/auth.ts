import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@erp/shared-types';
import bcrypt from 'bcryptjs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  generateTokenFamily,
  generateTokenPair,
  getJwtConfig,
  verifyRefreshToken,
} from '../lib/jwt.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Find user by email from database
 */
async function findUserByEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: {
      email,
      isActive: true,
      deletedAt: null,
    },
    include: {
      tenant: true,
      customRole: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Find user by ID from database
 */
async function findUserById(id: string) {
  const user = await prisma.user.findFirst({
    where: {
      id,
      isActive: true,
      deletedAt: null,
    },
    include: {
      tenant: true,
      customRole: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return user;
}

/**
 * Get user permissions from custom role or default role
 */
function getUserPermissions(user: Awaited<ReturnType<typeof findUserByEmail>>): string[] {
  if (!user) return [];

  // If user has custom role with permissions, use those
  if (user.customRole?.permissions) {
    return user.customRole.permissions.map(rp => rp.permission.code);
  }

  // Otherwise, use default permissions based on role
  const defaultPermissions: Record<string, string[]> = {
    ADMIN: [
      'users.view', 'users.create', 'users.update', 'users.delete',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
      'suppliers.view', 'suppliers.manage',
      'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
      'invoices.view', 'invoices.create', 'invoices.print',
      'payments.view', 'payments.record',
      'reports.view', 'reports.export',
      'settings.view', 'settings.edit', 'settings.users', 'settings.company',
      'audit.view',
    ],
    MANAGER: [
      'users.view',
      'products.view', 'products.create', 'products.edit',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'customers.view', 'customers.create', 'customers.edit',
      'suppliers.view', 'suppliers.manage',
      'orders.view', 'orders.create', 'orders.edit',
      'invoices.view', 'invoices.create', 'invoices.print',
      'payments.view', 'payments.record',
      'reports.view', 'reports.export',
    ],
    USER: [
      'products.view',
      'inventory.view',
      'customers.view', 'customers.create',
      'suppliers.view',
      'orders.view', 'orders.create',
      'invoices.view', 'invoices.create',
      'payments.view',
      'reports.view',
    ],
    VIEWER: [
      'products.view',
      'inventory.view',
      'customers.view',
      'suppliers.view',
      'orders.view',
      'invoices.view',
      'payments.view',
      'reports.view',
    ],
  };

  return defaultPermissions[user.role] || [];
}

/**
 * Store refresh token in database
 */
async function storeRefreshToken(
  userId: string,
  token: string,
  family: string,
  expiresAt: Date,
  request: FastifyRequest
) {
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      userAgent: request.headers['user-agent'] || null,
      ipAddress: request.ip || null,
      expiresAt,
    },
  });
}

/**
 * Get refresh token from database
 */
async function getRefreshToken(token: string) {
  return prisma.refreshToken.findUnique({
    where: { token },
  });
}

/**
 * Delete refresh token from database
 */
async function deleteRefreshToken(token: string) {
  await prisma.refreshToken.delete({
    where: { token },
  }).catch(() => {
    // Ignore if token doesn't exist
  });
}

/**
 * Delete all refresh tokens for a user
 */
async function deleteAllUserRefreshTokens(userId: string) {
  const result = await prisma.refreshToken.deleteMany({
    where: { userId },
  });
  return result.count;
}

/**
 * Clean up expired refresh tokens (should be run periodically)
 */
async function cleanupExpiredTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/login
   * Authenticate user and return tokens
   */
  fastify.post<{
    Body: LoginRequest;
    Reply: ApiResponse<LoginResponse>;
  }>(
    '/login',
    {
      schema: {
        description: 'Authenticate user and get JWT tokens',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
            rememberMe: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                  expiresIn: { type: 'number' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string' },
                      role: { type: 'string' },
                      tenantId: { type: 'string' },
                      tenantName: { type: 'string' },
                      tier: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      const validation = loginSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const { email, password } = validation.data;

      // Find user from database
      const user = await findUserByEmail(email);

      if (!user) {
        logger.warn(`Login attempt for unknown email: ${email}`);
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Check if user is active
      if (!user.isActive) {
        logger.warn(`Login attempt for inactive user: ${email}`);
        return reply.status(401).send({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Your account has been disabled. Please contact support.',
          },
        });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        logger.warn(`Login attempt for locked account: ${email}`);
        return reply.status(401).send({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Your account is temporarily locked. Please try again later.',
          },
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Increment failed login count
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLogins: { increment: 1 },
            // Lock account after 5 failed attempts for 15 minutes
            lockedUntil: user.failedLogins >= 4
              ? new Date(Date.now() + 15 * 60 * 1000)
              : null,
          },
        });

        logger.warn(`Failed login attempt for: ${email}`);
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Reset failed login count and update last login
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: request.ip,
        },
      });

      // Generate tokens
      const config = getJwtConfig();
      const family = generateTokenFamily();
      const permissions = getUserPermissions(user);

      const tokens = generateTokenPair(
        {
          sub: user.id,
          tid: user.tenantId,
          email: user.email,
          role: user.role,
          tier: user.tenant.tier,
          permissions,
        },
        family,
        config
      );

      // Store refresh token in database
      const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await storeRefreshToken(user.id, tokens.refreshToken, family, refreshExpiresAt, request);

      logger.info(`User logged in: ${email}`);

      return reply.send({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenant.name,
            tier: user.tenant.tier,
            permissions,
          },
        },
      });
    }
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{
    Body: RefreshTokenRequest;
    Reply: ApiResponse<RefreshTokenResponse>;
  }>(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token',
        tags: ['Auth'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RefreshTokenRequest }>, reply: FastifyReply) => {
      const validation = refreshSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const { refreshToken } = validation.data;

      try {
        const config = getJwtConfig();

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken, config);

        // Check if token exists in database (not revoked)
        const storedToken = await getRefreshToken(refreshToken);
        if (!storedToken) {
          logger.warn(`Refresh token not found or revoked for user: ${decoded.sub}`);
          return reply.status(401).send({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Refresh token is invalid or has been revoked',
            },
          });
        }

        // Check if token has expired
        if (storedToken.expiresAt < new Date()) {
          await deleteRefreshToken(refreshToken);
          return reply.status(401).send({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Refresh token has expired. Please login again.',
            },
          });
        }

        // Get user data from database
        const user = await findUserById(decoded.sub);
        if (!user) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found',
            },
          });
        }

        // Delete old refresh token (rotation)
        await deleteRefreshToken(refreshToken);

        // Generate new token pair
        const newFamily = generateTokenFamily();
        const permissions = getUserPermissions(user);

        const tokens = generateTokenPair(
          {
            sub: user.id,
            tid: user.tenantId,
            email: user.email,
            role: user.role,
            tier: user.tenant.tier,
            permissions,
          },
          newFamily,
          config
        );

        // Store new refresh token
        const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await storeRefreshToken(user.id, tokens.refreshToken, newFamily, refreshExpiresAt, request);

        return reply.send({
          success: true,
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
          },
        });
      } catch (error) {
        logger.warn('Refresh token verification failed');

        if (error instanceof Error && error.name === 'TokenExpiredError') {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Refresh token has expired. Please login again.',
            },
          });
        }

        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid refresh token',
          },
        });
      }
    }
  );

  /**
   * POST /auth/logout
   * Logout and invalidate refresh token
   */
  fastify.post(
    '/logout',
    {
      schema: {
        description: 'Logout and invalidate tokens',
        tags: ['Auth'],
        body: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: { refreshToken?: string } }>, reply: FastifyReply) => {
      const { refreshToken } = request.body || {};

      if (refreshToken) {
        await deleteRefreshToken(refreshToken);
        logger.info('Refresh token revoked');
      }

      return reply.send({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    }
  );

  /**
   * POST /auth/logout-all
   * Logout from all devices (revoke all refresh tokens)
   */
  fastify.post(
    '/logout-all',
    {
      schema: {
        description: 'Logout from all devices',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request, reply) => {
        // This route requires authentication
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;

      if (user) {
        const revokedCount = await deleteAllUserRefreshTokens(user.sub);
        logger.info(`Revoked ${revokedCount} refresh tokens for user: ${user.sub}`);
      }

      return reply.send({
        success: true,
        data: { message: 'Logged out from all devices' },
      });
    }
  );

  /**
   * GET /auth/me
   * Get current user info
   */
  fastify.get(
    '/me',
    {
      schema: {
        description: 'Get current authenticated user info',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
      },
      preHandler: async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }

        try {
          const token = authHeader.slice(7);
          const config = getJwtConfig();
          const { verifyAccessToken } = await import('../lib/jwt.js');
          request.user = verifyAccessToken(token, config);
        } catch {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired token',
            },
          });
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tokenPayload = request.user;

      if (!tokenPayload) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        });
      }

      // Get full user data from database
      const user = await findUserById(tokenPayload.sub);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      const permissions = getUserPermissions(user);

      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tier: user.tenant.tier,
          permissions,
        },
      });
    }
  );
}
