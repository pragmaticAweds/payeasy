'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Bed, Bath, Heart, Loader2 } from 'lucide-react'
import FavoriteButton from '../../components/FavoriteButton'
import { useFavoritesContext } from '../../components/FavoritesProvider'

type FavoriteListing = {
  listing_id: string
  listings: {
    id: string
    title: string
    address: string
    rent_xlm: number
    bedrooms: number
    bathrooms: number
    images: string[]
    is_available: boolean
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isFavorited, isAuthenticated, isLoading: authLoading } = useFavoritesContext()

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return

    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    async function fetchFavorites() {
      try {
        const res = await fetch('/api/users/me/favorites')
        if (res.status === 401) {
          window.location.href = '/login'
          return
        }
        if (!res.ok) {
          setError('Failed to load favorites')
          return
        }
        const json = await res.json()
        setFavorites(json.data ?? [])
      } catch {
        setError('Failed to load favorites')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavorites()
  }, [isAuthenticated, authLoading])

  // Filter out unfavorited listings (syncs with context after toggle)
  const visibleFavorites = favorites.filter((f) => isFavorited(f.listing_id))

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              My Favorites
            </h1>
          </div>
          <Link
            href="/browse"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse listings
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {visibleFavorites.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-full mb-4">
              <Heart size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No favorites yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Start browsing listings and tap the heart icon to save your favorites here.
            </p>
            <Link
              href="/browse"
              className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm shadow-primary/20"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleFavorites.map((fav) => {
              const listing = fav.listings
              const image = listing.images?.[0] || '/images/airbnb1.jpg'

              return (
                <div
                  key={fav.listing_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                    <Image
                      src={image}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <FavoriteButton listingId={fav.listing_id} />
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                        {listing.title}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {listing.address}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-600 text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" title={`${listing.bedrooms} Bedrooms`}>
                          <Bed size={16} />
                          <span>{listing.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title={`${listing.bathrooms} Bathrooms`}>
                          <Bath size={16} />
                          <span>{listing.bathrooms}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">{listing.rent_xlm} XLM</span>
                        <span className="text-xs text-gray-400 ml-1">/ mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
