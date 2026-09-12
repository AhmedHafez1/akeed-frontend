import { Skeleton } from '@/shared/ui'

/**
 * AuthGuard fallback for the focused onboarding shell — a slim bar plus the
 * rail/card grid, so nothing shifts when the guard resolves.
 */
export function StandaloneOnboardingShellSkeleton() {
  return (
    <div aria-busy="true" className="akeed-app-canvas min-h-screen">
      <div className="border-border flex h-14 items-center justify-between border-b bg-white px-4 sm:px-6">
        <Skeleton className="h-9 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-16 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1120px] space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,740px)]">
          <Skeleton className="hidden h-72 rounded-xl md:block" />
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-xl md:hidden" />
            <Skeleton className="h-[30rem] rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
