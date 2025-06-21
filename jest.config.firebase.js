/**
 * Jest Configuration for Firebase Emulator Tests
 * 
 * Separate configuration to handle Firebase-specific polyfills and setup
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

// Firebase-specific Jest configuration
const firebaseJestConfig = {
  displayName: 'Firebase Integration Tests',
  testEnvironment: 'node', // Use node environment for Firebase emulator tests
  setupFilesAfterEnv: ['<rootDir>/jest-firebase.setup.js'],
  
  // Only run Firebase-related tests
  testMatch: [
    '<rootDir>/src/**/__tests__/integration/**/*firebase*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*firebase*.test.{js,jsx,ts,tsx}'
  ],
  
  // Module name mapping for Firebase
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform patterns to handle Firebase modules
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)',
  ],
  
  // Globals needed for Firebase in Node.js
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Timeout for Firebase operations
  testTimeout: 30000,
  
  verbose: true,
}

module.exports = createJestConfig(firebaseJestConfig)