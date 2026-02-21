import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormError from '@/components/forms/FormError';

// Mock lucide-react to avoid icon rendering issues in tests if any
jest.mock('lucide-react', () => ({
    AlertCircle: () => <svg data-testid="alert-icon" />
}));

describe('FormError Component', () => {
    it('renders correctly with a message', () => {
        render(<FormError message="Invalid email or password" />);

        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('returns null and does not render anything if no message is provided', () => {
        const { container } = render(<FormError />);

        expect(container).toBeEmptyDOMElement();
        expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });
});
