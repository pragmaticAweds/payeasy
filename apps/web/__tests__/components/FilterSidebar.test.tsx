import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FilterSidebar from '@/components/FilterSidebar';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
}));

// Mock react-select to avoid complex DOM interactions
jest.mock('react-select', () => ({
    __esModule: true,
    default: ({ options, value, onChange, placeholder }: any) => {
        return (
            <div data-testid="react-select-mock">
                <select
                    multiple
                    data-testid="amenities-select"
                    value={value.map((v: any) => v.value)}
                    onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => ({
                            value: option.value,
                            label: option.text,
                        }));
                        onChange(selected, { action: 'select-option' });
                    }}
                >
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        );
    },
}));

// Mock Radix Slider
jest.mock('@radix-ui/react-slider', () => ({
    Root: ({ children, value, onValueChange, min, max }: any) => (
        <div data-testid="slider-root">
            <input
                type="range"
                data-testid="slider-min"
                value={value[0]}
                min={min}
                max={max}
                onChange={(e) => onValueChange([Number(e.target.value), value[1]])}
            />
            <input
                type="range"
                data-testid="slider-max"
                value={value[1]}
                min={min}
                max={max}
                onChange={(e) => onValueChange([value[0], Number(e.target.value)])}
            />
            {children}
        </div>
    ),
    Track: ({ children }: any) => <div>{children}</div>,
    Range: () => <div />,
    Thumb: () => <div />,
}));

describe('FilterSidebar Component', () => {
    const mockRouter = {
        replace: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (usePathname as jest.Mock).mockReturnValue('/search');
        (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    });

    it('renders correctly after hydration', async () => {
        render(<FilterSidebar />);

        // Wait for hydration (it renders skeleton initially)
        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('City, Neighborhood, ZIP')).toBeInTheDocument();
        expect(screen.getByText('Bedrooms')).toBeInTheDocument();
    });

    it('initializes filters from URL params', async () => {
        (useSearchParams as jest.Mock).mockReturnValue(
            new URLSearchParams('minPrice=100&maxPrice=500&location=Miami,%20FL&furnished=true')
        );

        render(<FilterSidebar />);

        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('City, Neighborhood, ZIP')).toHaveValue('Miami, FL');
        expect(screen.getByText('100 - 500 XLM')).toBeInTheDocument();

        const checkboxes = screen.getAllByRole('checkbox');
        // Furnished is the first custom checkbox implemented
        expect(checkboxes[0]).toBeChecked();
    });

    it('updates location filter and shows suggestions', async () => {
        const user = userEvent.setup();
        render(<FilterSidebar />);

        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        const locationInput = screen.getByPlaceholderText('City, Neighborhood, ZIP');
        await user.type(locationInput, 'Miam');

        await waitFor(() => {
            expect(screen.getByText('Miami, FL')).toBeInTheDocument();
        });

        // Select suggestion
        fireEvent.click(screen.getByText('Miami, FL'));

        expect(locationInput).toHaveValue('Miami, FL');

        // Debounce means we need to wait for router.replace to be called
        await waitFor(() => {
            expect(mockRouter.replace).toHaveBeenCalledWith(
                expect.stringContaining('location=Miami%2C+FL'),
                { scroll: false }
            );
        });
    });

    it('updates select filters instantly (bedrooms, bathrooms)', async () => {
        const user = userEvent.setup();
        render(<FilterSidebar />);

        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        const selects = screen.getAllByRole('combobox');
        // selects[0] is bedrooms, selects[1] is bathrooms, selects[2] is amenities mock

        await user.selectOptions(selects[0], '2');

        expect(mockRouter.replace).toHaveBeenCalledWith(
            expect.stringContaining('bedrooms=2'),
            { scroll: false }
        );
    });

    it('updates toggle filters (furnished, pet-friendly)', async () => {
        const user = userEvent.setup();
        render(<FilterSidebar />);

        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        const checkboxes = screen.getAllByRole('checkbox');
        // 0: furnished, 1: petFriendly

        await user.click(checkboxes[1]); // Click petFriendly

        expect(mockRouter.replace).toHaveBeenCalledWith(
            expect.stringContaining('petFriendly=true'),
            { scroll: false }
        );
    });

    it('clears all filters', async () => {
        (useSearchParams as jest.Mock).mockReturnValue(
            new URLSearchParams('location=Miami&bedrooms=3&furnished=true')
        );

        const user = userEvent.setup();
        render(<FilterSidebar />);

        await waitFor(() => {
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        const clearBtn = screen.getByRole('button', { name: /Clear all/i });
        await user.click(clearBtn);

        expect(mockRouter.replace).toHaveBeenCalledWith(
            '/search?',
            { scroll: false }
        );
        expect(screen.getByPlaceholderText('City, Neighborhood, ZIP')).toHaveValue('');
    });
});
