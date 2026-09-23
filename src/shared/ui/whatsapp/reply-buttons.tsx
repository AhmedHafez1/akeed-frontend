import { SquareCheck, X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export type WhatsAppReplyTone = 'confirm' | 'cancel'

/** Brand-styled quick reply, as the marketing demo animates it. */
export function whatsAppQuickReplyClassName(tone: WhatsAppReplyTone): string {
  return cn(
    'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[0.8125rem] font-medium shadow-sm',
    tone === 'confirm'
      ? 'bg-primary text-primary-foreground'
      : 'bg-card text-primary ring-1 ring-border dark:bg-[#2a3942] dark:ring-0'
  )
}

export function WhatsAppQuickReplyIcon({ tone }: { tone: WhatsAppReplyTone }) {
  return tone === 'confirm' ? (
    <SquareCheck aria-hidden className="h-4 w-4" />
  ) : (
    <X aria-hidden className="h-3.5 w-3.5" />
  )
}

export interface WhatsAppTemplateButton {
  label: string
  tone: WhatsAppReplyTone
}

interface WhatsAppTemplateButtonsProps {
  buttons: ReadonlyArray<WhatsAppTemplateButton>
  /** Draws attention to the button the viewer is expected to tap. */
  emphasizedTone?: WhatsAppReplyTone
}

/**
 * Template quick-reply rows as WhatsApp renders them under a business message:
 * full width, divided, link-coloured text. Presentational only.
 */
export function WhatsAppTemplateButtons({
  buttons,
  emphasizedTone,
}: WhatsAppTemplateButtonsProps) {
  return (
    <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-700 dark:border-slate-700">
      {buttons.map((button) => (
        <div
          key={button.label}
          className={cn(
            'px-3 py-2.5 text-center text-[0.875rem] font-semibold text-sky-700 dark:text-sky-400',
            emphasizedTone === button.tone &&
              'bg-sky-50 motion-safe:animate-pulse dark:bg-sky-950/40'
          )}
        >
          {button.label}
        </div>
      ))}
    </div>
  )
}
