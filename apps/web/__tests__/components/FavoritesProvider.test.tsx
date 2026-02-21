import React, { useEffect } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FavoritesProvider, { useFavoritesContext } from '@/components/FavoritesProvider';
import { createClient } from '@/lib/superbase/client';

// Mock next/navigation
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockRouterPush }),
    usePathname: () => '/'
}));

jest.mock('@/lib/superbase/client', () => ({
    createClient: jest.fn(),
}));

const mockGetUser = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
        auth: {
            getUser: mockGetUser,
        },
    });
    global.fetch = jest.fn();
});

beforeAll(() => {
    // nothing to mock for window.location anymore!
});

afterAll(() => {
    jest.restoreAllMocks();
});

const TestConsumer = () => {
    const { isFavorited, toggleFavorite, isAuthenticated, isLoading } = useFavoritesContext();
    return (
        <div>
            <div data-testid="auth-state">{isAuthenticated ? 'Auth' : 'NoAuth'}</div>
            <div data-testid="load-state">{isLoading ? 'Loading' : 'Loaded'}</div>
            <div data-testid="fav-state">{isFavorited('l1') ? 'Fav' : 'NotFav'}</div>
            <button onClick={() => toggleFavorite('l1')}>Toggle</button>
        </div>
    );
};

describe('FavoritesProvider', () => {
    it('throws error when useFavoritesContext is used outside provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestConsumer />)).toThrow(
            'useFavoritesContext must be used within a FavoritesProvider'
        );
        consoleError.mockRestore();
    });

    it('initializes as unauthenticated when no user is found', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        expect(screen.getByTestId('load-state')).toHaveTextContent('Loading');
        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });
        expect(screen.getByTestId('auth-state')).toHaveTextContent('NoAuth');
        expect(screen.getByTestId('fav-state')).toHaveTextContent('NotFav');
    });

    it('fetches favorites on init when user is logged in', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ listing_id: 'l1' }] }),
        });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });

        expect(screen.getByTestId('auth-state')).toHaveTextContent('Auth');
        expect(screen.getByTestId('fav-state')).toHaveTextContent('Fav');
    });

    it('redirects to login when toggling an unauthenticated state', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: null } });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

        expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });

    it('optimistically updates favorite and calls post api', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }), // Initially not favorited
        });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });

        expect(screen.getByTestId('fav-state')).toHaveTextContent('NotFav');

        // Setting up the fetch mock for toggle
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

        // Optimistically updated
        expect(screen.getByTestId('fav-state')).toHaveTextContent('Fav');
        expect(global.fetch).toHaveBeenLastCalledWith('/api/listings/l1/favorite', { method: 'POST' });
    });

    it('rolls back completely if toggle API fails', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [] }),
        });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });

        // Toggle Api fails
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

        // Reverted back to NotFav
        await waitFor(() => {
            expect(screen.getByTestId('fav-state')).toHaveTextContent('NotFav');
        });
    });

    it('rolls back if toggle API throws network error', async () => {
        mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } });
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: [{ listing_id: 'l1' }] }),
        });

        render(
            <FavoritesProvider>
                <TestConsumer />
            </FavoritesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('load-state')).toHaveTextContent('Loaded');
        });

        expect(screen.getByTestId('fav-state')).toHaveTextContent('Fav');

        // Toggle throws network error
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));

        // Reverted to Fav (since it failed to remove)
        await waitFor(() => {
            expect(screen.getByTestId('fav-state')).toHaveTextContent('Fav');
        });
    });
});
