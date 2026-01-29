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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('onboarding.welcomeToAkeed')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('onboarding.letsSetupAccount')}
          </p>
        </div>

        {/* Progress Steps */}
        {currentStep !== 'complete' && (
          <nav aria-label="Progress">
            <ol className="flex items-center justify-center space-x-5">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      steps.findIndex((s) => s.id === currentStep) >= index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="ml-2 hidden text-sm font-medium text-gray-900 sm:inline">
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Form Content */}
        <div className="rounded-lg bg-white px-8 py-10 shadow">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Step 1: Organization */}
          {currentStep === 'organization' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('onboarding.createOrganization')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('onboarding.organizationDescription')}
              </p>

              <div>
                <label
                  htmlFor="orgName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('onboarding.organizationName')}
                </label>
                <input
                  type="text"
                  id="orgName"
                  name="orgName"
                  required
                  value={formData.orgName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  placeholder={t('onboarding.organizationNamePlaceholder')}
                />
              </div>

              <div>
                <label
                  htmlFor="orgSlug"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('onboarding.organizationSlug')}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                    app.akeed.com/
                  </span>
                  <input
                    type="text"
                    id="orgSlug"
                    name="orgSlug"
                    required
                    value={formData.orgSlug}
                    onChange={handleChange}
                    className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                    placeholder="my-company"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Platform Selection */}
          {currentStep === 'platform' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t('onboarding.selectPlatforms')}
              </h2>
              <p className="text-sm text-gray-600">
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
                    className={`flex items-center justify-center gap-3 rounded-lg border-2 p-6 text-center transition-all ${
                      formData.selectedPlatforms.includes(platform.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
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
              <h2 className="text-2xl font-bold text-gray-900">
                {t('onboarding.configureWhatsApp')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('onboarding.whatsappDescription')}
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="whatsappPhoneId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('onboarding.phoneNumberId')}
                  </label>
                  <input
                    type="text"
                    id="whatsappPhoneId"
                    name="whatsappPhoneId"
                    value={formData.whatsappPhoneId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsappBusinessId"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('onboarding.businessAccountId')}
                  </label>
                  <input
                    type="text"
                    id="whatsappBusinessId"
                    name="whatsappBusinessId"
                    value={formData.whatsappBusinessId}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="whatsappAccessToken"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('onboarding.accessToken')}
                  </label>
                  <input
                    type="password"
                    id="whatsappAccessToken"
                    name="whatsappAccessToken"
                    value={formData.whatsappAccessToken}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  💡 {t('onboarding.whatsappHelp')}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-10 w-10 text-green-600"
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
              <h2 className="text-2xl font-bold text-gray-900">
                {t('onboarding.allSet')}
              </h2>
              <p className="text-gray-600">{t('onboarding.readyToStart')}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-between">
            {currentStep === 'whatsapp' && (
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t('onboarding.skipForNow')}
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
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
    </div>
  )
}
