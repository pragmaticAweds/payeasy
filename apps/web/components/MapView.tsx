'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import MapGL, {
    Marker,
    Popup,
    NavigationControl,
    ViewStateChangeEvent,
} from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import Supercluster from 'supercluster'
import debounce from 'lodash.debounce'
import ListingPopup from './ListingPopup'
import type { ListingPopupData } from './ListingPopup'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface MapListing extends ListingPopupData {
    latitude: number
    longitude: number
}

interface ViewState {
    latitude: number
    longitude: number
    zoom: number
}

interface MapViewProps {
    listings: MapListing[]
    initialViewState?: ViewState
    onBoundsChange?: (bbox: [number, number, number, number]) => void
    onViewStateChange?: (viewState: ViewState) => void
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type PointProperties = MapListing
type ClusterProperties = Supercluster.ClusterProperties

type ClusterFeature = Supercluster.ClusterFeature<ClusterProperties>
type PointFeature = Supercluster.PointFeature<PointProperties>

export default function MapView({
    listings,
    initialViewState,
    onBoundsChange,
    onViewStateChange,
}: MapViewProps) {
    const [mounted, setMounted] = useState(false)
    const mapRef = useRef<MapRef>(null)
    const [viewState, setViewState] = useState<ViewState>(
        initialViewState || {
            latitude: 25.7617,
            longitude: -80.1918,
            zoom: 11,
        }
    )
    const [selectedListing, setSelectedListing] = useState<MapListing | null>(null)
    const [clusters, setClusters] = useState<(ClusterFeature | PointFeature)[]>([])

    // Hydration guard
    useEffect(() => {
        setMounted(true)
    }, [])

    // Supercluster instance
    const supercluster = useMemo(() => {
        const sc = new Supercluster<PointProperties, ClusterProperties>({
            radius: 60,
            maxZoom: 16,
        })

        const points: PointFeature[] = listings.map((listing) => ({
            type: 'Feature',
            properties: listing,
            geometry: {
                type: 'Point',
                coordinates: [listing.longitude, listing.latitude],
            },
        }))

        sc.load(points)
        return sc
    }, [listings])

    // Update clusters when view changes
    const updateClusters = useCallback(() => {
        const map = mapRef.current?.getMap()
        if (!map || !supercluster) return

        const bounds = map.getBounds()
        if (!bounds) return

        const bbox: [number, number, number, number] = [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
        ]
        const zoom = Math.floor(map.getZoom())
        const newClusters = supercluster.getClusters(bbox, zoom)
        setClusters(newClusters)
    }, [supercluster])

    // Debounced bounds change callback
    const debouncedBoundsChange = useMemo(
        () =>
            debounce((map: mapboxgl.Map) => {
                const bounds = map.getBounds()
                if (!bounds) return
                const bbox: [number, number, number, number] = [
                    bounds.getWest(),
                    bounds.getSouth(),
                    bounds.getEast(),
                    bounds.getNorth(),
                ]
                onBoundsChange?.(bbox)
            }, 500),
        [onBoundsChange]
    )

    const handleMove = useCallback(
        (evt: ViewStateChangeEvent) => {
            const { latitude, longitude, zoom } = evt.viewState
            setViewState({ latitude, longitude, zoom })
            onViewStateChange?.({ latitude, longitude, zoom })
            updateClusters()
            const map = mapRef.current?.getMap()
            if (map) {
                debouncedBoundsChange(map)
            }
        },
        [onViewStateChange, updateClusters, debouncedBoundsChange]
    )

    // Update clusters on initial load
    const handleLoad = useCallback(() => {
        updateClusters()
        const map = mapRef.current?.getMap()
        if (map) {
            const bounds = map.getBounds()
            if (bounds) {
                onBoundsChange?.([
                    bounds.getWest(),
                    bounds.getSouth(),
                    bounds.getEast(),
                    bounds.getNorth(),
                ])
            }
        }
    }, [updateClusters, onBoundsChange])

    // Update clusters when listings change
    useEffect(() => {
        if (mounted) {
            updateClusters()
        }
    }, [mounted, updateClusters])

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedBoundsChange.cancel()
        }
    }, [debouncedBoundsChange])

    const handleClusterClick = (
        clusterId: number,
        longitude: number,
        latitude: number
    ) => {
        const zoom = supercluster.getClusterExpansionZoom(clusterId)
        mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom,
            duration: 500,
        })
    }

    if (!mounted) {
        return (
            <div className="h-full w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Loading map...</span>
            </div>
        )
    }

    if (!MAPBOX_TOKEN) {
        return (
            <div className="h-full w-full bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-gray-500 text-sm font-medium">
                    Map view requires a Mapbox token
                </p>
                <p className="text-gray-400 text-xs">
                    Set <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> in your environment variables.
                </p>
            </div>
        )
    }

    return (
        <MapGL
            ref={mapRef}
            {...viewState}
            onMove={handleMove}
            onLoad={handleLoad}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapStyle="mapbox://styles/mapbox/light-v11"
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
        >
            <NavigationControl position="top-right" />

            {clusters.map((feature) => {
                const [lng, lat] = feature.geometry.coordinates
                const isCluster = (feature.properties as ClusterProperties & { cluster?: boolean }).cluster

                if (isCluster) {
                    const clusterFeature = feature as ClusterFeature
                    const pointCount = clusterFeature.properties.point_count
                    const size = Math.min(
                        24 + (pointCount / listings.length) * 40,
                        56
                    )

                    return (
                        <Marker
                            key={`cluster-${clusterFeature.id}`}
                            latitude={lat}
                            longitude={lng}
                            anchor="center"
                        >
                            <div
                                className="rounded-full bg-primary text-white flex items-center justify-center font-bold cursor-pointer shadow-md hover:scale-110 transition-transform border-2 border-white"
                                style={{
                                    width: `${size}px`,
                                    height: `${size}px`,
                                    fontSize: `${Math.max(12, size / 3.5)}px`,
                                }}
                                onClick={() =>
                                    handleClusterClick(
                                        clusterFeature.id as number,
                                        lng,
                                        lat
                                    )
                                }
                            >
                                {pointCount}
                            </div>
                        </Marker>
                    )
                }

                const pointFeature = feature as PointFeature
                const listing = pointFeature.properties

                return (
                    <Marker
                        key={`listing-${listing.id}`}
                        latitude={lat}
                        longitude={lng}
                        anchor="bottom"
                    >
                        <div
                            className={`cursor-pointer px-2 py-1 rounded-lg text-xs font-bold shadow-md transition-all hover:scale-110 whitespace-nowrap ${
                                selectedListing?.id === listing.id
                                    ? 'bg-primary text-white scale-110'
                                    : 'bg-white text-primary border border-gray-200'
                            }`}
                            onClick={() => setSelectedListing(listing)}
                        >
                            {listing.price} XLM
                        </div>
                    </Marker>
                )
            })}

            {selectedListing && (
                <Popup
                    latitude={selectedListing.latitude}
                    longitude={selectedListing.longitude}
                    anchor="bottom"
                    offset={25}
                    closeButton={false}
                    closeOnClick={false}
                    onClose={() => setSelectedListing(null)}
                    maxWidth="none"
                    className="[&_.mapboxgl-popup-content]:p-0 [&_.mapboxgl-popup-content]:bg-transparent [&_.mapboxgl-popup-content]:shadow-none [&_.mapboxgl-popup-tip]:border-t-white"
                >
                    <ListingPopup
                        listing={selectedListing}
                        onClose={() => setSelectedListing(null)}
                    />
                </Popup>
            )}
        </MapGL>
    )
}
