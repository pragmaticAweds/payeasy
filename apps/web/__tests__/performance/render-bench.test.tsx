import { render } from '@testing-library/react';
import FilterSidebar from '../../components/FilterSidebar';

global.ResizeObserver = class {
    observe() { }
    unobserve() { }
    disconnect() { }
} as any;

describe('Performance - Component Render Times', () => {
    const RENDER_BUDGET_MS = 25; // max render time for FilterSidebar

    const INITIAL_FILTERS = {
        minPrice: 0,
        maxPrice: 5000,
        bedrooms: "",
        bathrooms: "",
        furnished: false,
        petFriendly: false,
        amenities: [],
        location: "",
    };

    it('FilterSidebar renders within budget', () => {
        const start = performance.now();

        render(
            <FilterSidebar />
        );

        const end = performance.now();
        const duration = end - start;

        console.log(`[Perf] FilterSidebar initial render: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(RENDER_BUDGET_MS);
    });
});
