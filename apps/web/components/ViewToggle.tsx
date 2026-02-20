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
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === 'grid'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Grid view"
            >
                <Grid3X3 size={16} />
                <span className="hidden sm:inline">Grid</span>
            </button>
            <button
                onClick={() => onChange('map')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    view === 'map'
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Map view"
            >
                <Map size={16} />
                <span className="hidden sm:inline">Map</span>
            </button>
        </div>
    )
}
