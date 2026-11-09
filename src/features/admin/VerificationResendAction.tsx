'use client'

import { useId, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/shared/ui'
import type { AdminStoreVerification } from './admin.model'
import { resendAdminDispatch, type AdminApiError } from './adminApi'
import { toAdminApiError } from './useStandaloneBillingAccount'

const DEFAULT_REASON =
  'Confirmed not sent: the send was refused before reaching WhatsApp.'

function describeError(error: AdminApiError): string {
  switch (error.code) {
    case 'MESSAGE_DISPATCH_RESEND_UNSUPPORTED':
      return 'This message can no longer be resent here. Refresh the list to see its current state.'
    case 'MANUAL_ORDER_RETRY_BLOCKED':
    case 'MANUAL_ORDER_RETRY_NOT_ALLOWED':
      return `It was marked not sent, but the resend was refused: ${error.message} The merchant can retry from their dashboard once the store is ready.`
    default:
      return error.message
  }
}

/**
 * Staff confirm that a first confirmation awaiting review never reached
 * WhatsApp, and send it again. Offered only when no WhatsApp message id was
 * recorded for it; if it did go out after all, the customer gets it twice.
 */
export function VerificationResendAction({
  verification,
  onResent,
}: {
  verification: AdminStoreVerification
  onResent: () => void
}) {
  const reasonId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(DEFAULT_REASON)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)
  const [done, setDone] = useState(false)
  const dispatchId = verification.resend_dispatch_id
  if (!dispatchId) return null

  const close = (next: boolean) => {
    if (pending) return
    setOpen(next)
    if (!next) {
      if (done) onResent()
      setError(null)
      setDone(false)
      setReason(DEFAULT_REASON)
    }
  }

  const resend = async () => {
    setPending(true)
    setError(null)
    try {
      await resendAdminDispatch(dispatchId, reason.trim())
      setDone(true)
    } catch (cause) {
      setError(toAdminApiError(cause))
    } finally {
      setPending(false)
    }
  }

  const order = verification.order_number ?? verification.external_order_id

  return (
    <div className="mt-3">
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Mark not sent and resend
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent closeDisabled={pending}>
          <DialogHeader>
            <DialogTitle>
              Resend the confirmation for order {order}?
            </DialogTitle>
            <DialogDescription>
              No WhatsApp message ID was recorded for this message. Resend it
              only if you are sure WhatsApp never received it, for example
              because the logs show the send was refused before reaching
              WhatsApp. If it did go out, the customer will get it twice.
            </DialogDescription>
          </DialogHeader>
          {done ? (
            <p className="text-foreground text-sm" role="status">
              Marked not sent and queued for resending. The list updates when
              you close this.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={reasonId}>Reason (saved in the audit log)</Label>
              <Input
                id={reasonId}
                value={reason}
                maxLength={1000}
                disabled={pending}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
          )}
          {error && (
            <p
              className="text-destructive-subtle-foreground text-sm"
              role="alert"
            >
              {describeError(error)}
              {error.requestId && (
                <span className="mt-1 block font-mono text-xs">
                  Request ID: {error.requestId}
                </span>
              )}
            </p>
          )}
          <DialogFooter>
            {done ? (
              <Button onClick={() => close(false)}>Done</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => close(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void resend()}
                  disabled={pending || reason.trim().length === 0}
                >
                  {pending ? 'Resending…' : 'Mark not sent and resend'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
