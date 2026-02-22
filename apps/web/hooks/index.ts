/**
 * @file index.ts
 * @description Barrel export for all Supabase-related React hooks.
 *
 * Usage:
 * ```tsx
 * import { useSupabase, useAuth, useQuery, useMutation } from '@/hooks'
 * ```
 */

export { useSupabase } from './useSupabase'
export { useAuth, useIsAuthenticated, useRequireAuth } from './useAuth'
export { useQuery } from './useQuery'
export { useMutation } from './useMutation'
export { useWallet } from './useWallet'
export { useRealtimeDashboard } from './useRealtimeDashboard'
