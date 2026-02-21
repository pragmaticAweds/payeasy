import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListingPopup, { ListingPopupData } from '@/components/ListingPopup';

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ fill, ...props }: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img {...props} data-testid="next-image-mock" />;
    },
}));

// Mock FavoriteButton
jest.mock('@/components/FavoriteButton', () => {
    return function MockFavoriteButton({ listingId }: { listingId: string }) {
        return <button data-testid={`favorite-button-${listingId}`}>Favorite</button>;
    };
});

describe('ListingPopup Component', () => {
    const mockListing: ListingPopupData = {
        id: 1,
        title: 'Beautiful Apartment in Miami',
        price: 1500,
        location: 'Miami, FL',
        bedrooms: 2,
        bathrooms: 2,
        image: '/images/listing-1.jpg',
    };

    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders listing details correctly', () => {
        render(<ListingPopup listing={mockListing} onClose={mockOnClose} />);

        // Renders the image
        const image = screen.getByTestId('next-image-mock');
        expect(image).toHaveAttribute('src', '/images/listing-1.jpg');
        expect(image).toHaveAttribute('alt', 'Beautiful Apartment in Miami');

        // Renders the details
        expect(screen.getByText('Beautiful Apartment in Miami')).toBeInTheDocument();
        expect(screen.getByText('Miami, FL')).toBeInTheDocument();

        // Test for price
        expect(screen.getByText('1500 XLM')).toBeInTheDocument();
    });

    it('renders favorite button with correct listingId', () => {
        render(<ListingPopup listing={mockListing} onClose={mockOnClose} />);

        expect(screen.getByTestId('favorite-button-1')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        render(<ListingPopup listing={mockListing} onClose={mockOnClose} />);

        const closeButton = screen.getByLabelText('Close popup');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
