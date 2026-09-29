'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui'

export interface DefaultsWellRow {
  id: string
  label: string
  valueLabel: string
  control: ReactNode
}

interface DefaultsWellProps {
  rows: ReadonlyArray<DefaultsWellRow>
  caption: string
}

/**
 * The pre-chosen language/currency/timezone defaults, each row expanding
 * in place into its own control when the merchant wants to change it.
 */
export function DefaultsWell({ rows, caption }: DefaultsWellProps) {
  const t = useTranslations('standaloneOnboarding.defaultsWell')
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div>
      <ul className="bg-surface-sunken border-border divide-border rounded-panel divide-y border">
        {rows.map((row) => {
          const isOpen = openId === row.id
          const panelId = `${row.id}-panel`
          return (
            <li key={row.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-muted-foreground text-sm">
                  {row.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-semibold">
                    {row.valueLabel}
                  </span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto min-h-11 p-0 sm:min-h-0"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenId(isOpen ? null : row.id)}
                  >
                    {t('change')}
                  </Button>
                </div>
              </div>
              {isOpen && (
                <div id={panelId} className="mt-2">
                  {row.control}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-muted-foreground mt-2 text-xs">{caption}</p>
    </div>
  )
}
