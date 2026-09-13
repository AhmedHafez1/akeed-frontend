interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="border-border bg-muted text-muted-foreground rounded-xl border border-dashed px-6 py-8 text-center text-sm">
      {message}
    </div>
  )
}
