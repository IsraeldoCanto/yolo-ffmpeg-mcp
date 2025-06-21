/**
 * Jest Setup for Firebase Emulator Tests
 * 
 * Provides all necessary polyfills for Firebase to work in Node.js Jest environment
 */

// Import Node.js built-in modules
const { TextEncoder, TextDecoder } = require('util')

// Setup Web API polyfills for Node.js
Object.assign(global, {
  TextEncoder,
  TextDecoder,
  
  // Setup crypto for Firebase
  crypto: require('crypto').webcrypto || {
    getRandomValues: (arr) => require('crypto').randomFillSync(arr)
  },
  
  // Setup performance API
  performance: require('perf_hooks').performance,
  
  // Setup fetch using Node.js 18+ built-in fetch or undici fallback
  fetch: global.fetch || (() => {
    try {
      // Try Node.js 18+ built-in fetch first
      return globalThis.fetch
    } catch {
      // Fallback to a simple mock for Firebase emulator
      return jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
        text: jest.fn().mockResolvedValue(''),
      })
    }
  })(),
})

// Setup Firebase emulator environment variables
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081'
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099'
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199'

// Setup test timeout for Firebase operations
jest.setTimeout(30000)

// Suppress Firebase emulator connection logs during tests
const originalConsoleLog = console.log
console.log = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('emulator')) {
    return // Suppress emulator logs
  }
  originalConsoleLog.apply(console, args)
}