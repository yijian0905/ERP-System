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

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// Mock users for development (replace with database queries)
// Note: Password hash is generated at runtime for "password123"
let MOCK_USERS_PASSWORD_HASH = '$2a$10$rGqOG.xSRKF3xvT0.qC1QODq7L5m/BuL3LY1xE1qZ5zV6Y.bT5KIi';

// Generate fresh hash on startup (temporary for debugging)
bcrypt.hash('password123', 10).then(hash => {
  MOCK_USERS_PASSWORD_HASH = hash;
  logger.info('[AUTH] Generated fresh password hash for development users');
  logger.info(`[AUTH] Hash: ${hash}`);
});

const MOCK_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'admin@demo-company.com',
    name: 'Admin User',
    get password() { return MOCK_USERS_PASSWORD_HASH; }, // Dynamic hash
    role: 'ADMIN' as const,
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    tenantName: 'Demo Company',
    tier: 'L2' as const,
    permissions: [
      'users:view', 'users:create', 'users:update', 'users:delete',
      'products:view', 'products:create', 'products:update', 'products:delete',
      'inventory:view', 'inventory:adjust', 'inventory:transfer',
      'customers:view', 'customers:create', 'customers:update', 'customers:delete',
      'suppliers:view', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
      'orders:view', 'orders:create', 'orders:update', 'orders:delete', 'orders:approve',
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:delete', 'invoices:send',
      'payments:view', 'payments:create', 'payments:update',
      'reports:view', 'reports:export',
      'settings:view', 'settings:update',
      'ai:predictions',
    ],
    isActive: true,
  },
  // L3 Enterprise Test Account
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    email: 'admin@enterprise.test',
    name: 'Enterprise Admin',
    get password() { return MOCK_USERS_PASSWORD_HASH; }, // Dynamic hash
    role: 'ADMIN' as const,
    tenantId: '550e8400-e29b-41d4-a716-446655440011',
    tenantName: 'Enterprise Corp',
    tier: 'L3' as const,
    permissions: [
      // Standard permissions (using dot notation to match frontend)
      'dashboard.view',
      'users.view', 'users.create', 'users.update', 'users.delete',
      'products.view', 'products.create', 'products.edit', 'products.delete',
      'inventory.view', 'inventory.adjust', 'inventory.transfer',
      'warehouses.view', 'warehouses.manage',
      'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
      'suppliers.view', 'suppliers.manage',
      'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
      'invoices.view', 'invoices.create', 'invoices.print',
      'payments.view', 'payments.record',
      'purchasing.view', 'purchasing.create', 'purchasing.approve',
      'requisitions.view', 'requisitions.create', 'requisitions.approve',
      'cost-centers.view', 'cost-centers.manage',
      'assets.view', 'assets.manage',
      'recurring.view', 'recurring.manage',
      'reports.view', 'reports.export',
      'forecasting.view',
      'settings.view', 'settings.edit', 'settings.users', 'settings.company',
      // L3 Enterprise exclusive features
      'ai.chat', // L3 GenAI Chat Assistant
      'audit.view', // L3 Audit logs
    ],
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'manager@demo-company.com',
    name: 'Manager User',
    get password() { return MOCK_USERS_PASSWORD_HASH; }, // Dynamic hash
    role: 'MANAGER' as const,
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    tenantName: 'Demo Company',
    tier: 'L2' as const,
    permissions: [
      'users:view',
      'products:view', 'products:create', 'products:update',
      'inventory:view', 'inventory:adjust', 'inventory:transfer',
      'customers:view', 'customers:create', 'customers:update',
      'suppliers:view', 'suppliers:create', 'suppliers:update',
      'orders:view', 'orders:create', 'orders:update', 'orders:approve',
      'invoices:view', 'invoices:create', 'invoices:update', 'invoices:send',
      'payments:view', 'payments:create',
      'reports:view', 'reports:export',
      'ai:predictions',
    ],
    isActive: true,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'user@demo-company.com',
    name: 'Regular User',
    get password() { return MOCK_USERS_PASSWORD_HASH; }, // Dynamic hash
    role: 'USER' as const,
    tenantId: '550e8400-e29b-41d4-a716-446655440001',
    tenantName: 'Demo Company',
    tier: 'L2' as const,
    permissions: [
      'products:view',
      'inventory:view',
      'customers:view', 'customers:create',
      'suppliers:view',
      'orders:view', 'orders:create',
      'invoices:view', 'invoices:create',
      'payments:view',
      'reports:view',
    ],
    isActive: true,
  },
];

// In-memory refresh token store (replace with Redis in production)
const refreshTokenStore = new Map<string, { userId: string; family: string; expiresAt: number }>();

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
      } as any,
    },
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      logger.info('[AUTH] Login request received', { //debug log
        email: request.body?.email, //debug log
        hasPassword: !!request.body?.password, //debug log
        ip: request.ip, //debug log
        userAgent: request.headers['user-agent'], //debug log
        origin: request.headers.origin, //debug log
      }); //debug log

      const validation = loginSchema.safeParse(request.body);
      if (!validation.success) {
        logger.warn('[AUTH] Validation failed', { //debug log
          errors: validation.error.errors, //debug log
        }); //debug log
        return reply.status(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
          },
        });
      }

      const { email, password } = validation.data;
      logger.info('[AUTH] Validation successful, looking up user', { email }); //debug log

      // Find user (replace with database query)
      const user = MOCK_USERS.find((u) => u.email === email);
      logger.info('[AUTH] User lookup result', { //debug log
        email, //debug log
        found: !!user, //debug log
        availableUsers: MOCK_USERS.map(u => u.email), //debug log
      }); //debug log

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

      // Verify password
      logger.info('[AUTH] Verifying password', { //debug log
        email, //debug log
        passwordLength: password.length, //debug log
        passwordPreview: password.substring(0, 3) + '...', //debug log
        storedHashPreview: user.password.substring(0, 20) + '...', //debug log
      }); //debug log
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      logger.info('[AUTH] Password verification result', { //debug log
        email, //debug log
        isValid: isValidPassword, //debug log
        providedPassword: password, //debug log - REMOVE IN PRODUCTION!
        storedHash: user.password, //debug log - REMOVE IN PRODUCTION!
      }); //debug log

      if (!isValidPassword) {
        /*logger.warn(`Failed login attempt for: ${email}`);*/ //after delete debug log, bring back this line
        logger.warn(`[AUTH] Failed login attempt for: ${email}`); //debug log
        return reply.status(401).send({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        });
      }

      // Generate tokens
      logger.info('[AUTH] Generating tokens', { email }); //debug log
      const config = getJwtConfig();
      const family = generateTokenFamily();

      const tokens = generateTokenPair(
        {
          sub: user.id,
          tid: user.tenantId,
          email: user.email,
          role: user.role,
          tier: user.tier,
          permissions: user.permissions,
        },
        family,
        config
      );

      // Store refresh token (replace with database/Redis)
      const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
      refreshTokenStore.set(tokens.refreshToken, {
        userId: user.id,
        family,
        expiresAt: refreshExpiresAt,
      });

      /*logger.info(`User logged in: ${email}`);*/ //after delete debug log, bring back this line
      logger.info(`[AUTH] User logged in successfully: ${email}`, { //debug log
        userId: user.id, //debug log
        role: user.role, //debug log
        tier: user.tier, //debug log
        tenantId: user.tenantId, //debug log
      }); //debug log
      /*return reply.send({*/ //after delete debug log, bring back this line
      const responseData = { //debug log
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: null,
            role: user.role,
            tenantId: user.tenantId,
            tenantName: user.tenantName,
            tier: user.tier,
            permissions: user.permissions,
          },
        },
      }; //debug log

      logger.info('[AUTH] Sending login response', { //debug log
        hasAccessToken: !!responseData.data.accessToken, //debug log
        hasRefreshToken: !!responseData.data.refreshToken, //debug log
        userId: responseData.data.user.id, //debug log
      });

      return reply.send(responseData); //debug log
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
      } as any,
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

        // Check if token is in store (not revoked)
        const storedToken = refreshTokenStore.get(refreshToken);
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

        // Check if token family matches (detect token reuse attacks)
        if (storedToken.family !== decoded.family) {
          // Possible token reuse attack - revoke all tokens in family
          logger.warn(`Token family mismatch - possible reuse attack for user: ${decoded.sub}`);
          
          // Revoke all tokens for this user
          for (const [token, data] of refreshTokenStore.entries()) {
            if (data.userId === decoded.sub) {
              refreshTokenStore.delete(token);
            }
          }

          return reply.status(401).send({
            success: false,
            error: {
              code: 'TOKEN_REUSED',
              message: 'Security alert: Please login again',
            },
          });
        }

        // Get user data (replace with database query)
        const user = MOCK_USERS.find((u) => u.id === decoded.sub);
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
        refreshTokenStore.delete(refreshToken);

        // Generate new token pair
        const newFamily = generateTokenFamily();
        const tokens = generateTokenPair(
          {
            sub: user.id,
            tid: user.tenantId,
            email: user.email,
            role: user.role,
            tier: user.tier,
            permissions: user.permissions,
          },
          newFamily,
          config
        );

        // Store new refresh token
        const refreshExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        refreshTokenStore.set(tokens.refreshToken, {
          userId: user.id,
          family: newFamily,
          expiresAt: refreshExpiresAt,
        });

        return reply.send({
          success: true,
          data: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
          },
        });
      } catch (error) {
        logger.warn('Refresh token verification failed', { error });

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
        // Revoke the specific refresh token
        refreshTokenStore.delete(refreshToken);
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
      } as any,
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
        // Revoke all tokens for this user
        let revokedCount = 0;
        for (const [token, data] of refreshTokenStore.entries()) {
          if (data.userId === user.sub) {
            refreshTokenStore.delete(token);
            revokedCount++;
          }
        }
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
      } as any,
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

      // Get full user data (replace with database query)
      const user = MOCK_USERS.find((u) => u.id === tokenPayload.sub);

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: null,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenantName,
          tier: user.tier,
          permissions: user.permissions,
        },
      });
    }
  );
}
