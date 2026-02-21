import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapView, { MapListing } from '@/components/MapView';
import Supercluster from 'supercluster';

// Mock react-map-gl
jest.mock('react-map-gl', () => ({
    __esModule: true,
    default: React.forwardRef(({ children, onLoad }: any, ref) => {
        // Simulate load event
        React.useEffect(() => {
            if (onLoad) onLoad();
        }, [onLoad]);

        React.useImperativeHandle(ref, () => ({
            getMap: () => ({
                getBounds: () => ({
                    getWest: () => -180,
                    getSouth: () => -90,
                    getEast: () => 180,
                    getNorth: () => 90,
                }),
                getZoom: () => 10,
            }),
            flyTo: jest.fn(),
        }));

        return <div data-testid="react-map-gl">{children}</div>;
    }),
    Marker: ({ children, latitude, longitude }: any) => (
        <div data-testid={`marker-${latitude}-${longitude}`}>{children}</div>
    ),
    Popup: ({ children }: any) => (
        <div data-testid="popup">{children}</div>
    ),
    NavigationControl: () => <div data-testid="navigation-control" />,
}));

// Mock Supercluster
jest.mock('supercluster', () => {
    return jest.fn().mockImplementation(() => ({
        load: jest.fn(),
        getClusters: jest.fn(),
        getClusterExpansionZoom: jest.fn(() => 12),
    }));
});

// Mock ListingPopup
jest.mock('@/components/ListingPopup', () => {
    return function MockListingPopup({ listing }: { listing: any }) {
        return <div data-testid={`listing-popup-${listing.id}`}>{listing.title}</div>;
    };
});

describe('MapView Component', () => {
    const originalEnv = process.env;

    const mockListings: MapListing[] = [
        {
            id: 1,
            title: 'Appt 1',
            price: 1000,
            location: 'Miami',
            bedrooms: 1,
            bathrooms: 1,
            image: '/img1.png',
            latitude: 25.7617,
            longitude: -80.1918,
        },
        {
            id: 2,
            title: 'Appt 2',
            price: 2000,
            location: 'Miami',
            bedrooms: 2,
            bathrooms: 2,
            image: '/img2.png',
            latitude: 25.7618,
            longitude: -80.1919,
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, NEXT_PUBLIC_MAPBOX_TOKEN: 'fake-token' };

        // Setup default supercluster behavior
        (Supercluster as jest.Mock).mockImplementation(() => ({
            load: jest.fn(),
            getClusters: jest.fn().mockReturnValue([
                {
                    type: 'Feature',
                    properties: mockListings[0],
                    geometry: { type: 'Point', coordinates: [mockListings[0].longitude, mockListings[0].latitude] },
                },
                {
                    type: 'Feature',
                    properties: { cluster: true, point_count: 5 },
                    id: 999,
                    geometry: { type: 'Point', coordinates: [0, 0] },
                }
            ]),
            getClusterExpansionZoom: jest.fn(() => 12),
        }));
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('renders error if no Mapbox token is provided', async () => {
        delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

        render(<MapView listings={mockListings} />);

        // Wait for hydration
        await waitFor(() => {
            expect(screen.getByText('Map view requires a Mapbox token')).toBeInTheDocument();
        });
    });

    it('renders map and map features correctly', async () => {
        render(<MapView listings={mockListings} />);

        await waitFor(() => {
            expect(screen.getByTestId('react-map-gl')).toBeInTheDocument();
        });

        expect(screen.getByTestId('navigation-control')).toBeInTheDocument();

        // Check if clusters and markers are rendered
        expect(screen.getByTestId('marker-25.7617--80.1918')).toBeInTheDocument(); // Normal marker
        expect(screen.getByTestId('marker-0-0')).toBeInTheDocument(); // Cluster marker

        expect(screen.getByText('1000 XLM')).toBeInTheDocument(); // From normal marker
        expect(screen.getByText('5')).toBeInTheDocument(); // From cluster point count
    });

    it('calls onBoundsChange when loaded', async () => {
        const onBoundsChange = jest.fn();
        render(<MapView listings={mockListings} onBoundsChange={onBoundsChange} />);

        await waitFor(() => {
            expect(onBoundsChange).toHaveBeenCalledWith([-180, -90, 180, 90]);
        });
    });
});
