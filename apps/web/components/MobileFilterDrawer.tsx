/**
 * @file MobileFilterDrawer.tsx
 * @description Mobile-optimized filter drawer for property search
 * 
 * Features:
 * - Bottom sheet design pattern for mobile
 * - Touch-friendly controls (48px minimum)
 * - Smooth animations
 * - Safe area support for notched devices
 */

'use client';

import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';

interface MobileFilterDrawerProps {
  filterCount?: number;
}

export default function MobileFilterDrawer({ filterCount = 0 }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Filter Button (Mobile) - Touch-friendly */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 flex h-14 items-center gap-2 rounded-full bg-primary px-6 py-3 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all min-h-touch-sm"
        aria-label="Open filters"
      >
        <Filter size={20} />
        <span className="font-medium">Filters</span>
        {filterCount > 0 && (
          <span className="ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary">
            {filterCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Filter Drawer */}
      <div
        className={`
          fixed inset-x-0 bottom-0 z-50 max-h-[90vh] transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        aria-hidden={!isOpen}
      >
        <div className="rounded-t-2xl bg-white shadow-2xl pb-safe-bottom">
          {/* Handle bar */}
          <div className="flex justify-center py-3">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-touch-sm w-touch-sm items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Close filters"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filter Content - Scrollable */}
          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-4 py-6">
            <FilterSidebar />
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-touch-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 active:bg-primary/80 transition-colors min-h-touch-sm shadow-sm shadow-primary/20"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
