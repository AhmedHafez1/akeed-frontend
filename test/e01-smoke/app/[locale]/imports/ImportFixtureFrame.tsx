'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { applyResolvedTheme } from '@/shared/theme/theme.dom'
import { e2eTheme } from './importReplay'
import { orderImportFixtureCalls } from './orderImportFixture'

/**
 * Test tooling around the real import pages: the app canvas, `?theme=dark`,
 * and `?drop=<file name>` to drop a synthetic file on the dropzone so the
 * uploading and refusal frames can be captured headless.
 */
export function ImportFixtureFrame({ children }: { children: ReactNode }) {
  const [calls, setCalls] = useState<string[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    applyResolvedTheme(
      (params.get('theme') ?? e2eTheme()) === 'dark' ? 'dark' : 'light'
    )
    const drop = params.get('drop')
    if (!drop) return
    const timer = window.setInterval(() => {
      const zone = document.querySelector(
        '[data-testid="order-import-dropzone"]'
      )
      if (!zone) return
      window.clearInterval(timer)
      const transfer = new DataTransfer()
      transfer.items.add(
        new File(['x'.repeat(421_888)], drop, {
          type: drop.endsWith('.csv') ? 'text/csv' : 'application/octet-stream',
        })
      )
      zone.dispatchEvent(
        new DragEvent('drop', { dataTransfer: transfer, bubbles: true })
      )
    }, 100)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="akeed-app-canvas text-foreground min-h-screen">
      <aside className="border-border bg-card flex flex-wrap items-center gap-3 border-b px-4 py-2 text-xs">
        <strong>US-04.6-05 import fixture</strong>
        <button
          type="button"
          className="underline"
          onClick={() => setCalls(orderImportFixtureCalls())}
        >
          Inspect import calls
        </button>
        <output aria-label="Import fixture calls">{calls.join(' | ')}</output>
      </aside>
      <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
