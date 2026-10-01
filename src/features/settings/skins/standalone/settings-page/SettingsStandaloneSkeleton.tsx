import { cn } from '@/shared/lib/utils'
import { Skeleton, akCard } from '@/shared/ui'

/** The Settings page's shape while it loads: header, tabs, cards, preview. */
export function SettingsStandaloneSkeleton() {
  const card = cn(akCard, 'space-y-3 px-4 py-4 sm:px-6 sm:py-5')
  return (
    <div
      aria-busy="true"
      className="mx-auto w-full max-w-295 space-y-6 pt-2 pb-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="border-line flex gap-6 border-b pb-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-5 w-24" />
        ))}
      </div>
      <div className="grid items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className={card}>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
          <div className={card}>
            <Skeleton className="h-6 w-32" />
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-14 w-full" />
            ))}
          </div>
          <div className={card}>
            <Skeleton className="h-6 w-36" />
            <div className="grid gap-2 sm:grid-cols-2">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-18 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div className={card}>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}
