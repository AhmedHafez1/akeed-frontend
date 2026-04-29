'use client'

import { useState } from 'react'
import {
  InternationalPhoneInput,
  isValidPhoneNumber,
  type E164Value,
} from '@/shared/ui'

interface StandaloneTestVerificationPanelProps {
  heading: string
  hint: string
  phoneLabel: string
  phonePlaceholder: string
  sendLabel: string
  sendingLabel: string
  isSendingTest: boolean
  onSendTestVerification: (customerPhone: string) => Promise<void>
}

export function StandaloneTestVerificationPanel({
  heading,
  hint,
  phoneLabel,
  phonePlaceholder,
  sendLabel,
  sendingLabel,
  isSendingTest,
  onSendTestVerification,
}: StandaloneTestVerificationPanelProps) {
  const [testPhone, setTestPhone] = useState<E164Value | undefined>()
  const isPhoneValid = testPhone ? isValidPhoneNumber(testPhone) : false

  const handleSendTest = () => {
    if (!testPhone || !isPhoneValid) return
    onSendTestVerification(testPhone)
  }

  return (
    <div className="space-y-3 border-t border-slate-200 pt-5">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-slate-800">{heading}</h4>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm min-w-[16rem] flex-1">
          <InternationalPhoneInput
            value={testPhone}
            onChange={setTestPhone}
            label={phoneLabel}
            placeholder={phonePlaceholder}
            defaultCountry="EG"
            disabled={isSendingTest}
          />
        </div>
        <button
          type="button"
          disabled={!isPhoneValid || isSendingTest}
          onClick={handleSendTest}
          className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSendingTest ? sendingLabel : sendLabel}
        </button>
      </div>
    </div>
  )
}
