import type { ReactNode } from 'react'
import { CheckCheck } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface WhatsAppMessageBubbleProps {
  direction: 'incoming' | 'outgoing'
  timeLabel: string
  children: ReactNode
  className?: string
}

/** A single WhatsApp chat bubble, coloured like the real app in both themes. */
export function WhatsAppMessageBubble({
  direction,
  timeLabel,
  children,
  className,
}: WhatsAppMessageBubbleProps) {
  const isOutgoing = direction === 'outgoing'

  return (
    <div
      className={cn(
        'rounded-xl px-1 py-1 shadow-sm',
        isOutgoing
          ? 'rounded-se-sm bg-[#d9fdd3] text-slate-800 dark:bg-[#005c4b] dark:text-slate-100'
          : 'rounded-ss-sm bg-white text-slate-800 dark:bg-[#202c33] dark:text-slate-100',
        className
      )}
    >
      <div className="px-2 pt-1 text-[0.8125rem] leading-relaxed whitespace-pre-line">
        {children}
      </div>

      <div className="flex items-center justify-end gap-1 px-1.5 text-[0.625rem] text-slate-500 dark:text-slate-400">
        <span>{timeLabel}</span>
        {isOutgoing && (
          <CheckCheck aria-hidden className="h-3 w-3 text-sky-500" />
        )}
      </div>
    </div>
  )
}
