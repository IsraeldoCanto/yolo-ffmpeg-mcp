
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Kompost Mixer',
  description: 'A multimedia database and mixer application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        
        {/* ELM KompostEdit Integration */}
        <script src="/elm/kompost.js"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Global configuration for Elm integration
            window.KOMPOST_CONFIG = {
              elm: {
                available: typeof window !== 'undefined' && typeof window.Elm !== 'undefined' && window.Elm.Main,
                version: '1.0.0'
              },
              integration: {
                type: 'nextjs-elm-hybrid',
                firebase: true,
                couchdb_compatible: true
              }
            };
            
            if (typeof window !== 'undefined' && !window.KOMPOST_CONFIG.elm.available) {
              console.warn('Elm application not loaded. Elm editor will show integration instructions.');
            }
          `
        }} />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
