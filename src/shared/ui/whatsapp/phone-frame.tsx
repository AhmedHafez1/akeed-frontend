import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface WhatsAppPhoneFrameProps {
  children: ReactNode
  className?: string
}

/** A phone bezel with notch and the WhatsApp chat wallpaper behind children. */
export function WhatsAppPhoneFrame({
  children,
  className,
}: WhatsAppPhoneFrameProps) {
  return (
    <div className={cn('relative mx-auto w-full max-w-75', className)}>
      <div className="bg-ink-device/15 pointer-events-none absolute inset-x-8 -bottom-6 h-14 rounded-full blur-2xl" />

      <div className="shadow-overlay border-ink-device bg-ink-device relative rounded-[2.75rem] border-[10px] ring-1 ring-slate-700/60">
        <div className="bg-ink-device absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full" />

        <div className="relative overflow-hidden rounded-[2.1rem] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center dark:bg-[#0b141a] dark:bg-none">
          {children}
        </div>
      </div>
    </div>
  )
}
