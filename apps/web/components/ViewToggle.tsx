/**
 * @file ViewToggle.tsx
 * @description Mobile-first view toggle with touch-friendly buttons (48px min)
 */

'use client'

import { Grid3X3, Map } from 'lucide-react'

type ViewMode = 'grid' | 'map'

interface ViewToggleProps {
    view: ViewMode
    onChange: (view: ViewMode) => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
            <button
                onClick={() => onChange('grid')}
                className={`
                    flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-2.5 sm:py-2
                    text-sm font-medium transition-colors
                    min-h-touch-sm min-w-[48px] sm:min-w-0
                    ${
                        view === 'grid'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:text-gray-900 active:bg-gray-50'
                    }
                `}
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
            >
                <Grid3X3 size={18} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Grid</span>
            </button>
            <button
                onClick={() => onChange('map')}
                className={`
                    flex items-center justify-center gap-1.5 rounded-md px-3 sm:px-4 py-2.5 sm:py-2
                    text-sm font-medium transition-colors
                    min-h-touch-sm min-w-[48px] sm:min-w-0
                    ${
                        view === 'map'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:text-gray-900 active:bg-gray-50'
                    }
                `}
                aria-label="Map view"
                aria-pressed={view === 'map'}
            >
                <Map size={18} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Map</span>
            </button>
        </div>
    )
}
