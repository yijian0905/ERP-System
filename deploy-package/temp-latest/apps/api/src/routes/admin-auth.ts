/**
 * Platform Admin Authentication Routes
 * For ERP product company's internal admin portal
 * 
 * These routes are SEPARATE from tenant user auth (/auth/*)
 * Platform admins manage all subscription tenants
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { getJwtConfig, parseTimeToSeconds } from '../lib/jwt.js';

// ============================================================================
// Types
// ============================================================================

interface PlatformAdminTokenPayload {
    sub: string;
    email: string;
    role: string;
    type: 'platform_admin';
    iat: number;
    exp: number;
}

// ============================================================================
// Validation Schemas
// ============================================================================

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// Constants
// ============================================================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;

// ============================================================================
// Helper Functions
// ============================================================================

async function findPlatformAdminByEmail(email: string) {
    return prisma.platformAdmin.findUnique({
        where: { email: email.toLowerCase() },
    });
}

async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}

async function recordFailedLogin(adminId: string, currentFailedLogins: number) {
    const updates: Record<string, unknown> = {
        failedLogins: currentFailedLogins + 1,
    };

    if (currentFailedLogins + 1 >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
    }

    await prisma.platformAdmin.update({
        where: { id: adminId },
        data: updates,
    });
}

async function recordSuccessfulLogin(adminId: string, ipAddress?: string) {
    await prisma.platformAdmin.update({
        where: { id: adminId },
        data: {
            failedLogins: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
        },
    });
}

function generatePlatformAdminAccessToken(adminId: string, email: string, role: string): string {
    const config = getJwtConfig();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseTimeToSeconds(config.accessExpiresIn);

    const payload: Omit<PlatformAdminTokenPayload, 'iat' | 'exp'> & { iat: number; exp: number } = {
        sub: adminId,
        email,
        role,
        type: 'platform_admin',
        iat: now,
        exp: now + expiresIn,
    };

    return jwt.sign(payload, config.accessSecret, {
        algorithm: 'HS256',
        issuer: config.issuer,
        audience: config.audience,
    });
}

function generatePlatformAdminRefreshToken(adminId: string): string {
    const config = getJwtConfig();
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = parseTimeToSeconds(config.refreshExpiresIn);

    const payload = {
        sub: adminId,
        type: 'platform_admin_refresh',
        iat: now,
        exp: now + expiresIn,
    };

    return jwt.sign(payload, config.refreshSecret, {
        algorithm: 'HS256',
        issuer: config.issuer,
        audience: config.audience,
    });
}

async function createRefreshToken(adminId: string, userAgent?: string, ipAddress?: string) {
    const token = generatePlatformAdminRefreshToken(adminId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.platformAdminRefreshToken.create({
        data: {
            adminId,
            token,
            userAgent,
            ipAddress,
            expiresAt,
        },
    });

    return token;
}

// ============================================================================
// Routes
// ============================================================================

export async function adminAuthRoutes(fastify: FastifyInstance) {
    /**
     * POST /admin/auth/login
     * Platform admin login
     */
    fastify.post<{
        Body: z.infer<typeof loginSchema>;
    }>(
        '/login',
        {
            schema: {
                description: 'Platform admin login',
                tags: ['Admin Auth'],
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
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
            const ipAddress = request.ip;
            const userAgent = request.headers['user-agent'];

            try {
                // Find platform admin
                const admin = await findPlatformAdminByEmail(email);

                if (!admin) {
                    logger.warn(`Platform admin login failed: email not found - ${email}`);
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'INVALID_CREDENTIALS',
                            message: 'Invalid email or password',
                        },
                    });
                }

                // Check if account is active
                if (!admin.isActive) {
                    logger.warn(`Platform admin login failed: account disabled - ${email}`);
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'ACCOUNT_DISABLED',
                            message: 'Account is disabled. Contact support.',
                        },
                    });
                }

                // Check if account is locked
                if (admin.lockedUntil && admin.lockedUntil > new Date()) {
                    const remainingMinutes = Math.ceil(
                        (admin.lockedUntil.getTime() - Date.now()) / 60000
                    );
                    logger.warn(`Platform admin login failed: account locked - ${email}`);
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'ACCOUNT_LOCKED',
                            message: `Account is locked. Try again in ${remainingMinutes} minutes.`,
                        },
                    });
                }

                // Verify password
                const passwordValid = await verifyPassword(password, admin.password);
                if (!passwordValid) {
                    await recordFailedLogin(admin.id, admin.failedLogins);
                    logger.warn(`Platform admin login failed: wrong password - ${email}`);
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'INVALID_CREDENTIALS',
                            message: 'Invalid email or password',
                        },
                    });
                }

                // Generate tokens
                const config = getJwtConfig();
                const accessToken = generatePlatformAdminAccessToken(admin.id, admin.email, admin.role);
                const refreshToken = await createRefreshToken(admin.id, userAgent, ipAddress);

                // Record successful login
                await recordSuccessfulLogin(admin.id, ipAddress);

                logger.info(`Platform admin logged in: ${email}`);

                return reply.send({
                    success: true,
                    data: {
                        accessToken,
                        refreshToken,
                        expiresIn: parseTimeToSeconds(config.accessExpiresIn),
                        admin: {
                            id: admin.id,
                            email: admin.email,
                            name: admin.name,
                            role: admin.role,
                            department: admin.department,
                            avatar: admin.avatar,
                        },
                    },
                });
            } catch (error) {
                logger.error('Platform admin login error:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'LOGIN_ERROR',
                        message: 'An error occurred during login',
                    },
                });
            }
        }
    );

    /**
     * POST /admin/auth/refresh
     * Refresh access token
     */
    fastify.post<{
        Body: { refreshToken: string };
    }>(
        '/refresh',
        {
            schema: {
                description: 'Refresh platform admin access token',
                tags: ['Admin Auth'],
                body: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { refreshToken } = request.body;

            if (!refreshToken) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'MISSING_TOKEN',
                        message: 'Refresh token is required',
                    },
                });
            }

            try {
                const config = getJwtConfig();

                // Verify token signature
                jwt.verify(refreshToken, config.refreshSecret, {
                    algorithms: ['HS256'],
                    issuer: config.issuer,
                    audience: config.audience,
                });

                // Check token exists in database
                const storedToken = await prisma.platformAdminRefreshToken.findUnique({
                    where: { token: refreshToken },
                    include: { admin: true },
                });

                if (!storedToken || storedToken.expiresAt < new Date()) {
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Refresh token is invalid or expired',
                        },
                    });
                }

                const admin = storedToken.admin;

                if (!admin.isActive) {
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'ACCOUNT_DISABLED',
                            message: 'Account is disabled',
                        },
                    });
                }

                // Generate new tokens (token rotation for security)
                const accessToken = generatePlatformAdminAccessToken(admin.id, admin.email, admin.role);

                // Delete old refresh token and create new one
                await prisma.platformAdminRefreshToken.delete({
                    where: { token: refreshToken },
                });
                const newRefreshToken = await createRefreshToken(admin.id, request.headers['user-agent'], request.ip);

                return reply.send({
                    success: true,
                    data: {
                        accessToken,
                        refreshToken: newRefreshToken,
                        expiresIn: parseTimeToSeconds(config.accessExpiresIn),
                    },
                });
            } catch {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Refresh token is invalid',
                    },
                });
            }
        }
    );

    /**
     * POST /admin/auth/logout
     * Logout and invalidate refresh token
     */
    fastify.post<{
        Body: { refreshToken?: string };
    }>(
        '/logout',
        {
            schema: {
                description: 'Platform admin logout',
                tags: ['Admin Auth'],
                body: {
                    type: 'object',
                    properties: {
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
        async (request, reply) => {
            const { refreshToken } = request.body;

            if (refreshToken) {
                try {
                    await prisma.platformAdminRefreshToken.delete({
                        where: { token: refreshToken },
                    });
                } catch {
                    // Token already deleted or invalid, ignore
                }
            }

            return reply.send({
                success: true,
                data: { message: 'Logged out successfully' },
            });
        }
    );

    /**
     * GET /admin/auth/me
     * Get current platform admin info
     */
    fastify.get(
        '/me',
        {
            schema: {
                description: 'Get current platform admin info',
                tags: ['Admin Auth'],
                security: [{ bearerAuth: [] }],
            },
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
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

                const decoded = jwt.verify(token, config.accessSecret, {
                    algorithms: ['HS256'],
                    issuer: config.issuer,
                    audience: config.audience,
                }) as PlatformAdminTokenPayload;

                if (decoded.type !== 'platform_admin') {
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN_TYPE',
                            message: 'Not a platform admin token',
                        },
                    });
                }

                const admin = await prisma.platformAdmin.findUnique({
                    where: { id: decoded.sub },
                });

                if (!admin || !admin.isActive) {
                    return reply.status(401).send({
                        success: false,
                        error: {
                            code: 'ADMIN_NOT_FOUND',
                            message: 'Admin account not found or disabled',
                        },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        admin: {
                            id: admin.id,
                            email: admin.email,
                            name: admin.name,
                            role: admin.role,
                            department: admin.department,
                            avatar: admin.avatar,
                        },
                    },
                });
            } catch {
                return reply.status(401).send({
                    success: false,
                    error: {
                        code: 'INVALID_TOKEN',
                        message: 'Invalid or expired token',
                    },
                });
            }
        }
    );
}
