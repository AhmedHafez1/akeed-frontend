'use client'

import { useId, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
import { deleteAdminStore, type AdminApiError } from './adminApi'
import { toAdminApiError } from './useStandaloneBillingAccount'

function describeError(error: AdminApiError): string {
  switch (error.code) {
    case 'ADMIN_STORE_DELETE_NOT_ELIGIBLE':
      return 'This store can no longer be deleted: it has activity, credit history or another store in its organization. Refresh the list.'
    case 'ADMIN_STORE_DELETE_NAME_MISMATCH':
      return 'The store name does not match.'
    default:
      return error.message
  }
}

/**
 * Staff delete a dead store with its whole organization: orders, messages,
 * webhooks, usage and the merchant's login. Offered only when the backend
 * says the store qualifies; staff confirm by typing the store name.
 */
export function StoreDeleteAction({
  integrationId,
  storeName,
  onDeleted,
}: {
  integrationId: string
  storeName: string
  onDeleted: () => void
}) {
  const nameId = useId()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<AdminApiError | null>(null)

  const close = (next: boolean) => {
    if (pending) return
    setOpen(next)
    if (!next) {
      setTyped('')
      setError(null)
    }
  }

  const remove = async () => {
    setPending(true)
    setError(null)
    try {
      await deleteAdminStore(integrationId, typed.trim())
      setOpen(false)
      onDeleted()
    } catch (cause) {
      setError(toAdminApiError(cause))
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-destructive-border text-destructive-subtle-foreground hover:bg-destructive-subtle"
        onClick={() => setOpen(true)}
      >
        <Trash2 aria-hidden="true" />
        Delete store
      </Button>
      <Dialog open={open} onOpenChange={close}>
        <DialogContent closeDisabled={pending}>
          <DialogHeader>
            <DialogTitle>Delete {storeName}?</DialogTitle>
            <DialogDescription>
              This permanently deletes the store and its organization: orders,
              messages, webhooks, usage, settings and the merchant&apos;s login.
              It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={nameId}>Type the store name to confirm</Label>
            <Input
              id={nameId}
              value={typed}
              placeholder={storeName}
              autoComplete="off"
              disabled={pending}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
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
            <Button
              variant="outline"
              onClick={() => close(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void remove()}
              disabled={pending || typed.trim() !== storeName.trim()}
            >
              {pending ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
