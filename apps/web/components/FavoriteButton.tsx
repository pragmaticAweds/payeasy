'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { useFavoritesContext } from './FavoritesProvider'

interface FavoriteButtonProps {
  listingId: string
  size?: number
  className?: string
}

export default function FavoriteButton({ listingId, size = 22, className = '' }: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite, isLoading } = useFavoritesContext()
  const favorited = isFavorited(listingId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(listingId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={`p-1.5 rounded-full transition-colors ${className}`}
    >
      <Heart
        size={size}
        className={
          favorited
            ? 'fill-red-500 text-red-500 transition-colors'
            : 'fill-transparent text-white drop-shadow-md transition-colors'
        }
      />
    </button>
  )
}
