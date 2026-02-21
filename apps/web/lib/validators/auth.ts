/**
 * @file auth.ts
 * @description Authentication validation schemas using centralized validation
 * 
 * This file uses the shared validation schemas from lib/validation/input.ts
 * to ensure consistent validation and security across the application.
 */

import { z } from 'zod';
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  optionalStellarPublicKeySchema,
} from '../validation/input';

/**
 * Login form validation schema
 * Uses enhanced validation with HTML sanitization and stronger password requirements
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Registration form validation schema
 * Uses enhanced validation with stronger security requirements
 */
export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  walletAddress: optionalStellarPublicKeySchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
