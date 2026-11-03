"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center px-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">The page could not be loaded. Please try again.</p>
      <button
        className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}

