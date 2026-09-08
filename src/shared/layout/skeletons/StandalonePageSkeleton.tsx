import { Skeleton } from '@/shared/ui'

interface StandalonePageSkeletonProps {
  variant?: 'dashboard' | 'verifications' | 'settings' | 'templates'
  includeShell?: boolean
}

function ContentSkeleton({
  variant = 'dashboard',
}: Pick<StandalonePageSkeletonProps, 'variant'>) {
  const isList = variant === 'verifications'
  const isForm = variant === 'settings' || variant === 'templates'

  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-[1400px] space-y-5 p-4 sm:p-6 lg:p-8"
    >
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      {isList ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[32rem] rounded-2xl" />
        </>
      ) : isForm ? (
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <Skeleton className="h-44 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </>
      )}
    </div>
  )
}

export function StandalonePageSkeleton({
  variant,
  includeShell = false,
}: StandalonePageSkeletonProps) {
  if (!includeShell) return <ContentSkeleton variant={variant} />

  return (
    <div className="akeed-app-canvas flex min-h-screen">
      <aside className="hidden h-screen w-[248px] shrink-0 border-e border-stone-200 bg-white p-5 lg:block">
        <Skeleton className="h-10 w-28" />
        <div className="mt-10 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-11 rounded-xl" />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-14 items-center justify-between border-b border-stone-200 bg-white px-4 sm:px-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-16 rounded-lg" />
        </div>
        <ContentSkeleton variant={variant} />
      </div>
    </div>
  )
}
