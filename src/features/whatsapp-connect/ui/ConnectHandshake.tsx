'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Check, MessageCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { akNumeric } from '@/shared/ui'

export type HandshakeState = 'idle' | 'waiting' | 'joined'

/**
 * Akeed at the start, the merchant's number at the end, one line between.
 * Dotted until the server has verified and saved the connection, then solid
 * with a check. Facebook finishing alone never draws it solid.
 */
export function ConnectHandshake({
  state,
  phoneNumber,
}: {
  state: HandshakeState
  phoneNumber?: string | null
}) {
  const t = useTranslations('whatsappConnect')
  const joined = state === 'joined'
  return (
    <div className="flex items-center" aria-hidden="true">
      <Image
        src="/images/akeed-web-app-icon-512.png"
        alt=""
        width={44}
        height={44}
        className="rounded-ak-card ring-line size-11 shrink-0 ring-1"
      />
      <span className="relative mx-3 flex h-5 min-w-10 flex-1 items-center justify-center">
        <span
          className={cn(
            'absolute inset-x-0 top-1/2 -translate-y-1/2',
            joined
              ? 'bg-brand h-0.5 rounded-full'
              : cn(
                  'border-t-2 border-dotted',
                  state === 'waiting' ? 'border-brand' : 'border-line-strong'
                )
          )}
        />
        {joined && (
          <span className="bg-brand text-brand-foreground ring-card relative flex size-5 items-center justify-center rounded-full ring-3">
            <Check className="size-3" strokeWidth={2.5} />
          </span>
        )}
      </span>
      <span
        className={cn(
          'rounded-ak-card text-ak-caption flex h-11 shrink-0 items-center gap-2 border px-3.5 whitespace-nowrap',
          joined
            ? 'border-brand-line bg-brand-soft text-brand-ink font-semibold'
            : state === 'waiting'
              ? 'border-brand-line text-ink border-dashed font-medium'
              : 'border-line-strong text-ink-muted border-dashed font-medium'
        )}
      >
        <MessageCircle className="size-4" />
        {joined && phoneNumber ? (
          <bdi dir="ltr" className={akNumeric}>
            {phoneNumber}
          </bdi>
        ) : (
          t('yourNumber')
        )}
      </span>
    </div>
  )
}
