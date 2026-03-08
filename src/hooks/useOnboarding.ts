import { useMemo, useReducer, useState } from 'react'
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

type FormAction =
  | { type: 'SET_FIELD'; name: string; value: string }
  | { type: 'TOGGLE_PLATFORM'; platform: PlatformId }

function formReducer(state: OnboardingFormData, action: FormAction): OnboardingFormData {
  switch (action.type) {
    case 'SET_FIELD': {
      const next = { ...state, [action.name]: action.value }
      // Derive slug automatically when org name changes — single render
      if (action.name === 'orgName') next.orgSlug = slugify(action.value)
      return next
    }
    case 'TOGGLE_PLATFORM':
      return {
        ...state,
        selectedPlatforms: state.selectedPlatforms.includes(action.platform)
          ? state.selectedPlatforms.filter((p) => p !== action.platform)
          : [...state.selectedPlatforms, action.platform],
      }
    default:
      return state
  }
}

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
  const [formData, dispatch] = useReducer(formReducer, initialFormData)

  const steps = useMemo<OnboardingStepMeta[]>(
    () => [
      { id: 'organization', label: t('onboarding.organization') },
      { id: 'platform', label: t('onboarding.platform') },
      { id: 'whatsapp', label: t('onboarding.whatsapp') },
    ],
    [t]
  )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FIELD', name: e.target.name, value: e.target.value })
  }

  const handlePlatformToggle = (platform: PlatformId) => {
    dispatch({ type: 'TOGGLE_PLATFORM', platform })
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
    } catch (err) {
      console.error('[Onboarding] Step failed:', currentStep, err)
      setError(err instanceof Error ? err.message : t('errors.generic'))
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
