'use client'

import { useCallback, useMemo, type ComponentType } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { BlockStack, Layout, Page } from '@shopify/polaris'
import { OnboardingPageSkeleton } from '@/shared/layout/skeletons'
import { useAppBridgeLoading } from '@/shared/hooks/useAppBridgeLoading'
import { useCooldown } from '@/shared/hooks/useCooldown'
import {
  fillTemplateLines,
  templateReplyTone,
} from '@/shared/lib/templateMessage'
import {
  EasyOrdersConnectPage,
  LANGUAGE_OPTION_DEFINITIONS,
  ONBOARDING_FLOW_STEPS,
  OnboardingAlerts,
  OnboardingStepCounter,
  QuickSetupStep,
  SetupSuccessStep,
  StandaloneOnboardingPage,
  TestMessageStep,
  WooCommerceConnectPage,
  buildTestTimeline,
  useEmbeddedOnboarding,
  useOnboardingSourceSkin,
  type OnboardingSourceSkin,
  type OnboardingTestError,
} from '@/features/onboarding'
import { useAkeedMode } from '@/shared/hooks/useAkeedMode'
import { getLocaleFromPathname } from '@/shared/lib/locale'

const TEST_ERROR_KEYS: Record<OnboardingTestError, string> = {
  cooldown: 'test.errors.cooldown',
  daily_limit: 'test.errors.dailyLimit',
  phone_missing: 'test.errors.phoneMissing',
  send_failed: 'test.errors.sendFailed',
  skip_failed: 'test.errors.skipFailed',
}

/**
 * One route, two flows. Only the flow for the current mode is mounted: the
 * embedded hooks share the onboarding-test query with standalone, and left
 * running they would react to a standalone confirmation and send again.
 */
export default function OnboardingPage() {
  const { isEmbedded, isLoading: isModeLoading } = useAkeedMode()

  if (isModeLoading) return <OnboardingPageSkeleton variant="setup" />
  return isEmbedded ? <EmbeddedOnboarding /> : <SourceOnboarding />
}

/** The setup page of each source skin. */
const SOURCE_SETUP_PAGES: Record<OnboardingSourceSkin, ComponentType> = {
  standalone: StandaloneOnboardingPage,
  easyorders: EasyOrdersConnectPage,
  woocommerce: WooCommerceConnectPage,
}

/** Non-embedded setup, in the skin of the organization's order source. */
function SourceOnboarding() {
  const SetupPage = SOURCE_SETUP_PAGES[useOnboardingSourceSkin()]

  return <SetupPage />
}

function EmbeddedOnboarding() {
  const t = useTranslations('onboarding')

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = getLocaleFromPathname(pathname ?? '')

  const languageOptions = useMemo(
    () =>
      LANGUAGE_OPTION_DEFINITIONS.map(({ labelKey, value }) => ({
        label: t(labelKey),
        value,
      })),
    [t]
  )

  const messages = useMemo(
    () => ({
      prefillWarning: t('setup.prefillWarning'),
      storeNameRequired: t('setup.storeNameRequired'),
      phoneInvalid: t('setup.phoneInvalid'),
      setupSaveError: t('setup.saveError'),
    }),
    [t]
  )

  const {
    isInitialLoading,
    step,
    errorBanner,
    prefillWarning,
    isFreePlanAvailable,
    settings,
    test,
    goToDashboard,
    handleChangeNumber,
  } = useEmbeddedOnboarding({
    isEmbedded: true,
    isModeLoading: false,
    locale,
    requestedStep: searchParams.get('step'),
    router,
    messages,
  })

  const testState = test.testState
  const cooldownSeconds = useCooldown(testState?.resendAvailableAt)

  const formatTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(iso)),
    [locale]
  )

  const timeline = useMemo(
    () =>
      buildTestTimeline(
        testState?.test ?? null,
        {
          sending: t('test.timeline.sending'),
          sent: t('test.timeline.sent'),
          awaitingDelivery: t('test.timeline.awaitingDelivery'),
          delivered: t('test.timeline.delivered'),
          tapConfirm: t('test.timeline.tapConfirm'),
          confirmed: t('test.timeline.confirmed'),
          canceledNote: t('test.timeline.canceledNote'),
          autoDetect: t('test.timeline.autoDetect'),
        },
        formatTime
      ),
    [formatTime, t, testState?.test]
  )

  const preview = useMemo(() => {
    if (!testState) return null
    const { sample } = testState
    const total = new Intl.NumberFormat(
      testState.language === 'ar' ? 'ar-EG' : 'en-US',
      { style: 'currency', currency: sample.currency, maximumFractionDigits: 0 }
    ).format(Number(sample.total))
    return {
      paragraphs: fillTemplateLines(testState.message, {
        customer: sample.customerName,
        store: sample.storeName || settings.storeName,
        order: sample.orderNumber,
        total,
      }),
      buttons: testState.message.buttons.map((label, index) => ({
        label,
        tone: templateReplyTone(index),
      })),
      total,
      dir: testState.message.direction,
      timeLabel: formatTime(testState.test?.sentAt ?? new Date().toISOString()),
    }
  }, [formatTime, settings.storeName, testState])

  const handleEditMessage = useCallback(() => {
    const search = new URLSearchParams(window.location.search)
    search.delete('step')
    search.set('tab', 'message')
    router.push(`/${locale}/settings?${search.toString()}`)
  }, [locale, router])

  useAppBridgeLoading(isInitialLoading)

  if (isInitialLoading) {
    return <OnboardingPageSkeleton variant="setup" />
  }

  const status = testState?.test?.status
  const flowIndex = ONBOARDING_FLOW_STEPS.indexOf(
    step as (typeof ONBOARDING_FLOW_STEPS)[number]
  )

  return (
    <Page narrowWidth={step !== 'test'}>
      <Layout>
        <Layout.Section>
          <BlockStack gap="600">
            {step !== 'success' && (
              <OnboardingStepCounter
                currentIndex={flowIndex}
                steps={[t('flow.quickSetup'), t('flow.tryMessage')]}
              />
            )}

            <OnboardingAlerts
              errorMessage={errorBanner}
              warningMessage={prefillWarning}
            />

            {step === 'setup' && (
              <QuickSetupStep
                messages={{
                  heading: t('setup.heading'),
                  subheading: t('setup.subheading'),
                  freePlanTitle: t('setup.freePlanTitle'),
                  freePlanDescription: t('setup.freePlanDescription'),
                  freePlanUsedTitle: t('setup.freePlanUsedTitle'),
                  freePlanUsedDescription: t('setup.freePlanUsedDescription'),
                  storeNameLabel: t('setup.storeNameLabel'),
                  languageLabel: t('setup.languageLabel'),
                  phoneLabel: t('setup.phoneLabel'),
                  phoneHelp: t('setup.phoneHelp'),
                  autoVerifyLabel: t('setup.autoVerifyLabel'),
                  autoVerifyDescription: t('setup.autoVerifyDescription'),
                  autoVerifyConsent: t('setup.autoVerifyConsent'),
                  submitLabel: t('setup.submit'),
                  durationHint: t('setup.durationHint'),
                }}
                languageOptions={languageOptions}
                isFreePlanAvailable={isFreePlanAvailable}
                storeName={settings.storeName}
                storeNameError={settings.storeNameError}
                defaultLanguage={settings.defaultLanguage}
                merchantPhone={settings.merchantPhone}
                phoneError={settings.phoneError}
                isAutoVerifyEnabled={settings.isAutoVerifyEnabled}
                isSubmitting={settings.isSubmitting}
                onStoreNameChange={settings.handleStoreNameChange}
                onLanguageChange={settings.setDefaultLanguage}
                onMerchantPhoneChange={settings.handleMerchantPhoneChange}
                onAutoVerifyChange={settings.setIsAutoVerifyEnabled}
                onSubmit={settings.handleSubmitSetup}
              />
            )}

            {step === 'test' && (
              <TestMessageStep
                messages={{
                  heading: t('test.heading'),
                  subheading: t('test.subheading'),
                  sentToLabel: t('test.sentTo'),
                  changeNumber: t('test.changeNumber'),
                  freeNote: t('test.freeNote'),
                  resend: t('test.resend'),
                  resendIn: (seconds) => t('test.resendIn', { seconds }),
                  skip: t('test.skip'),
                  errorMessage: test.error
                    ? t(TEST_ERROR_KEYS[test.error])
                    : null,
                  phoneSenderName: t('test.phone.senderName'),
                  phoneSenderStatus: t('test.phone.senderStatus'),
                  phoneAvatarAlt: t('test.phone.avatarAlt'),
                  phoneDayLabel: t('test.phone.today'),
                }}
                phone={testState?.phone ?? settings.merchantPhone}
                timeline={timeline}
                previewParagraphs={preview?.paragraphs ?? []}
                previewButtons={preview?.buttons ?? []}
                previewTimeLabel={preview?.timeLabel ?? ''}
                previewDir={preview?.dir ?? 'rtl'}
                isAwaitingTap={
                  status === 'sent' ||
                  status === 'delivered' ||
                  status === 'read'
                }
                isFailed={status === 'failed' || status === 'expired'}
                failedMessage={t('test.failed')}
                cooldownSeconds={cooldownSeconds}
                canResend={(testState?.sendsRemainingToday ?? 1) > 0}
                isSending={test.isSending}
                isSkipping={test.isSkipping}
                onResend={test.resend}
                onSkip={test.skip}
                onChangeNumber={handleChangeNumber}
              />
            )}

            {step === 'success' && (
              <SetupSuccessStep
                messages={{
                  eyebrow: t('success.eyebrow'),
                  heading: t('success.heading'),
                  subheading: t('success.subheading'),
                  pipeline: [
                    {
                      title: t('success.pipeline.order.title'),
                      description: t('success.pipeline.order.description'),
                    },
                    {
                      title: t('success.pipeline.message.title'),
                      description: t('success.pipeline.message.description'),
                    },
                    {
                      title: t('success.pipeline.update.title'),
                      description: t('success.pipeline.update.description'),
                    },
                  ],
                  exampleTitle: t('success.exampleTitle'),
                  exampleOrderNumber: `#${testState?.sample.orderNumber ?? 'TEST-1'}`,
                  exampleOrderDetails: t('success.exampleOrderDetails', {
                    customer: testState?.sample.customerName ?? '',
                    total: preview?.total ?? '',
                  }),
                  exampleTag: 'akeed-confirmed',
                  dashboardCta: t('success.dashboardCta'),
                  editMessageCta: t('success.editMessageCta'),
                }}
                onGoToDashboard={goToDashboard}
                onEditMessage={handleEditMessage}
              />
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
