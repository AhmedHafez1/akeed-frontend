'use client'

import { useCallback, useState } from 'react'
import { countryFromLanguages, countryFromPhone } from '@/features/onboarding'
import {
  isValidPhoneNumber,
  type PhoneCountry,
} from '@/shared/ui/international-phone-input'
import type { SaveTestPhoneOutcome, TestSendOutcome } from './useSettingsModel'

export type TestPhonePromptError = 'invalid' | 'readOnly' | 'saveFailed'

interface TestPhoneDraft {
  /** E.164, or empty while the field is blank. */
  phone: string
  defaultCountry: PhoneCountry
}

export interface TestPhonePromptOptions {
  /** The number the free test goes to today, if one is saved. */
  savedPhone: string | null
  /** The Shopify store's phone: a starting point when nothing is saved. */
  shopPhone: string | null
  sendTest: () => Promise<TestSendOutcome>
  saveTestPhone: (phone: string) => Promise<SaveTestPhoneOutcome>
}

/**
 * Asks for the merchant's WhatsApp number where the test send needs it. With
 * a saved number the send goes straight out; without one the prompt opens,
 * starting from the saved number, then the store's phone, then empty, and
 * saving it sends the test.
 */
export function useTestPhonePrompt({
  savedPhone,
  shopPhone,
  sendTest,
  saveTestPhone,
}: TestPhonePromptOptions) {
  const [draft, setDraft] = useState<TestPhoneDraft | null>(null)
  const [error, setError] = useState<TestPhonePromptError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const open = useCallback(() => {
    const phone = savedPhone ?? shopPhone ?? ''
    setDraft({
      phone,
      defaultCountry:
        (phone && countryFromPhone(phone)) ||
        countryFromLanguages(navigator.languages),
    })
    setError(null)
  }, [savedPhone, shopPhone])

  const close = useCallback(() => {
    setDraft(null)
    setError(null)
  }, [])

  const setPhone = useCallback((phone: string) => {
    setDraft((current) => (current ? { ...current, phone } : current))
    setError(null)
  }, [])

  const requestSend = useCallback(async () => {
    if (!savedPhone) {
      open()
      return
    }
    // The page can be behind the server: the number may have been cleared.
    if ((await sendTest()) === 'phoneMissing') open()
  }, [open, savedPhone, sendTest])

  const submit = useCallback(async () => {
    if (!draft || isSubmitting) return
    if (!draft.phone || !isValidPhoneNumber(draft.phone)) {
      setError('invalid')
      return
    }
    setIsSubmitting(true)
    try {
      if (draft.phone !== savedPhone) {
        const outcome = await saveTestPhone(draft.phone)
        if (!outcome.ok) {
          setError(outcome.reason)
          return
        }
      }
      if ((await sendTest()) === 'phoneMissing') {
        setError('saveFailed')
        return
      }
      setDraft(null)
    } finally {
      setIsSubmitting(false)
    }
  }, [draft, isSubmitting, saveTestPhone, savedPhone, sendTest])

  return {
    isOpen: draft !== null,
    phone: draft?.phone ?? '',
    defaultCountry: draft?.defaultCountry,
    /** The number shown came from the store, not from the merchant. */
    isSuggested: !savedPhone && !!shopPhone && draft?.phone === shopPhone,
    error,
    isSubmitting,
    requestSend,
    openToChange: open,
    close,
    setPhone,
    submit,
  }
}

export type TestPhonePrompt = ReturnType<typeof useTestPhonePrompt>
