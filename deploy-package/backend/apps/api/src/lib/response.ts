/**
 * Response helpers for consistent API responses
 */

import type { FastifyReply } from 'fastify';

/**
 * Send a successful response with data
 */
export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200) {
    return reply.status(statusCode).send({
        success: true,
        data,
    });
}

/**
 * Send an error response
 */
export function sendError(
    reply: FastifyReply,
    code: string,
    message: string,
    statusCode = 400
) {
    return reply.status(statusCode).send({
        success: false,
        error: {
            code,
            message,
        },
    });
}

/**
 * Send a paginated response
 */
export function sendPaginated<T>(
    reply: FastifyReply,
    items: T[],
    total: number,
    page: number,
    pageSize: number
) {
    return reply.send({
        success: true,
        data: {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        },
    });
}
