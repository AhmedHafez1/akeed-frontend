import Image from 'next/image'
import { ChevronLeft, MoreVertical, Phone } from 'lucide-react'

interface WhatsAppChatHeaderProps {
  name: string
  statusLabel: string
  avatarAlt: string
}

/** The business-account header of a WhatsApp chat, with the Akeed avatar. */
export function WhatsAppChatHeader({
  name,
  statusLabel,
  avatarAlt,
}: WhatsAppChatHeaderProps) {
  return (
    <div className="bg-primary flex items-center justify-between px-3 pt-9 pb-3 text-white dark:bg-[#202c33]">
      <div className="flex min-w-0 items-center gap-2">
        <ChevronLeft
          aria-hidden
          className="h-5 w-5 shrink-0 text-white/90 rtl:-scale-x-100"
        />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-md">
          <Image
            src="/images/akeed-social-profile-circle-1080.png"
            alt={avatarAlt}
            width={36}
            height={36}
            className="object-contain"
            sizes="36px"
            priority
          />
        </div>
        <div className="min-w-0">
          <div className="truncate leading-tight font-semibold">{name}</div>
          <div className="text-xs text-emerald-100">{statusLabel}</div>
        </div>
      </div>
      <div aria-hidden className="flex items-center gap-3 text-white/90">
        <Phone className="h-4.5 w-4.5" />
        <MoreVertical className="h-4.5 w-4.5" />
      </div>
    </div>
  )
}
