import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ListingSearchParams, ListingSearchResult } from "@/lib/db/types";
import type { ListingRow, ListingAmenityRow } from "@/lib/types/database";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const params: ListingSearchParams & { bbox?: string } = {
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      location: searchParams.get("location") || undefined,
      radius: searchParams.get("radius") || undefined,
      bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
      bathrooms: searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined,
      amenities: searchParams.get("amenities")
        ? searchParams
          .get("amenities")!
          .split(",")
          .map((a) => a.trim())
        : undefined,
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as
          | "price"
          | "created_at"
          | "bedrooms"
          | "bathrooms"
          | "views"
          | "favorites"
          | "recommended") || "created_at",
      order: (searchParams.get("order") as "asc" | "desc") || "desc",
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
    };

    if (params.page! < 1) params.page = 1
    if (params.limit! < 1 || params.limit! > 100) params.limit = 20

    let query = supabase
      .from('listings')
      .select('*, listing_images(url, sort_order), users(username, avatar_url)', { count: 'exact' })
      .eq('status', 'active')
    if (params.minPrice !== undefined) {
      query = query.gte("rent_xlm", params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte("rent_xlm", params.maxPrice);
    }

    if (params.bedrooms !== undefined) {
      query = query.eq("bedrooms", params.bedrooms);
    }

    if (params.bathrooms !== undefined) {
      query = query.eq("bathrooms", params.bathrooms);
    }

    if (params.search) {
      const searchTerm = `%${params.search}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    if (params.location) {
      if (params.radius) {
        const radiusMatch = params.radius.match(/^(\d+(?:\.\d+)?)\s*(km|m)?$/i);
        if (radiusMatch) {
          let radiusMeters = parseFloat(radiusMatch[1]);
          if (radiusMatch[2]?.toLowerCase() === "km") {
            radiusMeters *= 1000;
          }

          if (params.location.includes(",")) {
            const coords = params.location.split(",").map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              query = query.ilike("address", `%${params.location}%`);
            } else {
              query = query.ilike("address", `%${params.location}%`);
            }
          } else {
            query = query.ilike("address", `%${params.location}%`);
          }
        } else {
          query = query.ilike("address", `%${params.location}%`);
        }
      } else {
        query = query.ilike("address", `%${params.location}%`);
      }
    }

    if (params.sortBy === "recommended") {
      // Recommended algorithm: Most favorites first, then most views
      query = query
        .order("favorite_count", { ascending: false })
        .order("view_count", { ascending: false })
        .order("created_at", { ascending: false });
    } else {
      let sortColumn: any = params.sortBy || "created_at";
      if (params.sortBy === "price") sortColumn = "rent_xlm";
      if (params.sortBy === "views") sortColumn = "view_count";
      if (params.sortBy === "favorites") sortColumn = "favorite_count";

      query = query.order(sortColumn, { ascending: params.order === "asc" });
    }

    const offset = (params.page! - 1) * params.limit!;
    query = query.range(offset, offset + params.limit! - 1);
    const { data: listings, error, count } = await query as any;

    if (error) {
      console.error("Database error:", error);
      // Mock data fallback
      console.warn("Using mock data due to DB error:", error.message);
      const mockListings = Array.from({ length: 25 }).map((_, i) => ({
        id: `mock-${i + 1}`,
        landlord_id: "mock-landlord",
        title: `Mock Listing ${i + 1}`,
        description: "This is a mock listing for testing purposes.",
        address: `123 Mock St, City ${i + 1}`,
        rent_xlm: 1000 + i * 50,
        bedrooms: (i % 3) + 1,
        bathrooms: (i % 2) + 1,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [`/images/airbnb${(i % 4) + 1}.${(i % 4) + 1 === 4 ? 'webp' : 'jpg'}`], // Rotate through available images
        landlord: {
          username: "Demo User",
          avatar_url: null,
        },
      }));

      // Pagination for mock data
      const startIndex = (params.page! - 1) * params.limit!;
      const endIndex = startIndex + params.limit!;
      const paginatedMock = mockListings.slice(startIndex, endIndex);

      return NextResponse.json({
        listings: paginatedMock,
        total: mockListings.length,
        page: params.page!,
        limit: params.limit!,
        totalPages: Math.ceil(mockListings.length / params.limit!),
      });
    }

    if (listings && listings.length === 0) {
      const mockListings = Array.from({ length: 25 }).map((_, i) => ({
        id: `mock-${i + 1}`,
        landlord_id: "mock-landlord",
        title: `Mock Listing ${i + 1}`,
        description: "This is a mock listing for testing purposes.",
        address: `123 Mock St, City ${i + 1}`,
        rent_xlm: 1000 + i * 50,
        bedrooms: (i % 3) + 1,
        bathrooms: (i % 2) + 1,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [`/images/airbnb${(i % 4) + 1}.${(i % 4) + 1 === 4 ? 'webp' : 'jpg'}`], // Rotate through available images
        landlord: {
          username: "Demo User",
          avatar_url: null,
        },
      }));

      // Pagination for mock data
      const startIndex = (params.page! - 1) * params.limit!;
      const endIndex = startIndex + params.limit!;
      const paginatedMock = mockListings.slice(startIndex, endIndex);

      return NextResponse.json({
        listings: paginatedMock,
        total: mockListings.length,
        page: params.page!,
        limit: params.limit!,
        totalPages: Math.ceil(mockListings.length / params.limit!),
      });
    }

    let filteredListings = (listings || []).map((listing: any) => ({
      ...listing,
      images: listing.listing_images
        ? listing.listing_images
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((img: any) => img.url)
        : [],
      landlord: listing.users
    }));
    let finalCount = count || 0;

    if (params.amenities && params.amenities.length > 0 && listings && listings.length > 0) {
      const listingIds = listings.map((l: any) => l.id);
      const { data: amenityData, error: amenityError } = await supabase
        .from("listing_amenities")
        .select("listing_id, amenity")
        .in("listing_id", listingIds)
        .in("amenity", params.amenities) as {
          data: Array<{ listing_id: string; amenity: string }> | null;
          error: any;
        };

      if (amenityError) {
        console.error("Amenity filter error:", amenityError);
      } else if (amenityData) {
        const listingAmenities = new Map<string, Set<string>>();
        amenityData.forEach((item) => {
          if (!listingAmenities.has(item.listing_id)) {
            listingAmenities.set(item.listing_id, new Set());
          }
          listingAmenities.get(item.listing_id)!.add(item.amenity);
        });

        filteredListings = filteredListings.filter((listing: any) => {
          const listingAmenitySet = listingAmenities.get(listing.id) || new Set();
          return params.amenities!.every((amenity) => listingAmenitySet.has(amenity));
        });

        finalCount = filteredListings.length;
      }
    }

    const totalPages = Math.ceil(finalCount / params.limit!);

    const result: ListingSearchResult = {
      listings: filteredListings,
      total: finalCount,
      page: params.page!,
      limit: params.limit!,
      totalPages,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
