
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { Loader2, Music2 } from 'lucide-react';
import { getBuildDisplayString } from '@/lib/build-info';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/multimedia');
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
        Your personal multimedia database. Organize, find, and manage your audio effortlessly.
      </p>
      <GoogleSignInButton />
      <footer className="fixed bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
        <div className="mb-1">
          &copy; {new Date().getFullYear()} Kompost Mixer. All rights reserved.
        </div>
        <div className="text-xs bg-black/20 rounded px-2 py-1 inline-block">
          Build: {getBuildDisplayString()}
        </div>
      </footer>
    </div>
  );
}
