/**
 * @file AuthProvider.tsx
 * @description Provider component that manages authentication state for the entire app.
 * 
 * Responsibilities:
 * - Initialize auth state from localStorage on mount
 * - Validate JWT token expiration
 * - Fetch current user data if valid token exists
 * - Provide login, logout, register, and refresh methods
 * - Persist auth state across page reloads
 * 
 * The provider should wrap the entire app in layout.tsx.
 */

'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { AuthContext, type RegisterData, type LoginResponse } from '@/contexts/AuthContext'
import type { User } from '@/lib/types'

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const AUTH_TOKEN_KEY = 'auth_token'
const USER_DATA_KEY = 'user_data'

// ──────────────────────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────────────────────

/**
 * Decode a JWT and extract the payload without verification.
 * Used client-side to check expiration. Server still validates the signature.
 */
function decodeJwt(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expired based on its `exp` claim.
 */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token)
  if (!payload?.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

/**
 * Get stored auth token from localStorage.
 */
function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

/**
 * Store auth token in localStorage.
 */
function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

/**
 * Remove auth token from localStorage.
 */
function clearStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_DATA_KEY)
}

/**
 * Get stored user data from localStorage.
 */
function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(USER_DATA_KEY)
  if (!data) return null
  
  try {
    return JSON.parse(data) as User
  } catch {
    return null
  }
}

/**
 * Store user data in localStorage.
 */
function setStoredUser(user: User): void {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
}

// ──────────────────────────────────────────────────────────────
// Provider Component
// ──────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  /**
   * Fetch the current user's profile from the API.
   * Called on mount if a valid token exists, or after login/register.
   */
  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/users/me')
      
      if (!response.ok) {
        // If 401, the token is invalid or expired
        if (response.status === 401) {
          clearStoredToken()
          return null
        }
        throw new Error('Failed to fetch user')
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }
      
      const userData = data.data as User
      setStoredUser(userData)
      return userData
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  }, [])

  /**
   * Initialize auth state on mount.
   * Checks localStorage for token and validates expiration.
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      
      const token = getStoredToken()
      
      // No token stored
      if (!token) {
        setIsLoading(false)
        return
      }
      
      // Token expired
      if (isTokenExpired(token)) {
        clearStoredToken()
        setIsLoading(false)
        return
      }

      // Try to use cached user data first
      const cachedUser = getStoredUser()
      if (cachedUser) {
        setUser(cachedUser)
        setPublicKey(cachedUser.public_key)
      }
      
      // Fetch fresh user data from server
      const userData = await fetchCurrentUser()
      
      if (userData) {
        setUser(userData)
        setPublicKey(userData.public_key)
      } else {
        // Failed to fetch user, clear everything
        setUser(null)
        setPublicKey(null)
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [fetchCurrentUser])

  /**
   * Refresh the current user's data from the server.
   */
  const refreshUser = useCallback(async () => {
    const userData = await fetchCurrentUser()
    if (userData) {
      setUser(userData)
      setPublicKey(userData.public_key)
    }
  }, [fetchCurrentUser])

  /**
   * Login with a Stellar public key.
   * This is a simplified version - in practice, you'd need to:
   * 1. Get a challenge from /api/auth/login
   * 2. Sign it with the user's wallet
   * 3. Verify the signature at /api/auth/verify
   * 
   * For now, this assumes the caller handles the challenge-response flow
   * and this method is called after verification with the token.
   */
  const login = useCallback(async (userPublicKey: string): Promise<LoginResponse> => {
    try {
      // Step 1: Get challenge
      const challengeResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey: userPublicKey }),
      })

      if (!challengeResponse.ok) {
        throw new Error('Failed to get login challenge')
      }

      const challengeData = await challengeResponse.json()
      
      if (challengeData.error) {
        throw new Error(challengeData.error.message)
      }

      const { nonce, timestamp, message } = challengeData.data

      // Step 2: Return the challenge info so the caller can sign it
      // In a real implementation, you'd integrate with a Stellar wallet here
      // For now, we return the challenge details and expect the caller to
      // complete the flow by calling verify separately
      
      return {
        token: '', // Will be filled after verification
        publicKey: userPublicKey,
        // Include challenge details for the caller to sign
        challenge: { nonce, timestamp, message }
      } as any // Type assertion for now
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [])

  /**
   * Complete login after signature verification.
   * This should be called after the user signs the challenge.
   */
  const verifyAndLogin = useCallback(async (
    userPublicKey: string,
    signature: string,
    nonce: string,
    timestamp: number
  ): Promise<void> => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: userPublicKey,
          signature,
          nonce,
          timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error('Signature verification failed')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message)
      }

      // The token is in an HTTP-only cookie, but we should still
      // fetch the user data
      const userData = await fetchCurrentUser()
      
      if (userData) {
        setUser(userData)
        setPublicKey(userData.public_key)
        // Store a flag that we're authenticated (since we can't access the HTTP-only cookie)
        setStoredToken('authenticated') // Placeholder since real token is in cookie
      }
    } catch (error) {
      console.error('Verification error:', error)
      throw error
    }
  }, [fetchCurrentUser])

  /**
   * Log out the current user.
   * Clears local state and removes auth token.
   */
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear HTTP-only cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API call result
      setUser(null)
      setPublicKey(null)
      clearStoredToken()
    }
  }, [])

  /**
   * Register a new user.
   * Creates a user account with the provided data.
   */
  const register = useCallback(async (data: RegisterData): Promise<User> => {
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      const newUser = result.data as User
      
      // After registration, automatically log in
      setUser(newUser)
      setPublicKey(newUser.public_key)
      setStoredUser(newUser)
      
      return newUser
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    publicKey,
    login,
    logout,
    register,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
