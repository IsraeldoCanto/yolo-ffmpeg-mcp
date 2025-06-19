'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { Loader2, Music2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/tracks');
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Music2 className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold text-primary font-headline mb-4">
        Kompost Mixer
      </h1>
      <p className="text-xl text-foreground mb-12 max-w-md">
        Your personal music track database. Organize, find, and manage your audio effortlessly.
      </p>
      <GoogleSignInButton />
       <footer className="absolute bottom-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Kompost Mixer. All rights reserved.
      </footer>
    </div>
  );
}
