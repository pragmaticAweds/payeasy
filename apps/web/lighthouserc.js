module.exports = {
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            startServerReadyPattern: 'ready on',
            url: ['http://localhost:3000'],
            numberOfRuns: 2,
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.85 }],
                'categories:accessibility': ['warn', { minScore: 0.90 }],
                'categories:best-practices': ['warn', { minScore: 0.90 }],
                'categories:seo': ['warn', { minScore: 0.90 }],
            },
            budgetFile: 'budget.json',
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
