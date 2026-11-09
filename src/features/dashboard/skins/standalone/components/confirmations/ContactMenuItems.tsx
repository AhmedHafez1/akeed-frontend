'use client'

import { Copy, MessageCircle, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard'
import { DropdownMenuItem, notify } from '@/shared/ui'
import type { CustomerContact } from '@/features/dashboard/lib/customerContact'

/**
 * Open WhatsApp, Call and Copy number as menu items. They open the
 * merchant's own apps; nothing goes through Akeed. Without a usable number
 * they show disabled, so the menu still says what is missing.
 */
export function ContactMenuItems({
  contact,
}: {
  contact: CustomerContact | null
}) {
  const t = useTranslations('dashboard.changeRequest')
  const { copy } = useCopyToClipboard(() =>
    notify.error({ message: t('copyError'), id: 'change-request-copy' })
  )
  if (!contact)
    return (
      <>
        <DropdownMenuItem disabled>
          <MessageCircle aria-hidden="true" className="size-4" />
          {t('openWhatsapp')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Phone aria-hidden="true" className="size-4" />
          {t('call')}
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Copy aria-hidden="true" className="size-4" />
          {t('noPhone')}
        </DropdownMenuItem>
      </>
    )
  return (
    <>
      <DropdownMenuItem asChild>
        <a href={contact.whatsAppUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" className="size-4" />
          {t('openWhatsapp')}
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <a href={contact.callUrl}>
          <Phone aria-hidden="true" className="size-4" />
          {t('call')}
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          void copy(contact.copyText).then((copied) => {
            if (copied)
              notify.success({
                message: t('copied'),
                id: 'change-request-copy',
              })
          })
        }}
      >
        <Copy aria-hidden="true" className="size-4" />
        {t('copy')}
      </DropdownMenuItem>
    </>
  )
}
