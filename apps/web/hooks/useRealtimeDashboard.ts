"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import {
  realtimeManager,
  ConnectionStatus,
} from "@/lib/realtime/websockets";
import type { Activity } from "@/components/dashboard/RecentActivity";

type SystemStatusKey = "database" | "blockchain" | "authentication" | "payments";

export type AdminDashboardSummary = {
  stats: {
    totalUsers: number;
    activeListings: number;
    totalPayments: number;
    revenue: string;
  };
  recentActivities: Activity[];
  systemStatus: Record<SystemStatusKey, string>;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch admin dashboard data");
    return res.json();
  });

export function useRealtimeDashboard() {
  const {
    data: initialData,
    error,
    isLoading,
    mutate,
  } = useSWR<AdminDashboardSummary>("/api/admin/dashboard/summary", fetcher);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [realtimeData, setRealtimeData] = useState<AdminDashboardSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE fallback for metric streaming
  useEffect(() => {
    const eventSource = new EventSource("/api/admin/dashboard/stream");
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data) as Partial<AdminDashboardSummary>;
        setRealtimeData((prev) => {
          const base = prev || initialData;
          if (!base) return null;
          return {
            stats: { ...base.stats, ...update.stats },
            recentActivities: update.recentActivities || base.recentActivities,
            systemStatus: { ...base.systemStatus, ...update.systemStatus },
          };
        });
        setLastUpdated(new Date());
      } catch {
        // Ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      // SSE will auto-reconnect; we rely on Supabase channel as primary
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [initialData]);

  // Supabase realtime channel subscription
  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe(
      (status) => setConnectionStatus(status),
      (event, payload) => {
        setRealtimeData((prev) => {
          const base = prev || initialData;
          if (!base) return null;

          switch (event) {
            case "metrics-update":
              return {
                ...base,
                stats: { ...base.stats, ...(payload as Partial<AdminDashboardSummary["stats"]>) },
              };
            case "activity-update": {
              const newActivity = payload as unknown as Activity;
              return {
                ...base,
                recentActivities: [newActivity, ...base.recentActivities].slice(0, 10),
              };
            }
            case "status-update":
              return {
                ...base,
                systemStatus: {
                  ...base.systemStatus,
                  ...(payload as Partial<AdminDashboardSummary["systemStatus"]>),
                },
              };
            default:
              return base;
          }
        });
        setLastUpdated(new Date());
      }
    );

    return unsubscribe;
  }, [initialData]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  // Merge: prefer realtime data, fall back to SWR initial data
  const data = realtimeData || initialData || null;

  return {
    data,
    error,
    isLoading,
    connectionStatus,
    lastUpdated,
    refresh,
  };
}
