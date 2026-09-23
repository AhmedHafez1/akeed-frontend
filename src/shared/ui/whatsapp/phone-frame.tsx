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
      <div className="pointer-events-none absolute inset-x-8 -bottom-6 h-14 rounded-full bg-slate-900/15 blur-2xl" />

      <div className="shadow-overlay relative rounded-[2.75rem] border-[10px] border-slate-900 bg-slate-900 ring-1 ring-slate-700/60">
        <div className="absolute top-2 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />

        <div className="relative overflow-hidden rounded-[2.1rem] bg-[#efeae2] bg-[url('/images/landing/wa_chat_bg.png')] bg-cover bg-center dark:bg-[#0b141a] dark:bg-none">
          {children}
        </div>
      </div>
    </div>
  )
}
