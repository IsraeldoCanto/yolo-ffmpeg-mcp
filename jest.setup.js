import '@testing-library/jest-dom'

// Mock Firebase for tests
jest.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      getIdToken: jest.fn().mockResolvedValue('mock-token')
    }
  },
  db: {},
  storage: {},
  firebaseConfig: {
    apiKey: 'test-api-key',
    authDomain: 'test.firebaseapp.com',
    projectId: 'test-project',
    storageBucket: 'test.appspot.com',
    messagingSenderId: '123456789',
    appId: 'test-app-id'
  }
}))

// Mock window.Elm for ELM tests
Object.defineProperty(window, 'Elm', {
  value: {
    Main: {
      init: jest.fn().mockReturnValue({
        ports: {
          saveKomposition: { subscribe: jest.fn() },
          loadKomposition: { send: jest.fn() },
          kompositionSaved: { send: jest.fn() },
          kompositionLoaded: { send: jest.fn() },
          firebaseError: { send: jest.fn() }
        }
      })
    }
  },
  writable: true
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
}))

// Suppress console.error for cleaner test output
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})