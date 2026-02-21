'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/superbase/client'

type FavoritesContextValue = {
  isFavorited: (listingId: string) => boolean
  toggleFavorite: (listingId: string) => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider')
  }
  return ctx
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const togglingRef = useRef<Set<string>>(new Set())
  const router = useRouter()

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }

        setIsAuthenticated(true)

        const res = await fetch('/api/users/me/favorites')
        if (res.ok) {
          const json = await res.json()
          const ids = (json.data ?? []).map((f: { listing_id: string }) => f.listing_id)
          setFavoriteIds(new Set(ids))
        }
      } catch {
        // Silently fail — user may not be logged in
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const isFavorited = useCallback(
    (listingId: string) => favoriteIds.has(listingId),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!isAuthenticated) {
        router.push('/login')
        window.location.href = '/auth/login'
        return
      }

      // Prevent double-toggling the same listing
      if (togglingRef.current.has(listingId)) return
      togglingRef.current.add(listingId)

      const wasFavorited = favoriteIds.has(listingId)

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (wasFavorited) {
          next.delete(listingId)
        } else {
          next.add(listingId)
        }
        return next
      })

      try {
        const res = await fetch(`/api/listings/${listingId}/favorite`, {
          method: wasFavorited ? 'DELETE' : 'POST',
        })

        if (!res.ok) {
          // Rollback on failure
          setFavoriteIds((prev) => {
            const next = new Set(prev)
            if (wasFavorited) {
              next.add(listingId)
            } else {
              next.delete(listingId)
            }
            return next
          })
        }
      } catch {
        // Rollback on network error
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (wasFavorited) {
            next.add(listingId)
          } else {
            next.delete(listingId)
          }
          return next
        })
      } finally {
        togglingRef.current.delete(listingId)
      }
    },
    [isAuthenticated, favoriteIds]
  )

  return (
    <FavoritesContext.Provider value={{ isFavorited, toggleFavorite, isAuthenticated, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  )
}
