'use client'

import { useEffect, useRef, useState } from 'react'

/** How long a copy button reads "Copied". */
const COPIED_FEEDBACK_MS = 2000

/**
 * Copies text and reports "copied" for a moment, so a copy button can confirm
 * the action in place. The text is never kept: only whether a copy just
 * succeeded. A failed copy is handed to `onError`, which says so in the
 * caller's own words.
 */
export function useCopyToClipboard(onError: (error: unknown) => void) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(
        () => setCopied(false),
        COPIED_FEEDBACK_MS
      )
    } catch (error) {
      onError(error)
    }
  }

  const reset = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setCopied(false)
  }

  return { copied, copy, reset }
}
