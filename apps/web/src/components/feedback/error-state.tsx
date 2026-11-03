export function ErrorState({
  title = "Unable to load this content",
  message = "Please try again in a moment.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <h2 className="font-semibold text-destructive">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

