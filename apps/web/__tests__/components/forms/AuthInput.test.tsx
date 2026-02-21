import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AuthInput from '@/components/forms/AuthInput';

describe('AuthInput Component', () => {
    it('renders label and input correctly', () => {
        render(<AuthInput label="Email Address" id="email" name="email" />);

        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        const input = screen.getByRole('textbox', { name: 'Email Address' });
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'email');
        expect(input).toHaveAttribute('name', 'email');
    });

    it('renders with an error message and red border', () => {
        render(
            <AuthInput
                label="Password"
                id="password"
                type="password"
                error="Password is too short"
            />
        );

        expect(screen.getByText('Password is too short')).toBeInTheDocument();

        // Check if error class is applied
        const input = screen.getByLabelText('Password');
        expect(input).toHaveClass('border-red-500');
    });

    it('accepts and displays user input', async () => {
        const user = userEvent.setup();
        render(<AuthInput label="Username" id="user" name="user" />);

        const input = screen.getByRole('textbox', { name: 'Username' });
        await user.type(input, 'testuser');

        expect(input).toHaveValue('testuser');
    });

    it('applies custom className to input', () => {
        render(
            <AuthInput
                label="Test Input"
                id="test"
                className="test-custom-class"
            />
        );

        const input = screen.getByRole('textbox', { name: 'Test Input' });
        expect(input).toHaveClass('test-custom-class');
    });
});
