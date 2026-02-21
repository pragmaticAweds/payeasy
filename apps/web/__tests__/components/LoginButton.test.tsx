import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginButton from '@/components/LoginButton';
import freighterApi from '@stellar/freighter-api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        refresh: jest.fn(),
    })),
}));

// Mock freighter api
jest.mock('@stellar/freighter-api', () => ({
    isConnected: jest.fn(),
    getPublicKey: jest.fn(),
    signBlob: jest.fn(),
}));

describe('LoginButton Component', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('renders correctly', () => {
        render(<LoginButton />);
        expect(screen.getByRole('button', { name: /Sign in with Stellar/i })).toBeInTheDocument();
    });

    it('shows error if Freighter is not connected', async () => {
        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(false);

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Freighter wallet not found. Please install the Freighter browser extension.')).toBeInTheDocument();
        });

        expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
    });

    it('shows error if public key cannot be retrieved', async () => {
        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(true);
        (freighterApi.getPublicKey as jest.Mock).mockResolvedValueOnce(''); // Empty string or null

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Could not retrieve public key from Freighter.')).toBeInTheDocument();
        });
    });

    it('shows error if challenge request fails', async () => {
        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(true);
        (freighterApi.getPublicKey as jest.Mock).mockResolvedValueOnce('GBTESTPUBLICKEY');

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: { message: 'Failed to generate challenge' } }),
        });

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Failed to generate challenge')).toBeInTheDocument();
        });
    });

    it('shows error if signing is cancelled', async () => {
        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(true);
        (freighterApi.getPublicKey as jest.Mock).mockResolvedValueOnce('GBTESTPUBLICKEY');

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { message: 'Sign me', nonce: '123', timestamp: 123456 } }),
        });

        (freighterApi.signBlob as jest.Mock).mockResolvedValueOnce(''); // User cancelled

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Signing was cancelled or returned empty.')).toBeInTheDocument();
        });
    });

    it('shows error if verification fails', async () => {
        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(true);
        (freighterApi.getPublicKey as jest.Mock).mockResolvedValueOnce('GBTESTPUBLICKEY');

        // Challenge mock
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { message: 'Sign me', nonce: '123', timestamp: 123456 } }),
        });

        // Sign mock
        (freighterApi.signBlob as jest.Mock).mockResolvedValueOnce('SIGNEDBLOB');

        // Verification mock
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: { message: 'Invalid signature' } }),
        });

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Invalid signature')).toBeInTheDocument();
        });
    });

    it('successfully logs in and displays public key', async () => {
        jest.useFakeTimers();

        const mockRefresh = jest.fn();
        (require('next/navigation').useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });

        (freighterApi.isConnected as jest.Mock).mockResolvedValueOnce(true);
        (freighterApi.getPublicKey as jest.Mock).mockResolvedValueOnce('GBTESTPUBLICKEYABCD1234');

        // Challenge mock
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ data: { message: 'Sign me', nonce: '123', timestamp: 123456 } }),
        });

        // Sign mock
        (freighterApi.signBlob as jest.Mock).mockResolvedValueOnce('SIGNEDBLOB');

        // Verification mock
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<LoginButton />);

        const button = screen.getByRole('button', { name: /Sign in with Stellar/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Signed in ✓')).toBeInTheDocument();
        });

        // Check if public key format GBT...1234 is displayed correctly mapped: "GBTEST…1234"
        expect(screen.getByText('GBTEST…1234')).toBeInTheDocument();

        // Verify page reload happens after 1000ms
        jest.advanceTimersByTime(1000);
        expect(mockRefresh).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
});
