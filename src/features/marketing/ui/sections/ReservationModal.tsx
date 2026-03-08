'use client'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { WaitlistForm } from '@/components/forms/WaitlistForm'

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReservationModal({ isOpen, onClose }: ReservationModalProps) {
  const t = useTranslations('reservation')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto px-6 py-6 sm:max-w-lg sm:px-8">
        <DialogHeader className="text-center">
          <DialogTitle className="mb-2 text-center text-xl font-black sm:text-2xl">
            {t('reserve_title')}
          </DialogTitle>
          <DialogDescription className="rounded-md bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
            {t('reserve_subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 px-2 py-2">
          <WaitlistForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}
