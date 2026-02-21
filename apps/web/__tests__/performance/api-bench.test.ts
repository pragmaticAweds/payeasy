import { loginSchema } from '../../lib/validators/auth';

describe('Performance - API Benchmarks', () => {
    const ITERATIONS = 1000;
    const BUDGET_MS = 50; // max execution time for loginSchema.parse (1000 iterations)

    it('loginSchema parsing performs within budget', () => {
        const validData = {
            email: 'user1@example.com',
            password: 'securePassword123!',
        };

        const start = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            loginSchema.parse(validData);
        }
        const end = performance.now();
        const duration = end - start;

        console.log(`[Perf] loginSchema.parse (${ITERATIONS}x): ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(BUDGET_MS);
    });
});
