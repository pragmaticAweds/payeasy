export interface Listing {
  id: string;
  landlord_id: string;
  title: string;
  description: string;
  address: string;
  rent_xlm: number;
  bedrooms: number;
  bathrooms: number;
  furnished?: boolean;
  pet_friendly?: boolean;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive" | "deleted";
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
}

export type {
  // Database models
  Listing,
  ListingRow,
  ListingInsert,
  ListingUpdate,
  ListingAmenity,
  ListingAmenityRow,
  ListingAmenityInsert,
  ListingWithLandlord,
  ListingWithAmenities,
  ListingDetail,
  ListingStatus,
} from '@/lib/types/database'

export interface ListingSearchParams {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  radius?: string; // e.g., "5km"
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[]; // comma-separated or array
  search?: string; // full-text search query
  sortBy?:
    | "price"
    | "created_at"
    | "bedrooms"
    | "bathrooms"
    | "views"
    | "favorites"
    | "recommended";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ListingSearchResult {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
