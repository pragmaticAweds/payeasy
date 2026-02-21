import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewToggle from '@/components/ViewToggle';

describe('ViewToggle Component', () => {
    const mockOnChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with grid view active', () => {
        render(<ViewToggle view="grid" onChange={mockOnChange} />);

        const gridButton = screen.getByRole('button', { name: 'Grid view' });
        const mapButton = screen.getByRole('button', { name: 'Map view' });

        expect(gridButton).toBeInTheDocument();
        expect(mapButton).toBeInTheDocument();

        expect(gridButton).toHaveClass('bg-primary');
        expect(mapButton).not.toHaveClass('bg-primary');
    });

    it('renders correctly with map view active', () => {
        render(<ViewToggle view="map" onChange={mockOnChange} />);

        const gridButton = screen.getByRole('button', { name: 'Grid view' });
        const mapButton = screen.getByRole('button', { name: 'Map view' });

        expect(gridButton).not.toHaveClass('bg-primary');
        expect(mapButton).toHaveClass('bg-primary');
    });

    it('calls onChange with "grid" when grid button is clicked', () => {
        render(<ViewToggle view="map" onChange={mockOnChange} />);

        const gridButton = screen.getByRole('button', { name: 'Grid view' });
        fireEvent.click(gridButton);

        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('grid');
    });

    it('calls onChange with "map" when map button is clicked', () => {
        render(<ViewToggle view="grid" onChange={mockOnChange} />);

        const mapButton = screen.getByRole('button', { name: 'Map view' });
        fireEvent.click(mapButton);

        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith('map');
    });
});
