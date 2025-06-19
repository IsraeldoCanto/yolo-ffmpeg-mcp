'use client' // Error components must be Client Components
 
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <AlertTriangle className="h-16 w-16 text-destructive mb-6" />
      <h2 className="text-3xl font-bold text-destructive mb-4">Something went wrong!</h2>
      <p className="text-lg text-foreground mb-8 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        size="lg"
      >
        Try again
      </Button>
      <pre className="mt-4 p-2 bg-muted text-destructive-foreground text-xs rounded overflow-auto max-w-full">
        {error.message}
        {error.digest && ` (Digest: ${error.digest})`}
      </pre>
    </div>
  )
}
