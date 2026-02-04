import { ORG_SLUG_PREFIX } from '@/config/onboarding'
import type { ChangeEvent } from 'react'
import { OnboardingFormData } from '@/types/onboarding.model'

interface OrganizationStepProps {
  t: (key: string) => string
  formData: OnboardingFormData
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export function OrganizationStep({
  t,
  formData,
  onChange,
}: OrganizationStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">
        {t('onboarding.createOrganization')}
      </h2>
      <p className="text-sm text-slate-600">
        {t('onboarding.organizationDescription')}
      </p>

      <div>
        <label htmlFor="orgName" className="text-sm font-medium text-slate-700">
          {t('onboarding.organizationName')}
        </label>
        <div className="relative mt-2">
          <input
            type="text"
            id="orgName"
            name="orgName"
            required
            value={formData.orgName}
            onChange={onChange}
            className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder={t('onboarding.organizationNamePlaceholder')}
          />
          {formData.orgName ? (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-500">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
        <label htmlFor="orgSlug" className="text-sm font-medium text-slate-700">
          {t('onboarding.organizationSlug')}
        </label>
        <div className="mt-2 flex rounded-xl shadow-sm">
          <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
            {ORG_SLUG_PREFIX}
          </span>
          <div className="relative w-full">
            <input
              type="text"
              id="orgSlug"
              name="orgSlug"
              required
              value={formData.orgSlug}
              onChange={onChange}
              className="block w-full min-w-0 flex-1 rounded-none rounded-r-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 focus-visible:outline-none"
              placeholder="my-company"
            />
            {formData.orgSlug ? (
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
    </div>
  )
}
