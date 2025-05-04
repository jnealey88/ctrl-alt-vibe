import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@db$': '<rootDir>/db/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  },
  // Add test match patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.spec.(ts|tsx)',
    '<rootDir>/__tests__/**/*.test.(ts|tsx)'
  ],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  // Test coverage
  collectCoverageFrom: [
    '<rootDir>/server/**/*.{ts,tsx}',
    '<rootDir>/client/src/**/*.{ts,tsx}',
    '!<rootDir>/client/src/main.tsx',
    '!<rootDir>/server/index.ts',
    '!<rootDir>/**/*.d.ts'
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  // Add test environments for React components
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/server/**/*.test.(ts|tsx)']
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/__tests__/client/**/*.test.(ts|tsx)']
    }
  ]
};

export default config;