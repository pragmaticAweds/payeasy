'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Network connection type
 */
type NetworkType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';

/**
 * Prefetch metrics for monitoring
 */
interface PrefetchMetrics {
  totalPrefetches: number;
  successfulPrefetches: number;
  failedPrefetches: number;
  networkSkipped: number;
  averageLoadTime: number;
}

/**
 * Prefetch configuration options
 */
interface PrefetchConfig {
  enabled?: boolean;
  network?: 'all' | '4g' | '3g-4g';
  hoverDelay?: number;
  idlePriority?: 'high' | 'low';
  cacheDuration?: number;
  batchSize?: number;
}

/**
 * Cached resource entry
 */
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

/**
 * Request queue item
 */
interface QueueItem {
  url: string;
  priority: number;
}

/**
 * Global prefetch manager singleton
 */
class PrefetchManager {
  private static instance: PrefetchManager;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private prefetchQueue: QueueItem[] = [];
  private metrics: PrefetchMetrics = {
    totalPrefetches: 0,
    successfulPrefetches: 0,
    failedPrefetches: 0,
    networkSkipped: 0,
    averageLoadTime: 0,
  };
  private config: Required<PrefetchConfig> = {
    enabled: true,
    network: '3g-4g',
    hoverDelay: 100,
    idlePriority: 'low',
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    batchSize: 3,
  };
  private loadTimes: number[] = [];

  private constructor() {
    this.initializeCache();
  }

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  /**
   * Initialize cache cleanup for expired entries
   */
  private initializeCache(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Get current network type
   */
  private getNetworkType(): NetworkType {
    if (typeof window === 'undefined') return 'unknown';

    const nav = navigator as unknown as { connection?: { effectiveType?: string } };
    if (!nav.connection) return 'unknown';

    switch (nav.connection.effectiveType) {
      case '4g':
        return '4g';
      case '3g':
        return '3g';
      case '2g':
        return '2g';
      case 'slow-2g':
        return 'slow-2g';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if network supports prefetching based on configuration
   */
  private shouldPrefetchForNetwork(): boolean {
    const network = this.getNetworkType();

    if (this.config.network === 'all') return true;
    if (this.config.network === '4g') return network === '4g';
    if (this.config.network === '3g-4g') {
      return network === '4g' || network === '3g';
    }

    return false;
  }

  /**
   * Check if data is cached and not expired
   */
  private isCached(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Prefetch a resource (route or data)
   */
  async prefetch(url: string, options?: { priority?: number; ttl?: number }): Promise<void> {
    if (!this.config.enabled) return;

    // Check if already cached
    if (this.isCached(url)) {
      this.metrics.successfulPrefetches++;
      return;
    }

    // Check network constraints
    if (!this.shouldPrefetchForNetwork()) {
      this.metrics.networkSkipped++;
      return;
    }

    // Return existing pending request
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    this.metrics.totalPrefetches++;
    const priority = options?.priority ?? 0;
    const ttl = options?.ttl ?? this.config.cacheDuration;

    const request = this.executePrefetch(url, ttl).catch((error) => {
      this.metrics.failedPrefetches++;
      console.error(`[Prefetch] Failed to prefetch ${url}:`, error);
    });

    this.pendingRequests.set(url, request);

    request.finally(() => {
      this.pendingRequests.delete(url);
    });

    this.prefetchQueue.push({ url, priority });
    this.prefetchQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute the actual prefetch request
   */
  private async executePrefetch(url: string, ttl: number): Promise<unknown> {
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Prefetch': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const loadTime = performance.now() - startTime;

      // Update metrics
      this.loadTimes.push(loadTime);
      if (this.loadTimes.length > 100) {
        this.loadTimes.shift();
      }
      this.metrics.averageLoadTime =
        this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length;

      // Cache the result
      this.cache.set(url, {
        data,
        timestamp: Date.now(),
        ttl,
      });

      this.metrics.successfulPrefetches++;
      return data;
    } catch (error) {
      this.metrics.failedPrefetches++;
      throw error;
    }
  }

  /**
   * Get cached data if available
   */
  getCachedData<T = unknown>(url: string): T | null {
    const entry = this.cache.get(url);
    if (!entry || Date.now() - entry.timestamp > entry.ttl) {
      if (entry) this.cache.delete(url);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    this.prefetchQueue = [];
  }

  /**
   * Get prefetch metrics
   */
  getMetrics(): PrefetchMetrics {
    return { ...this.metrics };
  }

  /**
   * Update configuration
   */
  setConfig(config: PrefetchConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PrefetchConfig {
    return { ...this.config };
  }
}

/**
 * Hook for prefetching routes on hover
 */
export function usePrefetchOnHover(href: string): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const manager = PrefetchManager.getInstance();

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      router.prefetch(href);
      manager.prefetch(href, { priority: 1 });
    }, manager.getConfig().hoverDelay);
  }, [href, router, manager]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

/**
 * Hook for prefetching on idle
 */
export function usePrefetchOnIdle(urls: string[]): void {
  const manager = PrefetchManager.getInstance();

  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback for browsers that don't support requestIdleCallback
      const timer = setTimeout(() => {
        urls.forEach((url) => manager.prefetch(url, { priority: 0 }));
      }, 2000);
      return () => clearTimeout(timer);
    }

    const idleCallbacks: number[] = [];

    urls.forEach((url) => {
      const id = requestIdleCallback(
        () => {
          manager.prefetch(url, { priority: 0 });
        },
        { timeout: 5000 }
      );
      idleCallbacks.push(id);
    });

    return () => {
      idleCallbacks.forEach((id) => cancelIdleCallback(id));
    };
  }, [urls, manager]);
}

/**
 * Hook for network-aware prefetching
 */
export function useNetworkAwarePrefetch(
  urls: string[],
  options?: PrefetchConfig
): { status: 'idle' | 'loading' | 'complete'; metrics: PrefetchMetrics } {
  const manager = PrefetchManager.getInstance();
  const [status, setStatus] = useState<'idle' | 'loading' | 'complete'>('idle');

  useEffect(() => {
    if (options) {
      manager.setConfig(options);
    }
  }, [options, manager]);

  useEffect(() => {
    setStatus('loading');

    const prefetchAll = async () => {
      await Promise.allSettled(urls.map((url) => manager.prefetch(url)));
      setStatus('complete');
    };

    prefetchAll();
  }, [urls, manager]);

  return {
    status,
    metrics: manager.getMetrics(),
  };
}

/**
 * Hook to access prefetch manager
 */
export function usePrefetchManager() {
  const manager = PrefetchManager.getInstance();

  return {
    prefetch: (url: string, options?: { priority?: number; ttl?: number }) =>
      manager.prefetch(url, options),
    getCachedData: <T = unknown,>(url: string) => manager.getCachedData<T>(url),
    clearCache: () => manager.clearCache(),
    getMetrics: () => manager.getMetrics(),
    setConfig: (config: PrefetchConfig) => manager.setConfig(config),
    getConfig: () => manager.getConfig(),
  };
}

/**
 * Initialize prefetch monitoring
 */
export function initPrefetchMonitoring(options?: PrefetchConfig): void {
  if (typeof window === 'undefined') return;

  const manager = PrefetchManager.getInstance();

  if (options) {
    manager.setConfig(options);
  }

  // Log metrics periodically in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      const metrics = manager.getMetrics();
      console.log('[Prefetch Metrics]', metrics);
    }, 30000);
  }
}

/**
 * Enhance an element with prefetch capabilities
 */
export function withPrefetch<T extends { href?: string }>(Component: React.ComponentType<T>) {
  return function PrefetchComponent(props: T) {
    const { href } = props;
    const prefetch = usePrefetchOnHover(href || '/');

    return <Component {...props} {...prefetch} />;
  };
}
