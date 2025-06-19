
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for test automation key first
    const urlParams = new URLSearchParams(window.location.search);
    const testKeyFromUrl = urlParams.get('test_key');
    const testAutomationKey = process.env.NEXT_PUBLIC_TEST_AUTOMATION_KEY;

    if (testAutomationKey && testKeyFromUrl === testAutomationKey) {
      console.warn('Authentication bypass active for test automation.');
      const mockUser: User = {
        uid: 'test-automation-user-uid',
        displayName: 'Test Automation User',
        email: 'test-automation@example.com',
        photoURL: 'https://placehold.co/100x100.png',
        emailVerified: true,
        isAnonymous: false,
        getIdToken: async () => 'mock-id-token-for-test-automation',
        getIdTokenResult: async () => ({
          token: 'mock-id-token-for-test-automation',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          claims: {} as any, 
          authTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(), 
          issuedAtTime: new Date().toISOString(),
          signInProvider: 'test',
          signInSecondFactor: null,
        }),
        reload: async () => {},
        toJSON: () => ({
          uid: 'test-automation-user-uid',
          displayName: 'Test Automation User',
          email: 'test-automation@example.com',
          photoURL: 'https://placehold.co/100x100.png',
          emailVerified: true,
          isAnonymous: false,
        }),
        delete: async () => {},
      } as User; 

      setUser(mockUser);
      setLoading(false);
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        router.push('/multimedia');
      }
      return; 
    }

    // Standard Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // console.log('Auth state changed, current user:', currentUser);
      // console.log('Effective authDomain from SDK:', auth.config.authDomain);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]); 

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
    } catch (error) {
      console.error("Error signing in with Google popup:", error);
      // Consider showing a toast to the user
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading to false
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      // setUser(null) will be handled by onAuthStateChanged
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out:", error);
      // Consider showing a toast to the user
    } finally {
      // setLoading(false); // onAuthStateChanged handles this
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
