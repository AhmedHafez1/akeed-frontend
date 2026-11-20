import { Mail, MessageCircle } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

const chipClass =
  'border-border text-primary hover:bg-primary-subtle focus-visible:ring-ring inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none'

/** A wa.me link needs the number as digits only, without the plus. */
export function whatsappChatUrl(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, '') ?? ''
  return digits.length >= 8 ? `https://wa.me/${digits}` : null
}

export interface ContactChipsLabels {
  /** Accessible name of the WhatsApp chip. */
  whatsapp: string
  /** Accessible name of the email chip. */
  emailTo: string
  /** Visible text of the email chip. */
  email: string
  /** Shown when there is neither a usable number nor an email. */
  none: string
}

/**
 * One tap to reach a merchant: the WhatsApp number opens a chat, the email
 * chip opens the mail app. The caller supplies the words so screens with and
 * without translations share the same chips.
 */
export function ContactChips({
  phone,
  email,
  labels,
  className,
}: {
  phone: string | null
  email: string | null
  labels: ContactChipsLabels
  className?: string
}) {
  const chat = whatsappChatUrl(phone)
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {chat && (
        <a
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          className={chipClass}
          aria-label={labels.whatsapp}
        >
          <MessageCircle className="size-3.5" aria-hidden />
          <span dir="ltr" className="tabular-nums">
            {phone}
          </span>
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={chipClass}
          aria-label={labels.emailTo}
          title={email}
        >
          <Mail className="size-3.5" aria-hidden />
          {labels.email}
        </a>
      )}
      {!chat && !email && (
        <span className="text-muted-foreground text-xs">{labels.none}</span>
      )}
    </span>
  )
}
