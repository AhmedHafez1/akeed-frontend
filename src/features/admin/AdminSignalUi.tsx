import { cn } from '@/shared/lib/utils'
import type { AdminStore } from './admin.model'
import { signalDetail, signalLabel, signalLevel } from './adminSignals'

/*
 * Signal text is English inside pages that may be RTL (the Arabic locale), so
 * every line takes its direction from its own text: "12 of 13" must not be
 * reordered.
 */

/** The top signal under the health badge in the store table. */
export function SignalSummary({
  store,
  now,
}: {
  store: AdminStore
  now?: Date
}) {
  const [top, ...rest] = store.health.signals
  if (!top) return null
  const detail = signalDetail(top, store.health.details, now)
  return (
    <>
      <p
        dir="auto"
        className="text-foreground mt-1.5 max-w-60 text-xs font-medium"
      >
        {signalLabel(top)}
      </p>
      {detail && (
        <p
          dir="auto"
          className="text-muted-foreground mt-0.5 line-clamp-2 max-w-60 text-xs"
          title={detail}
        >
          {detail}
        </p>
      )}
      {rest.length > 0 && (
        <p className="text-muted-foreground mt-0.5 text-xs">
          +{rest.length} more
        </p>
      )}
    </>
  )
}

/** The top signal as a full-width line on a store card at phone width. */
export function SignalCallout({
  store,
  now,
}: {
  store: AdminStore
  now?: Date
}) {
  const [top, ...rest] = store.health.signals
  if (!top) return null
  const detail = signalDetail(top, store.health.details, now)
  const critical = signalLevel(store, top) === 'critical'
  return (
    <div
      className={cn(
        'mt-3 rounded-lg border px-3 py-2',
        critical
          ? 'border-destructive-border bg-destructive-subtle'
          : 'border-warning-border bg-warning-subtle'
      )}
    >
      <p dir="auto" className="text-foreground text-sm font-medium">
        {signalLabel(top)}
        {rest.length > 0 && (
          <span className="text-muted-foreground font-normal">
            {' '}
            · +{rest.length} more
          </span>
        )}
      </p>
      {detail && (
        <p dir="auto" className="text-foreground/75 mt-0.5 text-xs">
          {detail}
        </p>
      )}
    </div>
  )
}

/** Every active signal with its facts and level, for the store header. */
export function SignalList({
  store,
  now,
  className,
}: {
  store: AdminStore
  now?: Date
  className?: string
}) {
  const signals = store.health.signals
  if (signals.length === 0) return null
  return (
    <ul
      aria-label="Active health signals"
      className={cn(
        'border-border divide-border divide-y rounded-xl border',
        className
      )}
    >
      {signals.map((signal) => {
        const detail = signalDetail(signal, store.health.details, now)
        const critical = signalLevel(store, signal) === 'critical'
        return (
          <li key={signal} className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                'mt-1.5 size-2 shrink-0 rounded-full',
                critical ? 'bg-destructive' : 'bg-secondary'
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p dir="auto" className="text-foreground text-sm font-medium">
                {signalLabel(signal)}
              </p>
              {detail && (
                <p
                  dir="auto"
                  className="text-muted-foreground mt-0.5 text-xs break-words"
                >
                  {detail}
                </p>
              )}
            </div>
            <span
              className={cn(
                'shrink-0 text-xs font-medium',
                critical ? 'text-destructive' : 'text-warning'
              )}
            >
              {critical ? 'Critical' : 'Attention'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
