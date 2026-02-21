/**
 * @file FavoriteButton.tsx
 * @description Touch-optimized favorite button with WCAG AAA compliant touch targets
 */

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
      aria-pressed={favorited}
      className={`
        flex items-center justify-center
        min-w-[44px] min-h-[44px]
        p-2.5 rounded-full 
        bg-white/90 backdrop-blur-sm 
        shadow-sm hover:shadow-md
        transition-all
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <Heart
        size={size}
        className={
          favorited
            ? 'fill-red-500 text-red-500 transition-colors'
            : 'fill-transparent text-gray-700 transition-colors'
        }
      />
    </button>
  )
}
