import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { api, auth } from '@/lib/auth'
import { getLocaleFromPathname } from '@/lib/locale'
import { slugify } from '@/lib/strings'
import {
  OnboardingFormData,
  OnboardingStep,
  OnboardingStepMeta,
  PlatformId,
} from '@/types/onboarding.model'

const initialFormData: OnboardingFormData = {
  orgName: '',
  orgSlug: '',
  selectedPlatforms: [],
  whatsappPhoneId: '',
  whatsappBusinessId: '',
  whatsappAccessToken: '',
}

export function useOnboarding() {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const locale = getLocaleFromPathname(pathname)

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('organization')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData)

  const steps = useMemo<OnboardingStepMeta[]>(
    () => [
      { id: 'organization', label: t('onboarding.organization') },
      { id: 'platform', label: t('onboarding.platform') },
      { id: 'whatsapp', label: t('onboarding.whatsapp') },
    ],
    [t]
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }))

    if (e.target.name === 'orgName') {
      const slug = slugify(value)
      setFormData((prev) => ({ ...prev, orgSlug: slug }))
    }
  }

  const handlePlatformToggle = (platform: PlatformId) => {
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
        await api.patch('/api/organizations/current', {
          wa_phone_number_id: formData.whatsappPhoneId,
          wa_business_account_id: formData.whatsappBusinessId,
          wa_access_token: formData.whatsappAccessToken,
        })
        setCurrentStep('complete')
      } else if (currentStep === 'complete') {
        router.push(auth.getDashboardPath(locale))
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

  return {
    t,
    locale,
    steps,
    currentStep,
    isLoading,
    error,
    formData,
    handleChange,
    handlePlatformToggle,
    handleNext,
    handleSkip,
  }
}
