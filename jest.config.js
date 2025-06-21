const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
<<<<<<< HEAD
=======
    // Mock lucide-react for tests
>>>>>>> a9a1a5d (Complete GitHub Actions CI/CD pipeline integration and Firebase kompost functionality)
    'lucide-react': '<rootDir>/src/__mocks__/lucide-react.js',
  },
  testEnvironment: 'jest-environment-jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
<<<<<<< HEAD
    '!src/app/api/**',
    '!src/components/ui/**', // Exclude UI library components
    '!src/ai/**', // Exclude AI flows that require external services
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    // Require higher coverage for critical modules
    './src/services/elmPortHandler.ts': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/firebaseKompostService.ts': {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
=======
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
>>>>>>> a9a1a5d (Complete GitHub Actions CI/CD pipeline integration and Firebase kompost functionality)
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
<<<<<<< HEAD
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/app/kompostedit/__tests__/page.test.tsx'
  ],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
=======
>>>>>>> a9a1a5d (Complete GitHub Actions CI/CD pipeline integration and Firebase kompost functionality)
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)