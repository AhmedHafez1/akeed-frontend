import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getLocaleFromPathname } from '@/lib/locale'
import {
  WaitlistFormData,
  WaitlistSubmissionResponse,
} from '@/types/waitlist.model'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^(\+20|0)?1[0-2,5]\d{8}$/, 'Invalid Egyptian phone number'),
  monthlyOrders: z.string().min(1, 'Please select order volume'),
  platform: z.string().optional().or(z.literal('')),
})

export function useWaitlistForm() {
  const t = useTranslations('form')
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, locale }),
      })

      const result: WaitlistSubmissionResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit')
      }

      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    t,
    form,
    isSubmitting,
    isSuccess,
    error,
    onSubmit,
  }
}
