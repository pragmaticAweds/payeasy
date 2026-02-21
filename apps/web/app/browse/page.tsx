"use client";

import React, { useState, useEffect } from "react";
import FilterSidebar from "../../components/FilterSidebar";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { MapPin, Bed, Bath, UserCircle } from "lucide-react";

// Types for Mock Data
type Property = {
  id: number;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  image: string;
  type: string;
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Modern Loft in Downtown",
    price: 3200,
    location: "Miami, FL",
    bedrooms: 2,
    bathrooms: 2,
    image: "/images/airbnb1.jpg",
    type: "Entire Place",
  },
  {
    id: 2,
    title: "Cozy Studio near Beach",
    price: 1800,
    location: "Miami Beach, FL",
    bedrooms: 1,
    bathrooms: 1,
    image: "/images/airbnb2.jpg",
    type: "Private Room",
  },
  {
    id: 3,
    title: "Luxury Penthouse Suite",
    price: 4500,
    location: "Brickell, FL",
    bedrooms: 3,
    bathrooms: 3,
    image: "/images/airbnb3.jpg",
    type: "Entire Place",
  },
  {
    id: 4,
    title: "Garden Apartment",
    price: 2400,
    location: "Coral Gables, FL",
    bedrooms: 1,
    bathrooms: 1,
    image: "/images/airbnb4.webp",
    type: "Entire Place",
  },
  {
    id: 5,
    title: "Spacious Family Home",
    price: 3800,
    location: "Coconut Grove, FL",
    bedrooms: 4,
    bathrooms: 3,
    image: "/images/airbnb1.jpg",
    type: "Entire Place",
  },
  {
    id: 6,
    title: "Minimalist City Condo",
    price: 2900,
    location: "Wynwood, FL",
    bedrooms: 2,
    bathrooms: 2,
    image: "/images/airbnb2.jpg",
    type: "Private Room",
  },
];

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSortBy = searchParams?.get("sortBy") || "created_at";
  const currentOrder = searchParams?.get("order") || "desc";

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const query = searchParams?.toString() || "";
        const res = await fetch(`/api/listings/search?${query}`);
        if (res.ok) {
          const data = await res.json();
          setFilteredProperties(data.listings || []);
        } else {
          setFilteredProperties([]);
        }
      } catch (e) {
        console.error("Failed to fetch listings", e);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, [searchParams]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const url = new URL(window.location.href);

    // Parse value like "price_desc"
    if (value === "recommended") {
      url.searchParams.set("sortBy", "recommended");
      url.searchParams.set("order", "desc");
    } else {
      const parts = value.split("_");
      const order = parts.pop() || "desc";
      const sortBy = parts.join("_");

      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("order", order);
    }

    // Preserve other search params, just update sorting
    window.location.href = url.pathname + url.search;
  };

  const handleClearFilters = () => {
    // We can just reload or push to base path
    window.location.href = "/browse";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white">
              P
            </div>
            <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-bold text-transparent">
              PayEasy Browse
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm font-medium text-gray-600 sm:block">Demo User</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-400">
              <UserCircle size={20} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar Area */}
          <aside className="w-full flex-shrink-0 lg:w-80">
            <div className="sticky top-24">
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Results Count & Sort */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProperties.length} Properties Found
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <label htmlFor="sort-dropdown">Sort by:</label>
                <select
                  id="sort-dropdown"
                  value={
                    currentSortBy === "recommended"
                      ? "recommended"
                      : `${currentSortBy}_${currentOrder}`
                  }
                  onChange={handleSortChange}
                  className="rounded-md border-gray-300 bg-white py-1 pl-2 pr-8 text-sm font-medium text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="created_at_desc">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="views_desc">Most Viewed</option>
                  <option value="favorites_desc">Most Favorited</option>
                  <option disabled>──────────</option>
                  <option value="recommended">Recommended</option>
                </select>
              </div>
            </div>

            {/* Property Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => (
                  <div
                    key={property.id}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute right-3 top-3 z-10 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                        {property.type}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="mb-1 text-lg font-semibold leading-tight text-gray-900 transition-colors group-hover:text-primary">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin size={14} className="text-gray-400" />
                            {property.location}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          <div
                            className="flex items-center gap-1.5"
                            title={`${property.bedrooms} Bedrooms`}
                          >
                            <Bed size={16} />
                            <span>{property.bedrooms}</span>
                          </div>
                          <div
                            className="flex items-center gap-1.5"
                            title={`${property.bathrooms} Bathrooms`}
                          >
                            <Bath size={16} />
                            <span>{property.bathrooms}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">
                            {property.rent_xlm || property.price} XLM
                          </span>
                          <span className="ml-1 text-xs text-gray-400">/ mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : !loading ? (
                <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
                  <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-50 p-4">
                    <MapPin size={32} className="text-gray-300" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">No properties found</h3>
                  <p className="mx-auto mb-6 max-w-xs text-sm text-gray-500">
                    We couldn&apos;t find any matches for your current filters. Try adjusting your
                    search criteria.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
