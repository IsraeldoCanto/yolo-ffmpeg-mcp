/**
 * KompostEdit Page Component Tests
 * 
 * Integration tests for the React component that hosts the ELM editor
 * and manages Firebase authentication and port communication.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useAuth } from '@/contexts/auth-context'
import KompostEditPage from '../page'
import { elmPortHandler } from '@/services/elmPortHandler'
import type { User } from 'firebase/auth'

interface MockUser extends Partial<User> {
  uid: string
  email: string
  getIdToken: jest.Mock
  emailVerified: boolean
  isAnonymous: boolean
  metadata: any
  providerData: any[]
  refreshToken: string
  tenantId: string | null
  delete: jest.Mock
  getIdTokenResult: jest.Mock
  reload: jest.Mock
  toJSON: jest.Mock
  displayName: string | null
  photoURL: string | null
  phoneNumber: string | null
  providerId: string
}

interface MockAuthContextType {
  user: MockUser | null
  loading: boolean
  signInWithGoogle: jest.Mock
  signOut: jest.Mock
}

// Mock the auth context
jest.mock('@/contexts/auth-context')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/kompostedit',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the ELM port handler
jest.mock('@/services/elmPortHandler', () => ({
  elmPortHandler: {
    setupPorts: jest.fn(),
    cleanup: jest.fn(),
    createNewKomposition: jest.fn(),
  }
}))

// Mock Firebase service
jest.mock('@/services/firebaseKompostService', () => ({
  firebaseKompostService: {
    getRecentKompositions: jest.fn().mockResolvedValue([]),
    searchKompositions: jest.fn().mockResolvedValue([]),
  }
}))

describe('KompostEditPage Component Integration Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    getIdToken: jest.fn().mockResolvedValue('mock-firebase-token'),
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: 'mock-refresh-token',
    tenantId: null,
    delete: jest.fn(),
    getIdTokenResult: jest.fn(),
    reload: jest.fn(),
    toJSON: jest.fn(),
    displayName: 'Test User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'google.com',
  } as MockUser

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset global ELM mock
    delete (global as any).window
    ;(global as any).window = {
      Elm: undefined,
      KOMPOST_CONFIG: undefined,
    }
    
    // Mock document methods
    global.document.createElement = jest.fn().mockReturnValue({
      src: '',
      onload: null,
      onerror: null,
    })
    Object.defineProperty(global.document, 'head', {
      value: { appendChild: jest.fn() },
      writable: true,
    })
    global.document.querySelector = jest.fn().mockReturnValue(null)
  })

  describe('Authentication States', () => {
    test('should show authentication required when user is not signed in', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })

      render(<KompostEditPage />)

      expect(screen.getByText('Authentication Required')).toBeInTheDocument()
      expect(screen.getByText('Please sign in to access KompostEdit.')).toBeInTheDocument()
      expect(screen.getByText('Go to Sign In')).toBeInTheDocument()
    })

    test('should show loading state when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })

      render(<KompostEditPage />)

      // Should not show auth required during loading
      expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument()
    })

    test('should render ELM editor interface when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })

      render(<KompostEditPage />)

      expect(screen.getByText('KompostEdit')).toBeInTheDocument()
      expect(screen.getByText('Back to Multimedia')).toBeInTheDocument()
    })
  })

  describe('ELM Script Loading', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })
    })

    test('should show loading state while ELM script loads', () => {
      render(<KompostEditPage />)

      expect(screen.getByText('Loading ELM script...')).toBeInTheDocument()
    })

    test('should show error state when ELM script fails to load', async () => {
      // Mock script creation to trigger error
      const mockScript = {
        src: '',
        onload: null,
        onerror: jest.fn(),
      }
      global.document.createElement = jest.fn().mockReturnValue(mockScript)

      render(<KompostEditPage />)

      // Simulate script error
      if (mockScript.onerror) {
        mockScript.onerror({} as any)
      }

      await waitFor(() => {
        expect(screen.getByText('Elm Editor Error')).toBeInTheDocument()
      })
    })

    test('should initialize ELM app when script loads successfully', async () => {
      // Mock successful ELM script load
      const mockElmApp = {
        ports: {
          saveKomposition: { subscribe: jest.fn() },
          loadKomposition: { subscribe: jest.fn() },
          firebaseTokenUpdated: { send: jest.fn() },
        }
      }

      // Mock global ELM availability
      ;(global as any).window.Elm = {
        Main: {
          init: jest.fn().mockReturnValue(mockElmApp)
        }
      }

      const mockScript = {
        src: '',
        onload: jest.fn(),
        onerror: null,
      }
      global.document.createElement = jest.fn().mockReturnValue(mockScript)

      render(<KompostEditPage />)

      // Simulate successful script load
      if (mockScript.onload) {
        mockScript.onload({} as any)
      }

      await waitFor(() => {
        expect(elmPortHandler.setupPorts).toHaveBeenCalledWith(mockElmApp)
      })
    })
  })

  describe('Firebase Integration', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })

      // Mock ELM as loaded
      ;(global as any).window.Elm = {
        Main: {
          init: jest.fn().mockReturnValue({
            ports: {
              firebaseTokenUpdated: { send: jest.fn() },
            }
          })
        }
      }
    })

    test('should display Firebase connection status', async () => {
      render(<KompostEditPage />)

      await waitFor(() => {
        expect(screen.getByText('🔥 Firebase Connected')).toBeInTheDocument()
      })
    })

    test('should call getIdToken to retrieve Firebase auth token', async () => {
      render(<KompostEditPage />)

      await waitFor(() => {
        expect(mockUser.getIdToken).toHaveBeenCalled()
      })
    })
  })

  describe('Action Buttons', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })

      // Mock ELM as fully loaded
      ;(global as any).window.Elm = {
        Main: {
          init: jest.fn().mockReturnValue({
            ports: {
              firebaseTokenUpdated: { send: jest.fn() },
            }
          })
        }
      }
    })

    test('should show action buttons when ELM is loaded and Firebase connected', async () => {
      render(<KompostEditPage />)

      await waitFor(() => {
        expect(screen.getByText('New')).toBeInTheDocument()
        expect(screen.getByText('Recent')).toBeInTheDocument()
        expect(screen.getByText('Search')).toBeInTheDocument()
      })
    })

    test('should call createNewKomposition when New button is clicked', async () => {
      render(<KompostEditPage />)

      await waitFor(() => {
        const newButton = screen.getByText('New')
        fireEvent.click(newButton)
      })

      expect(elmPortHandler.createNewKomposition).toHaveBeenCalledWith('New Music Video')
    })

    test('should trigger search when Search button is clicked', async () => {
      // Mock window.prompt
      global.prompt = jest.fn().mockReturnValue('test search query')

      render(<KompostEditPage />)

      await waitFor(() => {
        const searchButton = screen.getByText('Search')
        fireEvent.click(searchButton)
      })

      expect(global.prompt).toHaveBeenCalledWith('Search kompositions:')
    })
  })

  describe('Component Lifecycle', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })
    })

    test('should cleanup ELM port handler on unmount', () => {
      const { unmount } = render(<KompostEditPage />)

      unmount()

      expect(elmPortHandler.cleanup).toHaveBeenCalled()
    })

    test('should log build info on component mount', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      render(<KompostEditPage />)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🏗️ KompostEdit BUILD INFO:'),
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })
    })

    test('should display debug information in error state', async () => {
      render(<KompostEditPage />)

      // Force error state by not providing ELM
      await waitFor(() => {
        expect(screen.getByText('Debug Info:')).toBeInTheDocument()
        expect(screen.getByText(/Script Loaded State/)).toBeInTheDocument()
        expect(screen.getByText(/Firebase Token:/)).toBeInTheDocument()
      })
    })

    test('should show integration instructions in error state', async () => {
      render(<KompostEditPage />)

      await waitFor(() => {
        const detailsElement = screen.getByText('Integration Instructions')
        fireEvent.click(detailsElement)
        
        expect(screen.getByText('To enable the Elm editor, you need to:')).toBeInTheDocument()
        expect(screen.getByText(/elm make src\/Main.elm/)).toBeInTheDocument()
      })
    })
  })

  describe('Build Info Footer', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn(),
      })
    })

    test('should display build information in footer', () => {
      render(<KompostEditPage />)

      expect(screen.getByText(/Next.js \+ Elm \+ Firebase/)).toBeInTheDocument()
      expect(screen.getByText(/Build:/)).toBeInTheDocument()
    })

    test('should show integration status in footer', () => {
      render(<KompostEditPage />)

      expect(screen.getByText('KompostEdit Integration:')).toBeInTheDocument()
    })
  })
})