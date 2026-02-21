'use client'

import { useEffect, useState } from 'react'
import { getClient } from '@/lib/supabase/client'
import { createBrowserClient } from '@/lib/supabase/client'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Generic hook for fetching data from Supabase
 */
export function useSupabaseQuery<T>(
  table: string,
  query?: (q: any) => any,
  dependencies?: any[]
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const supabase = createBrowserClient()
        let q = supabase.from(table).select()

        if (query) {
          q = query(q)
        }

        const { data, error } = await q
        if (error) throw error
        setData(data as T[])
      } catch (err) {
        // ✅ Convert plain Error into a PostgrestError-compatible object
        if (err instanceof Error) {
          setError({
            message: err.message,
            details: '',
            hint: '',
            code: 'CLIENT_ERROR',
          } as PostgrestError)
        } else {
          setError(err as PostgrestError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)
  }, [table, query, ...(dependencies ?? [])])

  return { data, loading, error }
}

/**
 * Hook for inserting data into Supabase
 */
export function useSupabaseInsert<T>(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null>(null)

  const insert = async (values: T) => {
    try {
      setLoading(true)
      const supabase = getClient()
      const { data, error } = await supabase.from(table).insert([values])
      if (error) throw error
      return data
    } catch (err) {
      const postgrestError = err as PostgrestError
      setError(postgrestError)
      throw postgrestError
    } finally {
      setLoading(false)
    }
  }

  return { insert, loading, error }
}

/**
 * Hook for updating data in Supabase
 */
export function useSupabaseUpdate<T>(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null>(null)

  const update = async (id: string, values: Partial<T>) => {
    try {
      setLoading(true)
      const supabase = getClient()
      const { data, error } = await supabase.from(table).update(values).eq('id', id)
      if (error) throw error
      return data
    } catch (err) {
      const postgrestError = err as PostgrestError
      setError(postgrestError)
      throw postgrestError
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}

/**
 * Hook for deleting data from Supabase
 */
export function useSupabaseDelete(table: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<PostgrestError | null>(null)

  const delete_ = async (id: string) => {
    try {
      setLoading(true)
      const supabase = getClient()
      const { data, error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return data
    } catch (err) {
      const postgrestError = err as PostgrestError
      setError(postgrestError)
      throw postgrestError
    } finally {
      setLoading(false)
    }
  }

  return { delete: delete_, loading, error }
}
}
}
