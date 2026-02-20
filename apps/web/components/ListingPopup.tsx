'use client'

import Image from 'next/image'
import { MapPin, Bed, Bath } from 'lucide-react'
import FavoriteButton from './FavoriteButton'

export interface ListingPopupData {
    id: number | string
    title: string
    price: number
    location: string
    bedrooms: number
    bathrooms: number
    image: string
}

interface ListingPopupProps {
    listing: ListingPopupData
    onClose: () => void
}

export default function ListingPopup({ listing, onClose }: ListingPopupProps) {
    return (
        <div className="w-[280px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="relative h-36 w-full bg-gray-100">
                <Image
                    src={listing.image}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="280px"
                />
                <div className="absolute top-2 left-2 z-10">
                    <FavoriteButton listingId={String(listing.id)} size={18} />
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-xs font-bold shadow-sm"
                    aria-label="Close popup"
                >
                    &times;
                </button>
            </div>
            <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">
                    {listing.title}
                </h3>
                <div className="flex items-center text-gray-500 text-xs gap-1 mb-2">
                    <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{listing.location}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                        <div className="flex items-center gap-1" title={`${listing.bedrooms} Bedrooms`}>
                            <Bed size={14} />
                            <span>{listing.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1" title={`${listing.bathrooms} Bathrooms`}>
                            <Bath size={14} />
                            <span>{listing.bathrooms}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-primary">{listing.price} XLM</span>
                        <span className="text-[10px] text-gray-400 ml-0.5">/ mo</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
