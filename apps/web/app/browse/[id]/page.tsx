"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRecentViews } from "@/lib/hooks/useRecentViews";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { logView } = useRecentViews();

  useEffect(() => {
    if (id) {
      // Ideally we fetch the real listing data here, but simulating it for the hook interaction
      const mockListingData = {
        id: id,
        title: `Listing Details for ${id}`,
        address: "Unknown Location",
        rent_xlm: 1000,
        bedrooms: 1,
        bathrooms: 1,
      };
      // Execute tracking hook purely based on id.
      logView(mockListingData as any);
    }
  }, [id, logView]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Browse
        </Link>
        <h1 className="mb-4 text-3xl font-bold">Listing {id}</h1>
        <div className="min-h-[400px] rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="mb-4 text-gray-500">
            This page automatically logged your view via the `user_view_history` tracker loop!
          </p>
          {/* Listing Details Mock Content */}
          <div className="mb-4 h-64 w-full animate-pulse rounded-lg bg-gray-200"></div>
          <div className="mb-2 h-6 w-1/3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
}
