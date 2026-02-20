
export interface Listing {
  id: string
  landlord_id: string
  title: string
  description: string
  address: string
  rent_xlm: number
  bedrooms: number
  bathrooms: number
  furnished?: boolean
  pet_friendly?: boolean
  latitude?: number
  longitude?: number
  status: 'active' | 'inactive' | 'deleted'
  created_at: string
  updated_at: string
}

export interface ListingAmenity {
  listing_id: string
  amenity: string
}

export interface ListingSearchParams {
  minPrice?: number
  maxPrice?: number
  location?: string
  radius?: string // e.g., "5km"
  bedrooms?: number
  bathrooms?: number
  amenities?: string[] // comma-separated or array
  search?: string // full-text search query
  bbox?: string // "west,south,east,north" bounding box for map view
  sortBy?: 'price' | 'created_at' | 'bedrooms' | 'bathrooms'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface ListingSearchResult {
  listings: Listing[]
  total: number
  page: number
  limit: number
  totalPages: number
}
