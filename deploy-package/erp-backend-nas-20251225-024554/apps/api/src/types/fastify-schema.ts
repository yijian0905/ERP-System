/**
 * Fastify Schema Type Helpers
 * 
 * Provides type-safe schema definitions for Fastify routes that are compatible
 * with OpenAPI/Swagger documentation without using `any` types.
 */

import type { RouteShorthandOptions } from 'fastify';

/**
 * Extended route schema interface for OpenAPI/Swagger compatibility
 * This replaces the need for `as any` when defining route schemas
 */
export interface OpenAPIRouteOptions extends RouteShorthandOptions {
    schema?: {
        description?: string;
        summary?: string;
        tags?: string[];
        security?: Array<{ bearerAuth?: string[] } | Record<string, string[]>>;
        response?: Record<number, unknown>;
        body?: unknown;
        params?: unknown;
        querystring?: unknown;
        headers?: unknown;
        produces?: string[];
        consumes?: string[];
        deprecated?: boolean;
        hide?: boolean;
        externalDocs?: {
            url: string;
            description?: string;
        };
    };
}

/**
 * Helper function to create route options with proper typing
 * Use this instead of `{ schema: { ... } } as any`
 * 
 * @example
 * ```ts
 * fastify.get('/users', routeOptions({
 *   description: 'List all users',
 *   tags: ['Users'],
 *   security: [{ bearerAuth: [] }]
 * }), handler);
 * ```
 */
export function routeOptions(schema: OpenAPIRouteOptions['schema']): OpenAPIRouteOptions {
    return { schema };
}

/**
 * Create authenticated route options
 */
export function authRouteOptions(
    description: string,
    tags: string[]
): OpenAPIRouteOptions {
    return {
        schema: {
            description,
            tags,
            security: [{ bearerAuth: [] }],
        },
    };
}

/**
 * Create public (no auth) route options
 */
export function publicRouteOptions(
    description: string,
    tags: string[]
): OpenAPIRouteOptions {
    return {
        schema: {
            description,
            tags,
        },
    };
}
