/**
 * @file useAuth.ts
 * @description React hook for accessing authentication context throughout the app.
 *
 * Usage:
 * ```tsx
 * 'use client'
 *
 * import { useAuth } from '@/hooks/useAuth'
 *
 * export function ProfilePage() {
 *   const { user, isLoading, isAuthenticated, logout } = useAuth()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (!isAuthenticated) return <div>Please log in</div>
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.username}</h1>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   )
 * }
 * ```
 */

'use client'

import { useContext, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext } from '@/contexts/AuthContext'

/**
 * Hook for accessing authentication state and operations.
 * Must be used within an AuthProvider.
 *
 * @returns Authentication context value
 * @throws Error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook to check if user is authenticated.
 * Simpler alternative to useAuth when you only need to check auth status.
 *
 * @returns Object with isAuthenticated boolean and loading state
 */
export function useIsAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth()
  return {
    isAuthenticated,
    loading: isLoading,
  }
}

/**
 * Hook to require authentication and redirect if not logged in.
 * Useful for protecting client-side pages.
 *
 * @param redirectTo - Where to redirect unauthenticated users (default: '/auth/login')
 * @returns User object and loading state
 */
export function useRequireAuth(redirectTo: string = '/auth/login') {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { user, loading: isLoading }
}

