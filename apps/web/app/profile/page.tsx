"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

type UserProfile = {
  id: string;
  username: string;
  email?: string | null;
  public_key: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  listings_count: number;
};

function MaskedKey({ pubKey }: { pubKey: string }) {
  if (!pubKey) return null;
  return <span>{pubKey.slice(0, 6)}…{pubKey.slice(-4)}</span>;
}

import useAuth from "../../lib/hooks/useAuth";

export default function ProfilePage() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse flex items-center gap-4">
          <div className="rounded-full bg-gray-700 w-24 h-24" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-6 bg-gray-700 rounded w-1/3" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-700 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-red-400">Error loading profile: {error}</div>
    );
  }

  if (!user) {
    return <div className="p-6 max-w-3xl mx-auto">No profile found.</div>;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString();

  return (
    <main className="p-6 max-w-3xl mx-auto" aria-labelledby="profile-heading">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="w-28 h-28 relative rounded-full overflow-hidden bg-gray-800 flex-shrink-0" role="img" aria-label={`${user.username} avatar`}>
          {user.avatar_url ? (
            <Image src={user.avatar_url} alt={`${user.username} avatar`} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">{user.username?.charAt(0)?.toUpperCase()}</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <h1 id="profile-heading" className="text-2xl font-semibold truncate">{user.username}</h1>
            <Link href="/profile/edit" className="ml-auto" aria-label={`Edit ${user.username} profile`}>
              <button type="button" className="rounded-xl px-4 py-2 text-sm border border-white/10 bg-white/5 hover:bg-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500">Edit Profile</button>
            </Link>
          </div>

          <div className="mt-2 text-sm text-gray-300">
            {user.email && (
              <div className="flex items-center gap-2">
                <span className="text-gray-100">{user.email}</span>
                <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded" aria-hidden>Verified</span>
              </div>
            )}
            {user.bio && <p className="mt-2 text-sm text-gray-200">{user.bio}</p>}

            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-400">
              <div>
                <dt className="text-gray-400">Listings</dt>
                <dd className="text-white">{user.listings_count}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Member since</dt>
                <dd className="text-white">{memberSince}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Wallet</dt>
                <dd className="text-white font-mono">
                  <span aria-hidden><MaskedKey pubKey={user.public_key} /></span>
                  <span className="sr-only">{user.public_key}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>
  );
}
