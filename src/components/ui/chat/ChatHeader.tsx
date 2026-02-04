import Image from 'next/image'
import { Clock } from 'lucide-react'

interface ChatHeaderProps {
  statusLabel: string
  timeLabel: string
}

export function ChatHeader({ statusLabel, timeLabel }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-linear-to-r from-emerald-700 to-emerald-600 px-4 py-4 pt-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
          <Image
            src="/images/akeed_logo_no_bg.png"
            alt="Akeed Logo"
            width={40}
            height={40}
            className="object-contain"
            sizes="40px"
            priority
          />
        </div>
        <div>
          <div className="font-bold text-white">Akeed</div>
          <div className="flex items-center gap-1 text-xs text-emerald-100">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-300" />
            {statusLabel}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-white/80">
        <Clock className="h-4 w-4" />
        {timeLabel}
      </div>
    </div>
  )
}
