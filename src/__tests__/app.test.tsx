import { render, screen } from '@testing-library/react'
import Home from '../app/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
    }
  },
}))

// Mock Firebase
jest.mock('../lib/firebase/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signOut: jest.fn(),
  },
  db: {},
}))

// Mock the Firebase auth context
jest.mock('../contexts/auth-context', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock the child components that might have complex dependencies
jest.mock('../components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    // Just check that the page renders without errors
    expect(document.body).toBeTruthy()
  })
})