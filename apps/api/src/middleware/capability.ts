/**
 * Capability-based feature gating middleware
 * @see spec.md §3 Licensing & Capability Model
 *
 * UI and API access MUST be gated by capabilities[code], never by tier.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CapabilityCode, Capability } from '@erp/shared-types';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

/**
 * Check if a capability is enabled in a capability set
 */
function hasCapability(capabilities: Capability[], code: CapabilityCode): boolean {
    const cap = capabilities.find((c) => c.code === code);
    return cap?.enabled ?? false;
}

/**
 * Get capabilities for a tenant from their active license
 */
async function getTenantCapabilities(tenantId: string): Promise<Capability[]> {
    const license = await prisma.license.findFirst({
        where: {
            tenantId,
            isActive: true,
            expiresAt: { gt: new Date() },
        },
        select: {
            tier: true,
        },
    });

    if (!license) {
        return [];
    }

    // Map tier to capabilities (legacy tier-based mapping)
    // TODO: Once capabilities are stored in database, fetch them directly
    const tierCapabilities: Record<string, Capability[]> = {
        L1: [
            { code: 'erp_core', enabled: true },
            { code: 'forecasting', enabled: false },
            { code: 'ai_chat', enabled: false },
            { code: 'ai_agent', enabled: false },
            { code: 'automation_rules', enabled: false },
        ],
        L2: [
            { code: 'erp_core', enabled: true },
            { code: 'forecasting', enabled: true },
            { code: 'ai_chat', enabled: false },
            { code: 'ai_agent', enabled: false },
            { code: 'automation_rules', enabled: false },
        ],
        L3: [
            { code: 'erp_core', enabled: true },
            { code: 'forecasting', enabled: true },
            { code: 'ai_chat', enabled: true },
            { code: 'ai_agent', enabled: false }, // default false as per spec
            { code: 'automation_rules', enabled: false }, // future
        ],
    };

    return tierCapabilities[license.tier] || tierCapabilities.L1;
}

/**
 * Middleware factory that requires a specific capability
 *
 * Usage:
 * ```typescript
 * fastify.get('/forecasting', {
 *   preHandler: requireCapability('forecasting'),
 * }, handler);
 * ```
 */
export function requireCapability(code: CapabilityCode) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user;

        if (!user?.tid) {
            return reply.status(401).send({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required',
                },
            });
        }

        const capabilities = await getTenantCapabilities(user.tid);

        if (!hasCapability(capabilities, code)) {
            logger.warn(`Capability denied: ${code} for tenant ${user.tid}`);
            return reply.status(403).send({
                success: false,
                error: {
                    code: 'CAPABILITY_REQUIRED',
                    message: `This feature requires the "${code}" capability`,
                    requiredCapability: code,
                },
            });
        }

        // Attach capabilities to request for handler use
        request.capabilities = capabilities;
    };
}

/**
 * Middleware that loads capabilities without enforcing
 * Useful for endpoints that need to check capabilities conditionally
 */
export async function loadCapabilities(request: FastifyRequest, _reply: FastifyReply) {
    const user = request.user;

    if (user?.tid) {
        request.capabilities = await getTenantCapabilities(user.tid);
    } else {
        request.capabilities = [];
    }
}

// Augment FastifyRequest with capabilities
declare module 'fastify' {
    interface FastifyRequest {
        capabilities?: Capability[];
    }
}

export { getTenantCapabilities, hasCapability };
