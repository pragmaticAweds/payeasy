'use client'

import Image from 'next/image'
import { MapPin, Bed, Bath } from 'lucide-react'
import FavoriteButton from '../FavoriteButton'
import type { Listing, ListingWithLandlord } from '../../lib/db/types'
import Link from 'next/link'

interface ListingCardProps {
    listing: ListingWithLandlord | (Listing & { images?: string[]; landlord?: { username: string | null } })
}

export default function ListingCard({ listing }: ListingCardProps) {
    // Use the first image from the array or fallback
    const images = (listing as any).images || [];
    const imageUrl = images.length > 0 
        ? images[0] 
        : '/images/airbnb1.jpg' // Ensure this fallback exists in public/images

    return (
        <Link href={`/listings/${listing.id}`} className="block h-full group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                    <Image
                        src={imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.preventDefault()}>
                        <FavoriteButton listingId={listing.id} />
                    </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-full">
                            <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                {listing.title}
                            </h3>
                            <div className="flex items-center text-gray-500 text-sm gap-1">
                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="line-clamp-1">{listing.address}</span>
                            </div>
                            {listing.landlord?.username && (
                                <div className="text-xs text-gray-400 mt-1">
                                    Hosted by {listing.landlord.username}
                                </div>
                            )}
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
                        <div className="text-right flex-shrink-0">
                            <span className="text-lg font-bold text-primary">{listing.rent_xlm} XLM</span>
                            <span className="text-xs text-gray-400 ml-1">/ mo</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
