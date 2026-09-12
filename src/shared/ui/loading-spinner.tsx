export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-3 text-sm">
      <span className="border-input h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
      {message && <span>{message}</span>}
    </div>
  )
}
