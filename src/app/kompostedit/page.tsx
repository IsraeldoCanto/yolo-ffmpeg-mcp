'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ElmApp {
  ports?: {
    kompositionUpdated?: { subscribe: (callback: (data: any) => void) => void };
    saveKomposition?: { subscribe: (callback: (data: any) => void) => void };
    loadKomposition?: { send: (data: any) => void };
    firebaseTokenUpdated?: { send: (token: string) => void };
  };
}

export default function KompostEditPage() {
  const { user } = useAuth();
  const elmRef = useRef<HTMLDivElement>(null);
  const elmAppRef = useRef<ElmApp | null>(null);
  const [isElmLoaded, setIsElmLoaded] = useState(false);
  const [elmError, setElmError] = useState<string | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [elmScriptLoaded, setElmScriptLoaded] = useState(false);

  // Load ELM script dynamically
  useEffect(() => {
    const loadElmScript = () => {
      if (document.querySelector('script[src="/elm/kompost.js"]')) {
        setElmScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = '/elm/kompost.js';
      script.onload = () => {
        console.log('🟢 ELM script onload triggered');
        
        // Wait a bit for the script to execute and export
        setTimeout(() => {
          console.log('🟢 Checking after timeout...');
          console.log('🟢 window.Elm:', (window as any).Elm);
          console.log('🟢 window.Elm.Main:', (window as any).Elm?.Main);
          console.log('🟢 typeof window.Elm:', typeof (window as any).Elm);
          console.log('🟢 Object.keys(window):', Object.keys(window).filter(k => k.includes('Elm') || k.includes('elm')));
          
          // Check if ELM is available in any form
          const elmAvailable = !!(window as any).Elm?.Main;
          
          if (!elmAvailable) {
            console.log('🔴 ELM not found in window, checking script execution...');
            // Try to manually trigger the script's IIFE
            try {
              // The script might need the global `this` context
              eval(`
                console.log('🟡 Attempting manual execution...');
                if (typeof Elm !== 'undefined') {
                  window.Elm = Elm;
                  console.log('🟡 Found Elm in local scope, assigned to window');
                }
              `);
            } catch (e) {
              console.log('🔴 Manual execution failed:', e);
            }
          }
          
          // Set up global config after script loads
          (window as any).KOMPOST_CONFIG = {
            elm: {
              available: !!(window as any).Elm?.Main,
              version: '1.0.0'
            },
            integration: {
              type: 'nextjs-elm-hybrid',
              firebase: true,
              couchdb_compatible: true
            }
          };
          
          console.log('🟢 Final ELM status:', !!(window as any).Elm?.Main);
          setElmScriptLoaded(true);
        }, 100);
      };
      script.onerror = () => {
        setElmError('Failed to load ELM script');
        setElmScriptLoaded(false);
      };
      document.head.appendChild(script);
    };

    loadElmScript();
  }, []);

  // Get Firebase ID token when user changes
  useEffect(() => {
    const fetchToken = async () => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setFirebaseToken(token);
        } catch (error) {
          console.error('Error getting Firebase ID token:', error);
          setFirebaseToken(null);
        }
      } else {
        setFirebaseToken(null);
      }
    };

    fetchToken();
  }, [user]);

  useEffect(() => {
    // Load Elm application
    const loadElmApp = async () => {
      try {
        // Check if Elm is available globally
        if (typeof window === 'undefined' || !(window as any).Elm?.Main?.init) {
          throw new Error('Elm application not found. Please ensure kompost.js is loaded.');
        }

        if (elmRef.current && !elmAppRef.current) {
          // Initialize Elm app with Firebase auth context
          const app = (window as any).Elm.Main.init({
            node: elmRef.current,
            flags: {
              // Pass Firebase ID token for authentication
              apiToken: firebaseToken || 'anonymous',
              // Pass user info to Elm
              userProfile: user ? {
                id: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                photoURL: user.photoURL || ''
              } : null,
              // Firebase API endpoints
              kompoUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? 
                `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/api/kompositions` : 
                'http://localhost:5001/kompost-mixer/us-central1/api/kompositions',
              metaUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? 
                `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/api/meta` : 
                'http://localhost:5001/kompost-mixer/us-central1/api/meta',
              cacheUrl: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? 
                `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/api/cache` : 
                'http://localhost:5001/kompost-mixer/us-central1/api/cache',
              integrationDestination: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? 
                `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/api/process` : 
                'http://localhost:5001/kompost-mixer/us-central1/api/process',
              integrationFormat: 'json',
              // Authentication mode
              authMode: 'firebase_shell',
              skipAuth: true
            }
          });

          elmAppRef.current = app;

          // Set up Elm ports for communication
          if (app.ports) {
            // Listen for komposition updates from Elm
            if (app.ports.kompositionUpdated) {
              app.ports.kompositionUpdated.subscribe((updatedKomposition: any) => {
                console.log('Received komposition update from Elm:', updatedKomposition);
                // Could save to Firebase here
              });
            }

            // Listen for save requests from Elm
            if (app.ports.saveKomposition) {
              app.ports.saveKomposition.subscribe((kompositionData: any) => {
                console.log('Elm requested save:', kompositionData);
                // Could save to Firebase/Firestore here
              });
            }

            // Send Firebase auth token updates to Elm
            if (app.ports.firebaseTokenUpdated && firebaseToken) {
              app.ports.firebaseTokenUpdated.send(firebaseToken);
            }
          }

          setIsElmLoaded(true);
          setElmError(null);
        }
      } catch (error) {
        console.error('Failed to load Elm application:', error);
        setElmError(error instanceof Error ? error.message : 'Unknown error loading Elm app');
        setIsElmLoaded(false);
      }
    };

    // Only load Elm when we have a Firebase token (or no user) AND the script is loaded
    if ((firebaseToken || !user) && elmScriptLoaded) {
      loadElmApp();
    }

    // Cleanup on unmount
    return () => {
      if (elmAppRef.current && elmRef.current) {
        elmRef.current.innerHTML = '';
        elmAppRef.current = null;
        setIsElmLoaded(false);
      }
    };
  }, [user, firebaseToken, elmScriptLoaded]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access KompostEdit.</p>
          <Link href="/">
            <Button>Go to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/multimedia">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Multimedia
                </Button>
              </Link>
              <h1 className="text-xl font-semibold">KompostEdit</h1>
              {isElmLoaded && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  ✓ Active
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Elm Editor Integration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {elmError ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">Elm Editor Error</h3>
                <p className="text-destructive/80 mt-1">{elmError}</p>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <strong>Debug Info:</strong><br/>
                  Script Loaded: {String(elmScriptLoaded)}<br/>
                  Firebase Token: {firebaseToken ? 'Available' : 'Not Available'}<br/>
                  User: {user ? 'Signed In' : 'Not Signed In'}<br/>
                  Window.Elm: {String(typeof (window as any)?.Elm)}<br/>
                  Elm.Main: {String(typeof (window as any)?.Elm?.Main)}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Integration Instructions</summary>
                  <div className="mt-2 text-sm text-muted-foreground space-y-2">
                    <p>To enable the Elm editor, you need to:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Build the Elm application: <code className="bg-muted px-1 rounded">elm make src/Main.elm --output=public/elm/kompost.js</code></li>
                      <li>Ensure the Elm scripts are loaded in the layout</li>
                      <li>Verify the Elm app exposes the required ports for Next.js communication</li>
                    </ol>
                    <p className="mt-2">
                      The symlink to the Elm project should be: <code className="bg-muted px-1 rounded">elm-kompostedit → /Users/stiglau/utvikling/privat/ElmMoro/kompostedit</code>
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        ) : !isElmLoaded ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Elm Editor...</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
            <div 
              ref={elmRef} 
              className="elm-editor"
              style={{ 
                width: '100%', 
                minHeight: '600px'
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <span className="font-semibold">KompostEdit Integration:</span>
              {isElmLoaded ? (
                <span className="ml-2 text-green-600">✓ Connected</span>
              ) : (
                <span className="ml-2 text-yellow-600">⚡ Loading</span>
              )}
            </div>
            <div>
              Next.js + Elm + Firebase
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}