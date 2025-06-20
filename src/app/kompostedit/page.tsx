
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
        // If script tag exists, assume it might already be loaded or in process
        // We'll rely on the check for Elm.Main.init to confirm.
        // Forcing elmScriptLoaded to true here might be too early if script is still fetching/executing.
        // Let's ensure the check below still happens.
        // If Elm.Main.init is already there, the onload handler logic can set elmScriptLoaded.
        // If not, and the script is already in DOM, this effect won't re-add it.
        // This scenario needs careful handling.
        // A simple approach: if script tag exists, check Elm.Main.init directly.
        if ((window as any).Elm?.Main?.init) {
            console.log('Elm script tag already exists and Elm.Main.init is available.');
             (window as any).KOMPOST_CONFIG = {
                elm: { available: true, version: '1.0.0' },
                integration: { type: 'nextjs-elm-hybrid', firebase: true, couchdb_compatible: true }
            };
            setElmScriptLoaded(true);
            return;
        } else if (document.querySelector('script[src="/elm/kompost.js"]')) {
            console.log('Elm script tag already exists but Elm.Main.init is not yet available. Waiting for its onload or error.');
            // The script's own onload should handle setting elmScriptLoaded.
            // If it's already loaded and failed, this won't help.
            // This is complex. For now, we assume if script tag is there, its onload will eventually fire or has fired.
            // The main logic below will add it if it's not.
        }
      }

      const script = document.createElement('script');
      script.src = '/elm/kompost.js';
      
      script.onload = () => {
        console.log('ELM script onload triggered. Checking for Elm.Main.init after a brief delay...');
        // Defer this check slightly to give Elm script a chance to fully execute its internal setup.
        setTimeout(() => {
            if ((window as any).Elm?.Main?.init) {
                console.log('Elm.Main.init found.');
                (window as any).KOMPOST_CONFIG = {
                    elm: {
                        available: true,
                        version: '1.0.0' 
                    },
                    integration: {
                        type: 'nextjs-elm-hybrid',
                        firebase: true,
                        couchdb_compatible: true
                    }
                };
                setElmScriptLoaded(true);
            } else {
                console.error('Elm.Main.init NOT found after script load and delay. Check kompost.js contents and export.');
                setElmError('Elm application (Elm.Main.init) not found after script load. Ensure kompost.js is valid and exports Elm.Main.init globally.');
                setElmScriptLoaded(false); 
            }
        }, 0); // Zero-delay setTimeout to allow event loop to process.
      };
      
      script.onerror = () => {
        console.error('Failed to load ELM script from /elm/kompost.js');
        setElmError('Failed to load ELM script. Check network and file path.');
        setElmScriptLoaded(false);
      };
      document.head.appendChild(script);
    };

    loadElmScript();
    
    // Cleanup: remove script if component unmounts before it loads?
    // This can be tricky; for now, we assume the script is small and loads quickly,
    // or if it fails, onerror handles it.
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
          // This error is now more likely if script.onload logic determined Elm.Main.init wasn't truly ready.
          throw new Error('Elm application not found. Please ensure kompost.js is loaded and initialized correctly.');
        }

        if (elmRef.current && !elmAppRef.current) {
          // Initialize Elm app with Firebase auth context
          const app = (window as any).Elm.Main.init({
            node: elmRef.current,
            flags: {
              apiToken: firebaseToken || 'anonymous',
              userProfile: user ? {
                id: user.uid,
                email: user.email,
                displayName: user.displayName || user.email,
                photoURL: user.photoURL || ''
              } : null,
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
              authMode: 'firebase_shell',
              skipAuth: true
            }
          });

          elmAppRef.current = app;

          if (app.ports) {
            if (app.ports.kompositionUpdated) {
              app.ports.kompositionUpdated.subscribe((updatedKomposition: any) => {
                console.log('Received komposition update from Elm:', updatedKomposition);
              });
            }
            if (app.ports.saveKomposition) {
              app.ports.saveKomposition.subscribe((kompositionData: any) => {
                console.log('Elm requested save:', kompositionData);
              });
            }
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

    if ((firebaseToken || !user) && elmScriptLoaded) {
      loadElmApp();
    }

    return () => {
      if (elmAppRef.current && elmRef.current) {
        // Elm apps don't typically have a formal 'destroy' or 'unmount' method.
        // Clearing the innerHTML of the node is a common way to clean up.
        elmRef.current.innerHTML = '';
        elmAppRef.current = null;
        setIsElmLoaded(false);
        console.log('Elm app node cleared.');
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
                  Script Loaded State (elmScriptLoaded): {String(elmScriptLoaded)}<br/>
                  Firebase Token: {firebaseToken ? 'Available' : 'Not Available'}<br/>
                  User: {user ? 'Signed In' : 'Not Signed In'}<br/>
                  Window.Elm typeof: {String(typeof (window as any)?.Elm)}<br/>
                  Window.Elm.Main typeof: {String(typeof (window as any)?.Elm?.Main)}<br/>
                  Window.Elm.Main.init typeof: {String(typeof (window as any)?.Elm?.Main?.init)}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Integration Instructions</summary>
                  <div className="mt-2 text-sm text-muted-foreground space-y-2">
                    <p>To enable the Elm editor, you need to:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Build the Elm application: <code className="bg-muted px-1 rounded">elm make src/Main.elm --output=public/elm/kompost.js</code></li>
                      <li>Ensure the <code className="bg-muted px-1 rounded">kompost.js</code> file is in the <code className="bg-muted px-1 rounded">public/elm/</code> directory.</li>
                      <li>Verify the Elm app (Main.elm) correctly initializes and exports the necessary ports and init function.</li>
                    </ol>
                    <p className="mt-2">
                      The symlink to the Elm project should be: <code className="bg-muted px-1 rounded">elm-kompostedit → /Users/stiglau/utvikling/privat/ElmMoro/kompostedit</code> (if applicable to your setup).
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
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  Script Loaded State (elmScriptLoaded): {String(elmScriptLoaded)}<br/>
                  Firebase Token: {firebaseToken ? 'Available' : 'Not Available'}<br/>
               </div>
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

      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              <span className="font-semibold">KompostEdit Integration:</span>
              {isElmLoaded && !elmError ? (
                <span className="ml-2 text-green-600">✓ Connected</span>
              ) : elmError ? (
                <span className="ml-2 text-red-600">✗ Error</span>
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

    