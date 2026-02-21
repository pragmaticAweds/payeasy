"use client";

import React, { useEffect, useState } from "react";
import { useRecentViews } from "@/lib/hooks/useRecentViews";
import Link from "next/link";
import Image from "next/image";

export default function RecentViewsDashboard() {
  const { fetchHistory } = useRecentViews();
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const data = await fetchHistory();
      if (data) {
        setRecent(data.slice(0, 4)); // Show top 4 on dashboard
      }
    }
    load();
  }, [fetchHistory]);

  if (recent.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Recently Viewed</h2>
        <Link href="/history" className="text-sm text-primary hover:text-primary/80">
          View all history →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {recent.map((item, idx) => (
          <Link
            href={`/browse/${item.id}`}
            key={idx}
            className="group relative block h-48 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/50 transition-colors hover:border-primary"
          >
            <Image
              src={item.image_url || "/images/airbnb1.jpg"}
              alt={item.title || "Listing"}
              fill
              className="object-cover opacity-60 transition-opacity group-hover:opacity-100"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="truncate text-sm font-medium text-white">{item.title}</p>
              <p className="text-xs font-bold text-slate-300">{item.rent_xlm || item.price} XLM</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
