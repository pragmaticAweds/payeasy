/**
 * @file useSupabase.ts
 * @description React hook for accessing Supabase client in components.
 *
 * Usage:
 * ```tsx
 * 'use client'
 *
 * import { useSupabase } from '@/hooks/useSupabase'
 *
 * export function MyComponent() {
 *   const supabase = useSupabase()
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase.from('listings').select()
 *       setListings(data)
 *     }
 *     fetchData()
 *   }, [supabase])
 *
 *   return <div>...</div>
 * }
 * ```
 */

'use client'

import { useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Hook to access the Supabase client in React components.
 * Returns a stable client instance across renders.
 *
 * @returns Typed Supabase client instance
 */
export function useSupabase(): SupabaseClient<Database> {
  const supabase = useMemo(() => getSupabaseClient(), [])
  return supabase
}
