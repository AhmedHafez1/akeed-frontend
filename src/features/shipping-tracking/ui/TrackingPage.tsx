import { Phone, Truck, Unlink } from 'lucide-react'
import type { ReactNode } from 'react'
import { CopyTrackingNumber } from './CopyTrackingNumber'

export interface TrackingPageLabels {
  trackingNumber: string
  copy: string
  copied: string
  courierContact: string
  unavailableTitle: string
  unavailableBody: string
  sentWith: string
}

type TrackingPageProps =
  | {
      state: 'page'
      labels: TrackingPageLabels
      /** "Your order #1042 is on its way", already translated. */
      heading: ReactNode
      storeName: string | null
      courier: string | null
      trackingNumber: string | null
    }
  | { state: 'unavailable'; labels: TrackingPageLabels }

/**
 * The customer's page behind the Shipped message's Track order button, when
 * there is no carrier page to send them to: the order, the tracking number to
 * copy and who comes next. Never the customer's own details.
 */
export function TrackingPage(props: TrackingPageProps) {
  const { labels } = props
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-6">
        <section className="bg-card border-border w-full max-w-md rounded-2xl border px-5 pt-7 pb-6 text-start">
          {props.state === 'unavailable' ? (
            <>
              <span className="bg-muted text-muted-foreground mb-4 grid size-11 place-items-center rounded-xl">
                <Unlink className="size-5" aria-hidden="true" />
              </span>
              <h1 className="text-ak-title">{labels.unavailableTitle}</h1>
              <p className="text-muted-foreground text-ak-body mt-2">
                {labels.unavailableBody}
              </p>
            </>
          ) : (
            <>
              <span className="bg-primary-subtle text-primary-subtle-foreground mb-4 grid size-11 place-items-center rounded-xl">
                <Truck className="size-5" aria-hidden="true" />
              </span>
              {props.storeName ? (
                <p className="text-muted-foreground text-ak-body mb-1">
                  {props.storeName}
                </p>
              ) : null}
              <h1 className="text-ak-title">{props.heading}</h1>
              {props.trackingNumber ? (
                <div className="bg-muted border-border mt-5 flex items-center gap-3 rounded-xl border p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-ak-caption">
                      {props.courier
                        ? `${props.courier} · ${labels.trackingNumber}`
                        : labels.trackingNumber}
                    </p>
                    <p
                      dir="ltr"
                      className="text-ak-section text-start font-medium break-all [unicode-bidi:isolate]"
                    >
                      {props.trackingNumber}
                    </p>
                  </div>
                  <CopyTrackingNumber
                    value={props.trackingNumber}
                    copyLabel={labels.copy}
                    copiedLabel={labels.copied}
                  />
                </div>
              ) : null}
              <p className="text-muted-foreground text-ak-body mt-5 flex items-start gap-2">
                <Phone className="mt-1 size-4 shrink-0" aria-hidden="true" />
                <span>{labels.courierContact}</span>
              </p>
            </>
          )}
        </section>
      </main>
      <footer className="text-muted-foreground text-ak-caption flex justify-center gap-1.5 pb-5">
        <span>{labels.sentWith}</span>
        <span className="text-primary font-semibold">Akeed</span>
      </footer>
    </div>
  )
}
