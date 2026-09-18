'use client'

import { PartyPopper } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui'
import { useBillingSummary } from '@/features/billing/domain/useBillingSummary'
import { formatCredits } from '@/features/billing/domain/billingFormatters'

interface WelcomeCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Shown once, right after a merchant finishes standalone onboarding, to
 * confirm the free credit grant Akeed already posted at signup.
 */
export function WelcomeCreditsModal({
  open,
  onOpenChange,
}: WelcomeCreditsModalProps) {
  const t = useTranslations('dashboard.welcomeModal')
  const { locale } = useLocaleInfo()
  const { summary, isLoading } = useBillingSummary()

  const hasCount = !isLoading && summary !== null
  const body = hasCount
    ? t('body', { count: formatCredits(summary.availableCredits, locale) })
    : t('bodyFallback')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={t('cta')}>
        <DialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className="bg-primary-subtle text-primary mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full">
            <PartyPopper aria-hidden="true" className="h-6 w-6" />
          </span>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>{t('cta')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
