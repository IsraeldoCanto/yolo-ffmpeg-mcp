
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase/firebase';
import { signInWithRedirect, signOut as firebaseSignOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Check for redirect result on initial load
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        setLoading(true);
        // The redirect result is null if the app is not loaded after a redirect from Google.
        // It contains user credential if the app is loaded after a redirect from Google.
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setUser(result.user);
          // router.push('/tracks'); // onAuthStateChanged should handle this too
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        // Handle specific errors like auth/account-exists-with-different-credential if needed
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, [router]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // No need to await signInWithRedirect as it navigates away
      await signInWithRedirect(auth, googleProvider);
      // The user will be redirected to Google.
      // After successful sign-in, they will be redirected back to your app.
      // The onAuthStateChanged listener and getRedirectResult will handle the user state.
    } catch (error) {
      console.error("Error initiating sign in with Google redirect:", error);
      // Optionally show a toast message here
      setLoading(false); // Only set loading to false if an error occurs *before* redirect
    }
    // setLoading(false) is not typically needed here as the page will redirect.
    // If there's an immediate error before redirect, catch block handles it.
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push('/'); 
    } catch (error) {
      console.error("Error signing out:", error);
      // Optionally show a toast message here
    } finally {
      setLoading(false);
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

