'use client'

import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard'
import { Button } from '@/shared/ui/button'

interface CopyTrackingNumberProps {
  value: string
  copyLabel: string
  copiedLabel: string
}

/** Copies the tracking number and says so in place for a moment. */
export function CopyTrackingNumber({
  value,
  copyLabel,
  copiedLabel,
}: CopyTrackingNumberProps) {
  // A failed copy leaves the number on screen to copy by hand.
  const { copied, copy } = useCopyToClipboard(() => undefined)

  return (
    <Button
      type="button"
      variant="outline"
      className="bg-card shrink-0"
      onClick={() => void copy(value)}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
    </Button>
  )
}
