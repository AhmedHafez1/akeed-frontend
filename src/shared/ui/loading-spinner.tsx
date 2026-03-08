export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
      {message && <span>{message}</span>}
    </div>
  )
}
