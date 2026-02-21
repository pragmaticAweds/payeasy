"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRecentViews } from "@/lib/hooks/useRecentViews";
import { MapPin, Bed, Bath, ArrowLeft } from "lucide-react";

export default function HistoryPage() {
  const { fetchHistory } = useRecentViews();
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchHistory();
      setHistory(data || []);
      setLoading(false);
    }
    load();
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/browse"
          className="mb-6 inline-flex items-center text-primary transition-colors hover:text-primary/80"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Browse
        </Link>
        <h1 className="mb-8 text-3xl font-bold">Recently Viewed</h1>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading your history...</div>
        ) : history.length > 0 ? (
          <div className="flex flex-col gap-4">
            {history.map((item, index) => (
              <Link href={`/browse/${item.id}`} key={index}>
                <div className="group flex h-32 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                  <div className="relative h-full w-48 flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.image_url || "/images/airbnb1.jpg"} // Fallback image for now
                      alt={item.title || "Listing Image"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                        {item.title || "Unknown Listing"}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={14} className="text-gray-400" />
                        {item.address || item.location || "Unknown Location"}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Viewed {new Date(item.viewed_at).toLocaleString()}
                      </span>
                      <span className="font-bold text-primary">
                        {item.rent_xlm || item.price} XLM/mo
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No history yet</h3>
            <p className="text-sm text-gray-500">You haven&apos;t viewed any listings recently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
