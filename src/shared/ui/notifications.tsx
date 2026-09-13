'use client'

import { useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import type { ToastPosition } from 'react-hot-toast'
import { useLocaleInfo } from '@/shared/hooks/useLocaleInfo'

interface NotificationAction {
  label: string
  onClick: () => void
}

export interface NotificationInput {
  message: string
  id?: string
  action?: NotificationAction
}

type NotificationTone = 'success' | 'warning' | 'error'

const toneClasses: Record<NotificationTone, string> = {
  success: 'border-emerald-200 bg-white text-foreground',
  warning: 'border-amber-200 bg-white text-foreground',
  error: 'border-red-200 bg-white text-foreground',
}

const toneDots: Record<NotificationTone, string> = {
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
}

function showNotification(
  tone: NotificationTone,
  { message, id, action }: NotificationInput
) {
  return toast.custom(
    (instance) => (
      <div
        role={tone === 'error' ? 'alert' : 'status'}
        aria-live={tone === 'error' ? 'assertive' : 'polite'}
        className={`flex w-[min(92vw,420px)] items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg transition ${toneClasses[tone]} ${instance.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
      >
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneDots[tone]}`}
        />
        <span className="min-w-0 flex-1 leading-5">{message}</span>
        {action && (
          <button
            type="button"
            onClick={() => {
              action.onClick()
              toast.dismiss(instance.id)
            }}
            className="shrink-0 rounded-md px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            {action.label}
          </button>
        )}
      </div>
    ),
    { id, duration: tone === 'success' ? 4000 : 7000 }
  )
}

export const notify = {
  success: (input: NotificationInput) => showNotification('success', input),
  warning: (input: NotificationInput) => showNotification('warning', input),
  error: (input: NotificationInput) => showNotification('error', input),
  dismiss: (id?: string) => toast.dismiss(id),
}

export function StandaloneToaster() {
  const { isRTL } = useLocaleInfo()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const position: ToastPosition = isMobile
    ? 'top-center'
    : isRTL
      ? 'top-left'
      : 'top-right'

  return <Toaster position={position} />
}
