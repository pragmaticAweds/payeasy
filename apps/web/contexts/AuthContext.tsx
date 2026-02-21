/**
 * @file AuthContext.tsx
 * @description React context for managing authentication state across the app.
 * 
 * This context stores and provides access to:
 * - Current user information
 * - Authentication loading state
 * - Auth check status (isAuthenticated)
 * - User's Stellar public key
 * - Authentication methods (login, logout, register)
 * 
 * Usage:
 * ```tsx
 * import { useAuth } from '@/hooks/useAuth'
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth()
 *   // ...
 * }
 * ```
 */

'use client'

import { createContext } from 'react'
import type { User } from '@/lib/types'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/**
 * Request body for registration.
 * Requires public key and username at minimum.
 */
export interface RegisterData {
  public_key: string
  username: string
  email?: string
  avatar_url?: string
  bio?: string
}

/**
 * Data returned after successful login verification.
 * Contains the JWT token and user's public key.
 */
export interface LoginResponse {
  token: string
  publicKey: string
}

/**
 * Shape of the authentication context value.
 */
export interface AuthContextValue {
  /** Current authenticated user, or null if not logged in */
  user: User | null
  /** Whether auth state is being initialized or updated */
  isLoading: boolean
  /** Convenience flag: true when user is logged in */
  isAuthenticated: boolean
  /** Stellar public key of the current user, or null */
  publicKey: string | null
  
  /**
   * Initiate login flow with a Stellar public key.
   * This triggers the challenge-response authentication.
   * @param publicKey - Stellar public key (G...)
   * @returns Login response containing token and public key
   */
  login: (publicKey: string) => Promise<LoginResponse>
  
  /**
   * Log out the current user.
   * Clears local state and removes authentication cookies.
   */
  logout: () => Promise<void>
  
  /**
   * Register a new user with the provided data.
   * @param data - Registration data (public_key, username, optional fields)
   * @returns The newly created user object
   */
  register: (data: RegisterData) => Promise<User>
  
  /**
   * Refresh the current user's data from the server.
   * Useful after profile updates.
   */
  refreshUser: () => Promise<void>
}

// ──────────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────────

/**
 * Authentication context.
 * Provides user state and auth operations throughout the app.
 * 
 * ⚠️ Must be used within an AuthProvider.
 * Use the `useAuth()` hook to access this context.
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

AuthContext.displayName = 'AuthContext'
