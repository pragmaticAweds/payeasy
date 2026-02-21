import { loginSchema, registerSchema } from '@/lib/validators/auth';

describe('Auth Validators', () => {
    describe('loginSchema', () => {
        it('validates a correct email and password', () => {
            const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' });
            expect(result.success).toBe(true);
        });

        it('rejects an invalid email', () => {
            const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Invalid email address');
            }
        });

        it('rejects a short password', () => {
            const result = loginSchema.safeParse({ email: 'test@example.com', password: '123' });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
            }
        });
    });

    describe('registerSchema', () => {
        it('validates a complete valid registration payload', () => {
            const result = registerSchema.safeParse({
                username: 'testuser_1',
                email: 'test@example.com',
                password: 'password123',
                walletAddress: 'GDX...XYZ',
            });
            expect(result.success).toBe(true);
        });

        it('validates without the optional walletAddress', () => {
            const result = registerSchema.safeParse({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.success).toBe(true);
        });

        it('rejects invalid username characters', () => {
            const result = registerSchema.safeParse({
                username: 'test-user!',
                email: 'test@example.com',
                password: 'password123',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('Username can only contain letters, numbers, and underscores');
            }
        });
    });
});
