import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthButton from '@/components/forms/AuthButton';

describe('AuthButton Component', () => {
    it('renders correctly with children', () => {
        render(<AuthButton>Sign In</AuthButton>);
        const button = screen.getByRole('button', { name: 'Sign In' });
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
    });

    it('renders loader when isLoading is true and is disabled', () => {
        // We can test loader by checking for the lucide-react class or animate-spin
        render(<AuthButton isLoading>Sign In</AuthButton>);

        const button = screen.getByRole('button');
        expect(button).toBeDisabled();

        // Check for the animate-spin class which is applied to the Loader2 icon
        const loader = button.querySelector('svg');
        expect(loader).toHaveClass('animate-spin');
    });

    it('is disabled when disabled prop is provided', () => {
        render(<AuthButton disabled>Sign In</AuthButton>);
        const button = screen.getByRole('button', { name: 'Sign In' });
        expect(button).toBeDisabled();
    });

    it('calls onClick when clicked and not disabled', () => {
        const mockOnClick = jest.fn();
        render(<AuthButton onClick={mockOnClick}>Sign In</AuthButton>);

        const button = screen.getByRole('button', { name: 'Sign In' });
        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
        render(<AuthButton className="custom-test-class">Sign In</AuthButton>);
        const button = screen.getByRole('button', { name: 'Sign In' });
        expect(button).toHaveClass('custom-test-class');
    });
});
