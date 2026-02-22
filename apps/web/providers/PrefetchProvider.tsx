'use client';

import { ReactNode, useEffect } from 'react';
import { initPrefetchMonitoring } from '@/lib/performance/prefetch';

/**
 * Provider for prefetch initialization and monitoring
 * Wraps the application to enable prefetch functionality globally
 */
export function PrefetchProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize prefetch monitoring with default settings
    // Customize these based on your network and performance requirements
    initPrefetchMonitoring({
      enabled: true,
      network: '3g-4g', // Prefetch on 3G or better
      hoverDelay: 100, // 100ms delay before prefetch on hover
      idlePriority: 'low', // Use low priority for idle prefetches
      cacheDuration: 5 * 60 * 1000, // Cache for 5 minutes
      batchSize: 3, // Process up to 3 concurrent prefetch requests
    });
  }, []);

  return <>{children}</>;
}
