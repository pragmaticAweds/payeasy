/**
 * @file middleware.ts
 * @description Middleware utilities for Supabase authentication in Next.js.
 *              Provides session refresh and protected route helpers.
 *
 * Usage (Next.js middleware.ts):
 * ```ts
 * import { createMiddlewareClient } from '@/lib/supabase/middleware'
 *
 * export async function middleware(req: NextRequest) {
 *   const { supabase, response } = createMiddlewareClient(req)
 *   await supabase.auth.getSession() // Refreshes session
 *   return response
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use in Next.js middleware.
 * Handles session refresh and cookie management.
 *
 * @param request - Next.js request object
 * @returns Object containing supabase client and response
 */
export function createMiddlewareClient(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Middleware helper to check if a route requires authentication.
 * Redirects to login if user is not authenticated.
 *
 * @param request - Next.js request object
 * @param protectedPaths - Array of path prefixes that require auth (e.g., ['/dashboard', '/api/protected'])
 * @returns NextResponse (redirect to login or continue)
 */
export async function requireAuth(
  request: NextRequest,
  protectedPaths: string[] = []
): Promise<NextResponse> {
  const { supabase, response } = createMiddlewareClient(request)

  // Check if current path matches any protected paths
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isProtectedPath) {
    return response
  }

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Store the intended destination for post-login redirect
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

/**
 * Middleware helper to redirect authenticated users away from auth pages.
 * Useful for login/signup pages that authenticated users shouldn't access.
 *
 * @param request - Next.js request object
 * @param authPaths - Array of auth page paths (e.g., ['/login', '/signup'])
 * @param redirectTo - Where to redirect authenticated users (default: '/')
 * @returns NextResponse (redirect or continue)
 */
export async function redirectIfAuthenticated(
  request: NextRequest,
  authPaths: string[] = ['/login', '/signup'],
  redirectTo: string = '/'
): Promise<NextResponse> {
  const { supabase, response } = createMiddlewareClient(request)

  // Check if current path is an auth page
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isAuthPath) {
    return response
  }

  // Check if user is already authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    // Check for redirectTo param first
    const redirectParam = request.nextUrl.searchParams.get('redirectTo')
    const destination = redirectParam || redirectTo
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return response
}
