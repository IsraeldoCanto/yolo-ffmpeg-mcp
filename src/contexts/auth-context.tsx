
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, googleProvider } from '@/lib/firebase/firebase';
import { signInWithRedirect, signOut as firebaseSignOut, onAuthStateChanged, UserCredential, getRedirectResult } from 'firebase/auth';
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
      console.log('Auth state changed, current user:', currentUser);
      // console.log('Effective authDomain from SDK:', auth.config.authDomain); // Diagnostic log
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle redirect result
  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("Redirect result processed, user:", result.user);
          setUser(result.user);
          // router.push('/tracks'); // onAuthStateChanged should also handle this
        }
      } catch (error) {
        console.error("Error processing redirect result:", error);
        // Handle specific errors like auth/account-exists-with-different-credential
        // Potentially show a toast message to the user
      } finally {
        // Ensure loading is set to false after processing,
        // even if onAuthStateChanged might also set it.
        // This handles cases where onAuthStateChanged might fire before or after.
        setLoading(false);
      }
    };

    processRedirectResult();
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
      console.error("Error initiating Google sign-in with redirect:", error);
      // Optionally show a toast message here
      setLoading(false); // Ensure loading is false if redirect fails immediately
    }
    // setLoading(false) is typically not needed here because the page unloads.
    // However, if there's an immediate error before redirect, it should be set.
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

