'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Frown className="h-24 w-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold text-primary font-headline mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-xl text-foreground mb-12 max-w-md">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" passHref>
        <Button size="lg">Go back to Home</Button>
      </Link>
    </div>
  );
}
