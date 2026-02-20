import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/server'
import type { ListingSearchParams, ListingSearchResult } from '@/lib/db/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerClient()
    const searchParams = request.nextUrl.searchParams

    const params: ListingSearchParams = {
      minPrice: searchParams.get('minPrice')
        ? Number(searchParams.get('minPrice'))
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? Number(searchParams.get('maxPrice'))
        : undefined,
      location: searchParams.get('location') || undefined,
      radius: searchParams.get('radius') || undefined,
      bedrooms: searchParams.get('bedrooms')
        ? Number(searchParams.get('bedrooms'))
        : undefined,
      bathrooms: searchParams.get('bathrooms')
        ? Number(searchParams.get('bathrooms'))
        : undefined,
      amenities: searchParams.get('amenities')
        ? searchParams.get('amenities')!.split(',').map((a) => a.trim())
        : undefined,
      search: searchParams.get('search') || undefined,
      bbox: searchParams.get('bbox') || undefined,
      sortBy: (searchParams.get('sortBy') as 'price' | 'created_at' | 'bedrooms' | 'bathrooms') || 'created_at',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    }

    if (params.page! < 1) params.page = 1
    if (params.limit! < 1 || params.limit! > 100) params.limit = 20

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
    if (params.minPrice !== undefined) {
      query = query.gte('rent_xlm', params.minPrice)
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('rent_xlm', params.maxPrice)
    }

    if (params.bedrooms !== undefined) {
      query = query.eq('bedrooms', params.bedrooms)
    }

    if (params.bathrooms !== undefined) {
      query = query.eq('bathrooms', params.bathrooms)
    }

    if (params.search) {
      const searchTerm = `%${params.search}%`
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
    }

    if (params.location) {
      if (params.radius) {
        const radiusMatch = params.radius.match(/^(\d+(?:\.\d+)?)\s*(km|m)?$/i)
        if (radiusMatch) {
          let radiusMeters = parseFloat(radiusMatch[1])
          if (radiusMatch[2]?.toLowerCase() === 'km') {
            radiusMeters *= 1000
          }

          if (params.location.includes(',')) {
            const coords = params.location.split(',').map(Number)
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              query = query.ilike('address', `%${params.location}%`)
            } else {
              query = query.ilike('address', `%${params.location}%`)
            }
          } else {
            query = query.ilike('address', `%${params.location}%`)
          }
        } else {
          query = query.ilike('address', `%${params.location}%`)
        }
      } else {
        query = query.ilike('address', `%${params.location}%`)
      }
    }

    // Bounding box filtering for map view
    if (params.bbox) {
      const coords = params.bbox.split(',').map(Number)
      if (coords.length === 4 && coords.every((c) => !isNaN(c))) {
        const [west, south, east, north] = coords
        query = query
          .gte('longitude', west)
          .lte('longitude', east)
          .gte('latitude', south)
          .lte('latitude', north)
      }
    }

    const sortColumn = params.sortBy === 'price' ? 'rent_xlm' : (params.sortBy || 'created_at')
    query = query.order(sortColumn, { ascending: params.order === 'asc' })

    const offset = (params.page! - 1) * params.limit!
    query = query.range(offset, offset + params.limit! - 1)
    const { data: listings, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to search listings', details: error.message },
        { status: 500 }
      )
    }

    let filteredListings = listings || []
    let finalCount = count || 0

    if (params.amenities && params.amenities.length > 0 && listings && listings.length > 0) {
      const listingIds = listings.map((l) => l.id)
      const { data: amenityData, error: amenityError } = await supabase
        .from('listing_amenities')
        .select('listing_id, amenity')
        .in('listing_id', listingIds)
        .in('amenity', params.amenities)

      if (amenityError) {
        console.error('Amenity filter error:', amenityError)
      } else if (amenityData) {
        const listingAmenities = new Map<string, Set<string>>()
        amenityData.forEach((item) => {
          if (!listingAmenities.has(item.listing_id)) {
            listingAmenities.set(item.listing_id, new Set())
          }
          listingAmenities.get(item.listing_id)!.add(item.amenity)
        })

        filteredListings = filteredListings.filter((listing) => {
          const listingAmenitySet = listingAmenities.get(listing.id) || new Set()
          return params.amenities!.every((amenity) =>
            listingAmenitySet.has(amenity)
          )
        })

        finalCount = filteredListings.length
      }
    }

    const totalPages = Math.ceil(finalCount / params.limit!)

    const result: ListingSearchResult = {
      listings: filteredListings,
      total: finalCount,
      page: params.page!,
      limit: params.limit!,
      totalPages,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Search endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
