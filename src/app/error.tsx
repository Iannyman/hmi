"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="text-sm text-muted-foreground">
              {error.message || "A critical error occurred."}
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
