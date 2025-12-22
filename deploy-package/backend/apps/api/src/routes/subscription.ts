/**
 * Subscription routes for the License Portal
 * Handles organization and user creation from the official website
 */

import bcrypt from 'bcryptjs';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

// Validation schemas
const subscriptionSchema = z.object({
    organizationName: z.string().min(1, 'Organization name is required'),
    billingEmail: z.string().email('Invalid billing email'),
    adminEmail: z.string().email('Invalid admin email').optional(),
    plan: z.enum(['basic', 'pro', 'enterprise']),
    sameEmail: z.boolean().default(false),
});

const activateAccountSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Plan to tier mapping
const planToTier: Record<string, 'L1' | 'L2' | 'L3'> = {
    basic: 'L1',
    pro: 'L2',
    enterprise: 'L3',
};

// Plan seat limits
const planSeatLimits: Record<string, number> = {
    basic: 5,
    pro: 20,
    enterprise: 100,
};

// Generate a unique license key
function generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments: string[] = [];
    for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars[Math.floor(Math.random() * chars.length)];
        }
        segments.push(segment);
    }
    return segments.join('-');
}

// Generate a random setup token
function generateSetupToken(): string {
    return uuidv4() + '-' + Date.now().toString(36);
}

// Create a URL-safe slug from organization name
function createSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${suffix}`;
}

export async function subscriptionRoutes(fastify: FastifyInstance) {
    /**
     * POST /subscription/create
     * Create a new subscription (tenant, users, license) after payment
     */
    fastify.post<{
        Body: z.infer<typeof subscriptionSchema>;
    }>(
        '/create',
        {
            schema: {
                description: 'Create a new subscription after payment completion',
                tags: ['Subscription'],
                body: {
                    type: 'object',
                    required: ['organizationName', 'billingEmail', 'plan'],
                    properties: {
                        organizationName: { type: 'string' },
                        billingEmail: { type: 'string', format: 'email' },
                        adminEmail: { type: 'string', format: 'email' },
                        plan: { type: 'string', enum: ['basic', 'pro', 'enterprise'] },
                        sameEmail: { type: 'boolean' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: z.infer<typeof subscriptionSchema> }>, reply: FastifyReply) => {
            const validation = subscriptionSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { organizationName, billingEmail, adminEmail, plan, sameEmail } = validation.data;
            const tier = planToTier[plan];
            const maxUsers = planSeatLimits[plan];

            try {
                // Check if billing email is already used
                const existingUser = await prisma.user.findFirst({
                    where: { email: billingEmail },
                });

                if (existingUser) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'EMAIL_EXISTS',
                            message: 'An account with this email already exists',
                        },
                    });
                }

                // Create tenant, users, and license in a transaction
                const result = await prisma.$transaction(async (tx) => {
                    // 1. Create Tenant
                    const tenant = await tx.tenant.create({
                        data: {
                            name: organizationName,
                            slug: createSlug(organizationName),
                            tier,
                            status: 'ACTIVE',
                            settings: {
                                currency: 'MYR',
                                timezone: 'Asia/Kuala_Lumpur',
                            },
                        },
                    });

                    // 2. Create Billing Owner user
                    const billingOwnerToken = generateSetupToken();
                    const billingOwner = await tx.user.create({
                        data: {
                            tenantId: tenant.id,
                            email: billingEmail,
                            name: 'Billing Owner',
                            password: '', // Will be set during activation
                            role: sameEmail ? 'ADMIN' : 'MANAGER', // If same email, give admin role
                            isActive: false, // Needs activation
                        },
                    });

                    // Store the setup token (we'll use a simple approach - store in password field temporarily)
                    // In production, you'd want a separate ActivationToken table
                    await tx.user.update({
                        where: { id: billingOwner.id },
                        data: { password: `PENDING:${billingOwnerToken}` },
                    });

                    // 3. Create Admin user if different email
                    let admin = null;
                    let adminToken: string | null = null;

                    if (!sameEmail && adminEmail && adminEmail !== billingEmail) {
                        adminToken = generateSetupToken();
                        admin = await tx.user.create({
                            data: {
                                tenantId: tenant.id,
                                email: adminEmail,
                                name: 'System Administrator',
                                password: `PENDING:${adminToken}`,
                                role: 'ADMIN',
                                isActive: false,
                            },
                        });
                    }

                    // 4. Create License
                    const license = await tx.license.create({
                        data: {
                            tenantId: tenant.id,
                            tier,
                            licenseKey: generateLicenseKey(),
                            maxUsers,
                            startsAt: new Date(),
                            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                            isActive: true,
                            features: {
                                plan,
                                maxUsers,
                            },
                        },
                    });

                    // 5. Create default warehouse
                    await tx.warehouse.create({
                        data: {
                            tenantId: tenant.id,
                            code: 'WH-001',
                            name: 'Main Warehouse',
                            type: 'WAREHOUSE',
                            isDefault: true,
                            isActive: true,
                        },
                    });

                    return {
                        tenant,
                        billingOwner,
                        billingOwnerToken,
                        admin,
                        adminToken,
                        license,
                    };
                });

                logger.info(`New subscription created: ${organizationName} (${plan})`);

                return reply.send({
                    success: true,
                    data: {
                        organization: {
                            id: result.tenant.id,
                            name: result.tenant.name,
                            plan,
                            tier,
                        },
                        billingOwner: {
                            id: result.billingOwner.id,
                            email: result.billingOwner.email,
                            setupToken: result.billingOwnerToken,
                            setupUrl: `/setup-password/${result.billingOwnerToken}`,
                        },
                        admin: result.admin ? {
                            id: result.admin.id,
                            email: result.admin.email,
                            setupToken: result.adminToken,
                            setupUrl: `/setup-password/${result.adminToken}`,
                        } : null,
                        license: {
                            key: result.license.licenseKey,
                            expiresAt: result.license.expiresAt,
                            maxUsers: result.license.maxUsers,
                        },
                    },
                });
            } catch (error) {
                logger.error('Failed to create subscription:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'SUBSCRIPTION_ERROR',
                        message: 'Failed to create subscription. Please try again.',
                    },
                });
            }
        }
    );

    /**
     * POST /subscription/activate
     * Activate a user account by setting their password
     */
    fastify.post<{
        Body: z.infer<typeof activateAccountSchema>;
    }>(
        '/activate',
        {
            schema: {
                description: 'Activate user account and set password',
                tags: ['Subscription'],
                body: {
                    type: 'object',
                    required: ['token', 'password'],
                    properties: {
                        token: { type: 'string' },
                        password: { type: 'string', minLength: 8 },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Body: z.infer<typeof activateAccountSchema> }>, reply: FastifyReply) => {
            const validation = activateAccountSchema.safeParse(request.body);
            if (!validation.success) {
                return reply.status(400).send({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validation.error.errors[0].message,
                    },
                });
            }

            const { token, password } = validation.data;

            try {
                // Find user with this token
                const user = await prisma.user.findFirst({
                    where: {
                        password: `PENDING:${token}`,
                        isActive: false,
                    },
                    include: {
                        tenant: true,
                    },
                });

                if (!user) {
                    return reply.status(400).send({
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Invalid or expired activation token',
                        },
                    });
                }

                // Hash password and activate user
                const hashedPassword = await bcrypt.hash(password, 10);

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        password: hashedPassword,
                        isActive: true,
                    },
                });

                logger.info(`User activated: ${user.email}`);

                return reply.send({
                    success: true,
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            role: user.role,
                        },
                        organization: {
                            id: user.tenantId,
                            name: user.tenant.name,
                        },
                    },
                });
            } catch (error) {
                logger.error('Failed to activate account:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'ACTIVATION_ERROR',
                        message: 'Failed to activate account. Please try again.',
                    },
                });
            }
        }
    );

    /**
     * GET /subscription/verify-token/:token
     * Verify if an activation token is valid
     */
    fastify.get<{
        Params: { token: string };
    }>(
        '/verify-token/:token',
        {
            schema: {
                description: 'Verify activation token validity',
                tags: ['Subscription'],
                params: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) => {
            const { token } = request.params;

            try {
                const user = await prisma.user.findFirst({
                    where: {
                        password: `PENDING:${token}`,
                        isActive: false,
                    },
                    include: {
                        tenant: true,
                    },
                });

                if (!user) {
                    return reply.status(404).send({
                        success: false,
                        error: {
                            code: 'INVALID_TOKEN',
                            message: 'Invalid or expired activation token',
                        },
                    });
                }

                return reply.send({
                    success: true,
                    data: {
                        email: user.email,
                        role: user.role,
                        organizationName: user.tenant.name,
                    },
                });
            } catch (error) {
                logger.error('Failed to verify token:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'VERIFICATION_ERROR',
                        message: 'Failed to verify token',
                    },
                });
            }
        }
    );

    /**
     * GET /subscription/check-email/:email
     * Check if an email is already registered
     */
    fastify.get<{
        Params: { email: string };
    }>(
        '/check-email/:email',
        {
            schema: {
                description: 'Check if email is available for registration',
                tags: ['Subscription'],
                params: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string' },
                    },
                },
            },
        },
        async (request: FastifyRequest<{ Params: { email: string } }>, reply: FastifyReply) => {
            const { email } = request.params;

            try {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        email: {
                            equals: email,
                            mode: 'insensitive',
                        },
                    },
                });

                return reply.send({
                    success: true,
                    data: {
                        available: !existingUser,
                    },
                });
            } catch (error) {
                logger.error('Failed to check email:', error);
                return reply.status(500).send({
                    success: false,
                    error: {
                        code: 'CHECK_ERROR',
                        message: 'Failed to check email availability',
                    },
                });
            }
        }
    );
}
