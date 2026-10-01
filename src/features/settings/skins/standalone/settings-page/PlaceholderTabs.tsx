'use client'

import { useId } from 'react'
import { useTranslations } from 'next-intl'
import type { StandaloneSettingsModel } from '@/features/settings/domain/useStandaloneSettings'
import { cn } from '@/shared/lib/utils'
import { AkSwitch, akCard } from '@/shared/ui'

/*
 * Stand-ins until the Timing and Store tabs are built: each shows the tab's
 * main switch, bound to the same form as the rest of the page.
 */

interface PlaceholderTabProps {
  model: StandaloneSettingsModel
  readOnly: boolean
}

function SwitchCard({
  label,
  help,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string
  help: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const labelId = useId()
  const helpId = useId()
  return (
    <section
      aria-labelledby={labelId}
      className={cn(
        akCard,
        'flex items-start justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5'
      )}
    >
      <div className="min-w-0">
        <h2 id={labelId} className="text-ak-section text-ink">
          {label}
        </h2>
        <p id={helpId} className="text-ak-caption text-ink-muted mt-0.5">
          {help}
        </p>
      </div>
      <AkSwitch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={helpId}
      />
    </section>
  )
}

export function TimingTabPlaceholder({ model, readOnly }: PlaceholderTabProps) {
  const t = useTranslations('settings.embedded.timing')
  if (!model.values) return null
  return (
    <SwitchCard
      label={t('autoLabel')}
      help={t('autoHelp')}
      checked={model.values.isAutoVerifyEnabled}
      disabled={readOnly}
      onCheckedChange={(isAutoVerifyEnabled) =>
        model.update({ isAutoVerifyEnabled })
      }
    />
  )
}

export function StoreTabPlaceholder({ model, readOnly }: PlaceholderTabProps) {
  const t = useTranslations('settings')
  if (!model.values) return null
  return (
    <SwitchCard
      label={t('codDefaultLabel')}
      help={t('codDefaultHelp')}
      checked={model.values.assumeCodWhenPaymentMissing}
      disabled={readOnly}
      onCheckedChange={(assumeCodWhenPaymentMissing) =>
        model.update({ assumeCodWhenPaymentMissing })
      }
    />
  )
}
