/**
 * @file input.ts
 * @description Comprehensive input validation and sanitization utilities
 * 
 * This module provides centralized validation schemas and sanitization functions
 * to prevent injection attacks and ensure data integrity across the application.
 * 
 * Security Features:
 * - Zod schema validation for type safety
 * - HTML sanitization to prevent XSS attacks
 * - SQL injection prevention through parameterized queries
 * - Length limits enforcement
 * - Format validation (email, URL, Stellar addresses, etc.)
 * - Safe error messages that don't leak sensitive information
 * 
 * @see https://github.com/cure53/DOMPurify
 * @see https://github.com/apostrophecms/sanitize-html
 */

import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// ──────────────────────────────────────────────────────────────
// Constants and Configuration
// ──────────────────────────────────────────────────────────────

/** Maximum lengths for various input types */
export const INPUT_LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  EMAIL_MAX: 254, // RFC 5321
  NAME_MIN: 1,
  NAME_MAX: 100,
  TITLE_MIN: 3,
  TITLE_MAX: 200,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 5000,
  MESSAGE_MIN: 1,
  MESSAGE_MAX: 5000,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 500,
  PHONE_MIN: 10,
  PHONE_MAX: 20,
  URL_MAX: 2048,
  SEARCH_QUERY_MAX: 200,
  STELLAR_ADDRESS_LENGTH: 56,
} as const;

/** Allowed HTML tags for rich text content (very restrictive) */
const ALLOWED_HTML_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a',
];

/** Allowed HTML attributes */
const ALLOWED_HTML_ATTRIBUTES = {
  'a': ['href', 'title', 'target', 'rel'],
};

/** HTML sanitization configuration */
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_HTML_TAGS,
  allowedAttributes: ALLOWED_HTML_ATTRIBUTES,
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    'a': ['http', 'https', 'mailto'],
  },
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
};

/** Stricter configuration for plain text (removes all HTML) */
const SANITIZE_PLAIN_TEXT_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

// ──────────────────────────────────────────────────────────────
// Regex Patterns for Format Validation
// ──────────────────────────────────────────────────────────────

/** Username: alphanumeric, underscore, hyphen only */
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

/** Stellar public key pattern (starts with G, 56 chars) */
const STELLAR_PUBLIC_KEY_PATTERN = /^G[A-Z2-7]{55}$/;

/** Strong password: min 8 chars, uppercase, lowercase, number, special char */
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

/** Phone number: digits, spaces, hyphens, parentheses, plus sign */
const PHONE_PATTERN = /^[\d\s\-\(\)\+]+$/;

/** Slug pattern: lowercase, numbers, hyphens */
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Safe filename pattern: alphanumeric, underscore, hyphen, dot */
const FILENAME_PATTERN = /^[a-zA-Z0-9_\-\.]+$/;

/** UUID v4 pattern */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ──────────────────────────────────────────────────────────────
// Sanitization Functions
// ──────────────────────────────────────────────────────────────

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe HTML tags and attributes based on configuration.
 * 
 * @param input - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(input: string): string {
  return sanitizeHtml(input.trim(), SANITIZE_CONFIG);
}

/**
 * Strip all HTML tags and return plain text.
 * Use this for fields that should never contain HTML.
 * 
 * @param input - The string to sanitize
 * @returns Plain text without any HTML
 */
export function sanitizePlainText(input: string): string {
  return sanitizeHtml(input.trim(), SANITIZE_PLAIN_TEXT_CONFIG);
}

/**
 * Sanitize and normalize a search query.
 * Removes special characters that could be used in SQL injection.
 * 
 * @param query - The search query to sanitize
 * @returns Sanitized query string
 */
export function sanitizeSearchQuery(query: string): string {
  // Strip all HTML
  const plainText = sanitizePlainText(query);
  
  // Remove SQL special characters (queries should use parameterized queries anyway)
  // This is defense in depth
  const sanitized = plainText
    .replace(/[';\-]+/g, '') // Remove SQL comment markers, semicolons, and hyphens
    .replace(/\\/g, '') // Remove backslashes
    .trim();
  
  return sanitized;
}

/**
 * Escape special characters for safe inclusion in error messages.
 * Prevents error message injection attacks.
 * 
 * @param message - The message to escape
 * @returns Escaped message safe for display
 */
export function escapeErrorMessage(message: string): string {
  return message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ──────────────────────────────────────────────────────────────
// Base Validation Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Email validation schema with comprehensive checks
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(INPUT_LIMITS.EMAIL_MAX, `Email must not exceed ${INPUT_LIMITS.EMAIL_MAX} characters`)
  .email('Invalid email address format')
  .toLowerCase()
  .transform(sanitizePlainText);

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.USERNAME_MIN, `Username must be at least ${INPUT_LIMITS.USERNAME_MIN} characters`)
  .max(INPUT_LIMITS.USERNAME_MAX, `Username must not exceed ${INPUT_LIMITS.USERNAME_MAX} characters`)
  .regex(USERNAME_PATTERN, 'Username can only contain letters, numbers, underscores, and hyphens')
  .transform(sanitizePlainText);

/**
 * Password validation schema with strong password requirements
 */
export const passwordSchema = z
  .string()
  .min(INPUT_LIMITS.PASSWORD_MIN, `Password must be at least ${INPUT_LIMITS.PASSWORD_MIN} characters`)
  .max(INPUT_LIMITS.PASSWORD_MAX, `Password must not exceed ${INPUT_LIMITS.PASSWORD_MAX} characters`)
  .regex(STRONG_PASSWORD_PATTERN, 'Password must contain uppercase, lowercase, number, and special character');

/**
 * Optional password schema (for updates where password change is optional)
 */
export const optionalPasswordSchema = passwordSchema.optional().or(z.literal(''));

/**
 * Name validation schema (first name, last name, etc.)
 */
export const nameSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.NAME_MIN, `Name must be at least ${INPUT_LIMITS.NAME_MIN} character`)
  .max(INPUT_LIMITS.NAME_MAX, `Name must not exceed ${INPUT_LIMITS.NAME_MAX} characters`)
  .transform(sanitizePlainText);

/**
 * Stellar public key validation schema
 */
export const stellarPublicKeySchema = z
  .string()
  .trim()
  .length(INPUT_LIMITS.STELLAR_ADDRESS_LENGTH, `Stellar address must be exactly ${INPUT_LIMITS.STELLAR_ADDRESS_LENGTH} characters`)
  .regex(STELLAR_PUBLIC_KEY_PATTERN, 'Invalid Stellar public key format')
  .transform(sanitizePlainText);

/**
 * Optional Stellar public key schema
 */
export const optionalStellarPublicKeySchema = stellarPublicKeySchema.optional().or(z.literal(''));

/**
 * URL validation schema with length limit
 */
export const urlSchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.URL_MAX, `URL must not exceed ${INPUT_LIMITS.URL_MAX} characters`)
  .url('Invalid URL format')
  .transform(sanitizePlainText);

/**
 * Optional URL schema
 */
export const optionalUrlSchema = urlSchema.optional().or(z.literal(''));

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.PHONE_MIN, `Phone number must be at least ${INPUT_LIMITS.PHONE_MIN} digits`)
  .max(INPUT_LIMITS.PHONE_MAX, `Phone number must not exceed ${INPUT_LIMITS.PHONE_MAX} characters`)
  .regex(PHONE_PATTERN, 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign')
  .transform(sanitizePlainText);

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .trim()
  .regex(UUID_PATTERN, 'Invalid UUID format')
  .transform(sanitizePlainText);

/**
 * Slug validation schema (URL-friendly identifiers)
 */
export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(100, 'Slug must not exceed 100 characters')
  .regex(SLUG_PATTERN, 'Slug can only contain lowercase letters, numbers, and hyphens')
  .transform(sanitizePlainText);

/**
 * Filename validation schema
 */
export const filenameSchema = z
  .string()
  .trim()
  .min(1, 'Filename is required')
  .max(255, 'Filename must not exceed 255 characters')
  .regex(FILENAME_PATTERN, 'Filename contains invalid characters')
  .transform(sanitizePlainText);

// ──────────────────────────────────────────────────────────────
// Content Validation Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Title validation schema (for listings, posts, etc.)
 */
export const titleSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.TITLE_MIN, `Title must be at least ${INPUT_LIMITS.TITLE_MIN} characters`)
  .max(INPUT_LIMITS.TITLE_MAX, `Title must not exceed ${INPUT_LIMITS.TITLE_MAX} characters`)
  .transform(sanitizePlainText);

/**
 * Description validation schema (allows some HTML)
 */
export const descriptionSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.DESCRIPTION_MIN, `Description must be at least ${INPUT_LIMITS.DESCRIPTION_MIN} characters`)
  .max(INPUT_LIMITS.DESCRIPTION_MAX, `Description must not exceed ${INPUT_LIMITS.DESCRIPTION_MAX} characters`)
  .transform(sanitizeHTML);

/**
 * Plain text description (no HTML allowed)
 */
export const plainDescriptionSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.DESCRIPTION_MIN, `Description must be at least ${INPUT_LIMITS.DESCRIPTION_MIN} characters`)
  .max(INPUT_LIMITS.DESCRIPTION_MAX, `Description must not exceed ${INPUT_LIMITS.DESCRIPTION_MAX} characters`)
  .transform(sanitizePlainText);

/**
 * Message content validation schema
 */
export const messageContentSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.MESSAGE_MIN, `Message must be at least ${INPUT_LIMITS.MESSAGE_MIN} character`)
  .max(INPUT_LIMITS.MESSAGE_MAX, `Message must not exceed ${INPUT_LIMITS.MESSAGE_MAX} characters`)
  .transform(sanitizePlainText);

/**
 * Address validation schema
 */
export const addressSchema = z
  .string()
  .trim()
  .min(INPUT_LIMITS.ADDRESS_MIN, `Address must be at least ${INPUT_LIMITS.ADDRESS_MIN} characters`)
  .max(INPUT_LIMITS.ADDRESS_MAX, `Address must not exceed ${INPUT_LIMITS.ADDRESS_MAX} characters`)
  .transform(sanitizePlainText);

/**
 * Search query validation schema
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .max(INPUT_LIMITS.SEARCH_QUERY_MAX, `Search query must not exceed ${INPUT_LIMITS.SEARCH_QUERY_MAX} characters`)
  .transform(sanitizeSearchQuery);

// ──────────────────────────────────────────────────────────────
// Numeric Validation Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Positive integer schema
 */
export const positiveIntSchema = z.number().int().positive('Must be a positive number');

/**
 * Non-negative integer schema (allows 0)
 */
export const nonNegativeIntSchema = z.number().int().min(0, 'Must be 0 or greater');

/**
 * Price validation schema (in cents/smallest unit)
 */
export const priceSchema = z
  .number()
  .int('Price must be a whole number')
  .min(0, 'Price cannot be negative')
  .max(999999999, 'Price is too large'); // Max ~$10M in cents

/**
 * Percentage validation schema (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be at least 0')
  .max(100, 'Percentage must not exceed 100');

/**
 * Latitude validation schema
 */
export const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

/**
 * Longitude validation schema
 */
export const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

/**
 * Page number validation schema (for pagination)
 */
export const pageNumberSchema = z
  .number()
  .int('Page must be a whole number')
  .min(1, 'Page must be at least 1')
  .default(1);

/**
 * Page size validation schema (for pagination)
 */
export const pageSizeSchema = z
  .number()
  .int('Page size must be a whole number')
  .min(1, 'Page size must be at least 1')
  .max(100, 'Page size must not exceed 100')
  .default(20);

// ──────────────────────────────────────────────────────────────
// Date/Time Validation Schemas
// ──────────────────────────────────────────────────────────────

/**
 * ISO timestamp string validation
 */
export const isoTimestampSchema = z
  .string()
  .trim()
  .datetime({ message: 'Invalid ISO timestamp format' })
  .transform(sanitizePlainText);

/**
 * Date string validation (YYYY-MM-DD)
 */
export const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .transform(sanitizePlainText);

/**
 * Future date validation
 */
export const futureDateSchema = z
  .date()
  .refine((date) => date > new Date(), {
    message: 'Date must be in the future',
  });

// ──────────────────────────────────────────────────────────────
// Complex Validation Schemas
// ──────────────────────────────────────────────────────────────

/**
 * Pagination parameters validation
 */
export const paginationSchema = z.object({
  page: pageNumberSchema,
  pageSize: pageSizeSchema,
});

/**
 * Coordinate (lat/lng) validation
 */
export const coordinateSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
});

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    startDate: z.date(),
    endDate: z.date(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  });

// ──────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────

/**
 * Validate data against a Zod schema and return safe error messages.
 * 
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Object with validated data or formatted errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format Zod errors into a user-friendly structure
  const errors: Record<string, string> = {};
  result.error.issues.forEach((err) => {
    const path = err.path.join('.');
    // Escape error messages to prevent injection
    errors[path] = escapeErrorMessage(err.message);
  });

  return { success: false, errors };
}

/**
 * Check if a string contains potentially malicious patterns.
 * This is a defense-in-depth measure alongside proper parameterized queries.
 * 
 * @param input - The string to check
 * @returns True if suspicious patterns are detected
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,                    // Script tags
    /javascript:/i,                // Javascript protocol
    /on\w+\s*=/i,                 // Event handlers (onclick, onerror, etc.)
    /eval\(/i,                    // eval() calls
    /expression\(/i,              // CSS expressions
    /import\s+/i,                 // Import statements
    /\bexec\b/i,                  // exec commands
    /union\s+select/i,            // SQL UNION attacks
    /;\s*drop\s+table/i,          // SQL DROP attacks
    /insert\s+into/i,             // SQL INSERT attacks
    /delete\s+from/i,             // SQL DELETE attacks
    /update\s+\w+\s+set/i,        // SQL UPDATE attacks
    /../i,                        // Path traversal
    /\\/i,                        // Backslashes (common in injection)
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize a file upload name.
 * 
 * @param filename - The original filename
 * @returns Sanitized filename or null if invalid
 */
export function validateFilename(filename: string): string | null {
  try {
    // Validate with schema
    const result = filenameSchema.safeParse(filename);
    if (!result.success) {
      return null;
    }

    // Additional checks
    const sanitized = result.data;
    
    // Prevent path traversal
    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      return null;
    }

    // Prevent hidden files
    if (sanitized.startsWith('.')) {
      return null;
    }

    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Create a safe error response object that doesn't leak sensitive info.
 * 
 * @param message - The user-facing error message
 * @param field - Optional field name that caused the error
 * @returns Safe error response object
 */
export function createSafeError(message: string, field?: string) {
  return {
    error: escapeErrorMessage(message),
    field: field ? escapeErrorMessage(field) : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Batch validate multiple fields at once.
 * 
 * @param validations - Array of validation functions to run
 * @returns Combined validation results
 */
export async function batchValidate(
  validations: Array<() => Promise<{ success: boolean; errors?: Record<string, string> }>>
): Promise<{ success: boolean; errors: Record<string, string> }> {
  const results = await Promise.all(validations.map((fn) => fn()));
  
  const allErrors: Record<string, string> = {};
  let allSuccess = true;

  results.forEach((result) => {
    if (!result.success && result.errors) {
      allSuccess = false;
      Object.assign(allErrors, result.errors);
    }
  });

  return {
    success: allSuccess,
    errors: allErrors,
  };
}

// ──────────────────────────────────────────────────────────────
// Type Exports
// ──────────────────────────────────────────────────────────────

export type EmailInput = z.infer<typeof emailSchema>;
export type UsernameInput = z.infer<typeof usernameSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
export type NameInput = z.infer<typeof nameSchema>;
export type StellarPublicKeyInput = z.infer<typeof stellarPublicKeySchema>;
export type UrlInput = z.infer<typeof urlSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type UuidInput = z.infer<typeof uuidSchema>;
export type TitleInput = z.infer<typeof titleSchema>;
export type DescriptionInput = z.infer<typeof descriptionSchema>;
export type MessageContentInput = z.infer<typeof messageContentSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CoordinateInput = z.infer<typeof coordinateSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
