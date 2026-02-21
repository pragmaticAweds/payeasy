"use client";

import { useEffect, useState, useCallback } from "react";

export type AuthUser = {
  id: string;
  username: string;
  email?: string | null;
  public_key: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  listings_count: number;
};

export default function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "Failed to load user");
      }
      setUser(json.data as AuthUser);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchUser();
    })();
    return () => { mounted = false };
  }, [fetchUser]);

  return { user, loading, error, refresh: fetchUser } as const;
}
