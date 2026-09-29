import { Skeleton } from '@/shared/ui'

/**
 * AuthGuard fallback for the focused onboarding shell: the bar with its
 * centred stepper, then the setup card and phone preview, so nothing shifts
 * when the guard resolves.
 */
export function StandaloneOnboardingShellSkeleton() {
  return (
    <div aria-busy="true" className="akeed-app-canvas min-h-screen">
      <div className="border-border bg-card grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 sm:px-6">
        <Skeleton className="h-9 w-24" />
        <div className="flex justify-start sm:justify-center">
          <Skeleton className="h-5 w-32 sm:h-8 sm:w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-11 rounded-lg sm:h-9 sm:w-20" />
          <Skeleton className="hidden h-9 w-20 rounded-lg sm:block" />
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-[1120px] items-start gap-8 px-4 py-6 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-16">
        <Skeleton className="h-[36rem] rounded-xl" />
        <Skeleton className="hidden h-[36rem] rounded-[2.75rem] lg:block" />
      </div>
    </div>
  )
}
