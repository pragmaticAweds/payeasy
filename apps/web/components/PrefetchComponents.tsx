'use client';

import Link from 'next/link';
import { usePrefetchOnHover, usePrefetchOnIdle, usePrefetchManager } from '@/lib/performance/prefetch';

/**
 * Example: Link with hover prefetch
 */
export function PrefetchLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { onMouseEnter, onMouseLeave } = usePrefetchOnHover(href);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Link>
  );
}

/**
 * Example: Component with idle prefetch
 */
export function DashboardPrefetcher() {
  const likelyRoutes = ['/api/listings', '/api/messages', '/api/profile'];

  usePrefetchOnIdle(likelyRoutes);

  return null; // This component doesn't render anything
}

/**
 * Example: Cache data from prefetch
 */
export function CachedDataComponent() {
  const { getCachedData, prefetch } = usePrefetchManager();

  // Try to get cached data from a previous prefetch
  const cachedListings = getCachedData<unknown>('/api/listings');

  return (
    <div>
      {cachedListings ? <p>Data was prefetched!</p> : <p>No cached data yet</p>}
      <button
        onClick={() => {
          prefetch('/api/listings');
        }}
      >
        Prefetch Listings
      </button>
    </div>
  );
}

/**
 * Example: Prefetch multiple routes on navigation
 */
export function NavigationPrefetcher({ items }: { items: Array<{ label: string; href: string }> }) {
  const { prefetch } = usePrefetchManager();

  const handleNavigationStart = (href: string) => {
    // Prefetch related data for the target page
    prefetch(`/api${href}/data`);
  };

  return (
    <nav>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => handleNavigationStart(item.href)}
          onMouseEnter={() => prefetch(`/api${item.href}/data`)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
