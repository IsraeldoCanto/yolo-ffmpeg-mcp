/**
 * Jest Setup for Firebase Emulator Tests
 */

// Setup Node.js polyfills for Firebase
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Setup simple fetch mock instead of full polyfill
global.fetch = jest.fn()

// Setup test timeout for Firebase operations  
jest.setTimeout(30000)