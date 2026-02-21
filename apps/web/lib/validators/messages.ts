/**
 * @file messages.ts
 * @description Message validation using enhanced security validation
 * 
 * Updated to use centralized validation schemas for better security
 * with HTML sanitization and injection attack prevention.
 */

import { z } from 'zod';
import {
  messageContentSchema,
  uuidSchema,
  paginationSchema,
  validateInput,
} from '../validation/input';

const MIN_CONTENT_LENGTH = 1;
const MAX_CONTENT_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedSendMessage {
  recipientId: string;
  content: string;
}

export interface ValidatedPagination {
  page: number;
  pageSize: number;
  offset: number;
}

/**
 * Zod schema for message sending with enhanced security
 */
const sendMessageSchema = z.object({
  content: messageContentSchema,
  recipientId: uuidSchema,
});

/**
 * Validates the body of a POST /api/messages/send request.
 * Returns either a validated payload or an array of errors.
 * 
 * Now with enhanced security:
 * - HTML sanitization
 * - XSS prevention
 * - Length validation
 * - Format validation
 */
export function validateSendMessage(
  body: Record<string, unknown>,
  senderId: string
): { data?: ValidatedSendMessage; errors?: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate with enhanced schemas
  const validation = validateInput(sendMessageSchema, body);

  if (!validation.success) {
    // Convert Zod errors to ValidationError format
    Object.entries(validation.errors).forEach(([field, message]) => {
      errors.push({ field, message });
    });
    return { errors };
  }

  const { content, recipientId } = validation.data;

  // Additional business logic validation
  if (recipientId === senderId) {
    errors.push({
      field: "recipientId",
      message: "You cannot send a message to yourself.",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { data: { recipientId, content } };
}

/**
 * Validates and normalizes pagination query parameters.
 * 
 * Now with enhanced validation for security.
 */
export function validatePagination(params: { page?: string | null; pageSize?: string | null }): {
  data?: ValidatedPagination;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;

  if (isNaN(page) || page < 1) {
    errors.push({
      field: "page",
      message: "Page must be a positive integer.",
    });
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    errors.push({
      field: "pageSize",
      message: `Page size must be between 1 and ${MAX_PAGE_SIZE}.`,
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      page,
      pageSize,
      offset: (page - 1) * pageSize,
    },
  };
}
