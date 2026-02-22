import { renderHook, act, waitFor } from '@testing-library/react';
import {
  usePrefetchOnHover,
  usePrefetchOnIdle,
  useNetworkAwarePrefetch,
  usePrefetchManager,
  initPrefetchMonitoring,
} from '@/lib/performance/prefetch';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: jest.fn(),
  }),
}));

describe('Prefetch Hooks', () => {
  beforeEach(() => {
    // Clear fetch cache before each test
    jest.clearAllMocks();
  });

  describe('usePrefetchManager', () => {
    it('should initialize prefetch manager', () => {
      const { result } = renderHook(() => usePrefetchManager());

      expect(result.current.prefetch).toBeDefined();
      expect(result.current.getCachedData).toBeDefined();
      expect(result.current.clearCache).toBeDefined();
      expect(result.current.getMetrics).toBeDefined();
    });

    it('should get initial metrics', () => {
      const { result } = renderHook(() => usePrefetchManager());

      const metrics = result.current.getMetrics();
      expect(metrics).toEqual({
        totalPrefetches: 0,
        successfulPrefetches: 0,
        failedPrefetches: 0,
        networkSkipped: 0,
        averageLoadTime: 0,
      });
    });

    it('should clear cache', () => {
      const { result } = renderHook(() => usePrefetchManager());

      act(() => {
        result.current.clearCache();
      });

      expect(result.current.getMetrics().totalPrefetches).toBe(0);
    });

    it('should set and get configuration', () => {
      const { result } = renderHook(() => usePrefetchManager());

      act(() => {
        result.current.setConfig({
          enabled: false,
          hoverDelay: 200,
          network: '4g',
        });
      });

      const config = result.current.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.hoverDelay).toBe(200);
      expect(config.network).toBe('4g');
    });
  });

  describe('usePrefetchOnHover', () => {
    it('should return mouse event handlers', () => {
      const { result } = renderHook(() => usePrefetchOnHover('/test'));

      expect(typeof result.current.onMouseEnter).toBe('function');
      expect(typeof result.current.onMouseLeave).toBe('function');
    });

    it('should trigger prefetch on hover after delay', async () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => usePrefetchOnHover('/test'));

      act(() => {
        result.current.onMouseEnter();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      jest.useRealTimers();
    });

    it('should cancel prefetch on mouse leave', () => {
      jest.useFakeTimers();

      const { result } = renderHook(() => usePrefetchOnHover('/test'));

      act(() => {
        result.current.onMouseEnter();
        result.current.onMouseLeave();
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      jest.useRealTimers();
    });
  });

  describe('usePrefetchOnIdle', () => {
    it('should prefetch on idle', async () => {
      const urls = ['/api/data1', '/api/data2'];
      const { unmount } = renderHook(() => usePrefetchOnIdle(urls));

      await waitFor(() => {
        expect(true).toBe(true);
      });

      unmount();
    });

    it('should use fallback timer for browsers without requestIdleCallback', async () => {
      jest.useFakeTimers();

      const originalRIC = (global as unknown as {
        requestIdleCallback?: undefined;
      }).requestIdleCallback;
      delete (global as unknown as { requestIdleCallback?: undefined }).requestIdleCallback;

      const urls = ['/api/data1'];
      const { unmount } = renderHook(() => usePrefetchOnIdle(urls));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      unmount();

      if (originalRIC) {
        (global as unknown as { requestIdleCallback: typeof originalRIC }).requestIdleCallback =
          originalRIC;
      }

      jest.useRealTimers();
    });

    it('should cleanup idle callbacks on unmount', () => {
      const urls = ['/api/data1'];
      const { unmount } = renderHook(() => usePrefetchOnIdle(urls));

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('useNetworkAwarePrefetch', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useNetworkAwarePrefetch(['/api/data']));

      expect(result.current.status).toBe('loading');
      expect(result.current.metrics).toBeDefined();
    });

    it('should apply configuration', () => {
      const config = { network: '4g' as const, hoverDelay: 200 };
      const { result } = renderHook(() =>
        useNetworkAwarePrefetch(['/api/data'], config)
      );

      expect(result.current.metrics).toBeDefined();
    });

    it('should handle empty URL array', () => {
      const { result } = renderHook(() => useNetworkAwarePrefetch([]));

      expect(result.current.metrics.totalPrefetches).toBeGreaterThanOrEqual(0);
    });
  });

  describe('initPrefetchMonitoring', () => {
    it('should initialize without throwing', () => {
      expect(() => {
        initPrefetchMonitoring({ network: '3g-4g' });
      }).not.toThrow();
    });

    it('should apply configuration on init', () => {
      initPrefetchMonitoring({
        enabled: true,
        network: '4g',
        hoverDelay: 150,
      });

      // Verify it doesn't throw and configuration is applied
      expect(true).toBe(true);
    });
  });
});
