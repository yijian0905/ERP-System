import { z } from 'zod';

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Validate a UUID string
 * Returns the validated UUID or null if invalid
 */
export function validateUuid(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(id: string): boolean {
  return uuidSchema.safeParse(id).success;
}

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * Search/filter schema
 */
export const searchSchema = z.object({
  search: z.string().max(200).optional(),
  filter: z.record(z.string()).optional(),
});

export type SearchParams = z.infer<typeof searchSchema>;

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

export type DateRangeParams = z.infer<typeof dateRangeSchema>;

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Phone number validation schema (basic)
 */
export const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

/**
 * Currency code validation (ISO 4217)
 */
export const currencyCodeSchema = z.string().length(3).toUpperCase();

/**
 * Positive decimal validation for prices/amounts
 */
export const moneySchema = z.number().positive('Amount must be positive');

/**
 * Quantity validation (integer >= 0)
 */
export const quantitySchema = z.number().int().nonnegative('Quantity must be non-negative');

/**
 * SKU validation
 */
export const skuSchema = z.string()
  .min(1, 'SKU is required')
  .max(50, 'SKU must be 50 characters or less')
  .regex(/^[A-Za-z0-9_-]+$/, 'SKU can only contain letters, numbers, underscores, and hyphens');

/**
 * Common validation error response generator
 */
export function createValidationError(errors: z.ZodError) {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: errors.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })),
  };
}
