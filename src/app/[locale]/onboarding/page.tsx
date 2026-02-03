'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/auth'
import { useTranslations } from 'next-intl'

/**
 * Onboarding Wizard - Standalone Mode Only
 *
 * Guides new users through:
 * 1. Organization setup
 * 2. Platform selection
 * 3. Initial configuration
 */

type OnboardingStep = 'organization' | 'platform' | 'whatsapp' | 'complete'

export default function OnboardingPage() {
  const t = useTranslations()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('organization')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    orgName: '',
    orgSlug: '',
    selectedPlatforms: [] as string[],
    whatsappPhoneId: '',
    whatsappBusinessId: '',
    whatsappAccessToken: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }))

    // Auto-generate slug from org name
    if (e.target.name === 'orgName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData((prev) => ({ ...prev, orgSlug: slug }))
    }
  }

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }))
  }

  const handleNext = async () => {
    setError('')
    setIsLoading(true)

    try {
      if (currentStep === 'organization') {
        // Create organization
        await api.post('/api/organizations', {
          name: formData.orgName,
          slug: formData.orgSlug,
        })
        setCurrentStep('platform')
      } else if (currentStep === 'platform') {
        if (formData.selectedPlatforms.includes('whatsapp')) {
          setCurrentStep('whatsapp')
        } else {
          setCurrentStep('complete')
        }
      } else if (currentStep === 'whatsapp') {
        // Save WhatsApp configuration
        await api.patch('/api/organizations/current', {
          wa_phone_number_id: formData.whatsappPhoneId,
          wa_business_account_id: formData.whatsappBusinessId,
          wa_access_token: formData.whatsappAccessToken,
        })
        setCurrentStep('complete')
      } else if (currentStep === 'complete') {
        router.push('/dashboard')
      }
    } catch {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    if (currentStep === 'whatsapp') {
      setCurrentStep('complete')
    }
  }

  const steps = [
    { id: 'organization', label: t('onboarding.organization') },
    { id: 'platform', label: t('onboarding.platform') },
    { id: 'whatsapp', label: t('onboarding.whatsapp') },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          {t('onboarding.welcomeToAkeed')}
        </h1>
        <p className="text-sm text-slate-600">
          {t('onboarding.letsSetupAccount')}
        </p>
      </div>

      {/* Progress Steps */}
      {currentStep !== 'complete' && (
        <nav aria-label="Progress">
          <ol className="flex flex-wrap items-center justify-center gap-4">
            {steps.map((step, index) => (
              <li key={step.id} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                    steps.findIndex((s) => s.id === currentStep) >= index
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Form Content */}
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

          {/* Step 1: Organization */}
          {currentStep === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                {t('onboarding.createOrganization')}
              </h2>
              <p className="text-sm text-slate-600">
                {t('onboarding.organizationDescription')}
              </p>

              <div>
                <label
                  htmlFor="orgName"
                  className="text-sm font-medium text-slate-700"
                >
                  {t('onboarding.organizationName')}
                </label>
                <div className="relative mt-2">
                  <input
                    type="text"
                    id="orgName"
                    name="orgName"
                    required
                    value={formData.orgName}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
                    placeholder={t('onboarding.organizationNamePlaceholder')}
                  />
                  {formData.orgName ? (
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
                  htmlFor="orgSlug"
                  className="text-sm font-medium text-slate-700"
                >
                  {t('onboarding.organizationSlug')}
                </label>
                <div className="mt-2 flex rounded-xl shadow-sm">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                    app.akeed.com/
                  </span>
                  <div className="relative w-full">
                    <input
                      type="text"
                      id="orgSlug"
                      name="orgSlug"
                      required
                      value={formData.orgSlug}
                      onChange={handleChange}
                      className="block w-full min-w-0 flex-1 rounded-none rounded-r-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
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
          )}

          {/* Step 2: Platform Selection */}
          {currentStep === 'platform' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">
                {t('onboarding.selectPlatforms')}
              </h2>
              <p className="text-sm text-slate-600">
                {t('onboarding.platformsDescription')}
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'shopify', name: 'Shopify', icon: '🛍️' },
                  { id: 'salla', name: 'Salla', icon: '🏪' },
                  { id: 'zid', name: 'Zid', icon: '🛒' },
                  { id: 'woocommerce', name: 'WooCommerce', icon: '🔌' },
                  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
                ].map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`flex items-center justify-center gap-3 rounded-xl border-2 p-6 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 ${
                      formData.selectedPlatforms.includes(platform.id)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <span className="font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: WhatsApp Configuration */}
          {currentStep === 'whatsapp' && (
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
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
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
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
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
                      onChange={handleChange}
                      className="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus-visible:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
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
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-10 w-10 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {t('onboarding.allSet')}
              </h2>
              <p className="text-slate-600">{t('onboarding.readyToStart')}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            {currentStep === 'whatsapp' && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {t('onboarding.skipForNow')}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isLoading
                ? t('onboarding.processing')
                : currentStep === 'complete'
                  ? t('onboarding.gotoDashboard')
                  : t('onboarding.continue')}
            </button>
          </div>
        </div>
    </div>
  )
}
