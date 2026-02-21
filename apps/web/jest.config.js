/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    transform: {
        '^.+\\.(ts|tsx|js|mjs|jsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', module: 'commonjs', target: 'es2022', allowJs: true } }],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(@faker-js/faker)/)'
    ],
};

module.exports = config;
