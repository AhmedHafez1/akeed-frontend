import { OnboardingFormData } from '@/types/onboarding.model'
import type { ChangeEvent } from 'react'

interface WhatsappStepProps {
  t: (key: string) => string
  formData: OnboardingFormData
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export function WhatsappStep({ t, formData, onChange }: WhatsappStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">
        {t('onboarding.configureWhatsApp')}
      </h2>
      <p className="text-sm text-slate-600">
        {t('onboarding.whatsappDescription')}
      </p>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="whatsappPhoneId"
            className="text-sm font-medium text-slate-700"
          >
            {t('onboarding.phoneNumberId')}
          </label>
          <div className="relative mt-2">
            <input
              type="text"
              id="whatsappPhoneId"
              name="whatsappPhoneId"
              value={formData.whatsappPhoneId}
              onChange={onChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
            {formData.whatsappPhoneId ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="whatsappBusinessId"
            className="text-sm font-medium text-slate-700"
          >
            {t('onboarding.businessAccountId')}
          </label>
          <div className="relative mt-2">
            <input
              type="text"
              id="whatsappBusinessId"
              name="whatsappBusinessId"
              value={formData.whatsappBusinessId}
              onChange={onChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
            {formData.whatsappBusinessId ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <label
            htmlFor="whatsappAccessToken"
            className="text-sm font-medium text-slate-700"
          >
            {t('onboarding.accessToken')}
          </label>
          <div className="relative mt-2">
            <input
              type="password"
              id="whatsappAccessToken"
              name="whatsappAccessToken"
              value={formData.whatsappAccessToken}
              onChange={onChange}
              className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            />
            {formData.whatsappAccessToken ? (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.414 0L3.293 9.848a1 1 0 011.414-1.414l4.102 4.102 6.364-6.364a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm text-emerald-700">
          💡 {t('onboarding.whatsappHelp')}
        </p>
      </div>
    </div>
  )
}
