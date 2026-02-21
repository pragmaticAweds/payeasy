"use client";

import { useEffect, useState } from "react";
import { Listing } from "@/lib/db/types"; // Adjust if path isn't strictly correct

const LOCAL_STORAGE_KEY = "payeasy_recent_views";
const MAX_LOCAL_VIEWS = 50;

export interface RecentViewData {
  listing_id: string;
  viewed_at: string;
  listing?: any; // A lightweight representation of the listing for anon users
}

export function useRecentViews() {
  const [localHistory, setLocalHistory] = useState<RecentViewData[]>([]);

  // Load local history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setLocalHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse local recent views", e);
    }
  }, []);

  /**
   * Logs a view to the server (if authenticated) and to localStorage (always, for fast client access).
   */
  const logView = async (listing: Listing) => {
    const listingId = listing.id;
    const now = new Date().toISOString();

    // 1. Update localStorage immediately (optimistic & for anon)
    setLocalHistory((prev) => {
      // Remove it if it already exists to bring it to the front
      const filtered = prev.filter((v) => v.listing_id !== listingId);
      const newEntry: RecentViewData = {
        listing_id: listingId,
        viewed_at: now,
        listing: {
          id: listing.id,
          title: listing.title,
          address: listing.address,
          rent_xlm: listing.rent_xlm,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
        }, // Store basic snapshot so anon users don't need to refetch all DB items immediately if we don't want to
      };

      const newHistory = [newEntry, ...filtered].slice(0, MAX_LOCAL_VIEWS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });

    // 2. Hit the API to log server-side if user is authenticated
    try {
      await fetch(`/api/listings/${listingId}/view`, { method: "POST" });
    } catch (err) {
      console.error("Failed to log view to server", err);
    }
  };

  /**
   * Fetches the unified history. If the user is logged in, it merges the server data.
   * Note: In a real advanced app, we'd sync localStorage up to the server here on login.
   */
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/users/me/recent");
      if (res.ok) {
        const body = await res.json();
        // Server data takes precedence if returned
        return body.data;
      } else if (res.status === 401) {
        // User not logged in, return local storage fallback mapped nicely
        return localHistory.map((entry) => ({
          ...entry.listing,
          viewed_at: entry.viewed_at,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch recent history", err);
    }

    // Fallback to local storage if API fails completely
    return localHistory.map((entry) => ({
      ...entry.listing,
      viewed_at: entry.viewed_at,
    }));
  };

  return { localHistory, logView, fetchHistory };
}
