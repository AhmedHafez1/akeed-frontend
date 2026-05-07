'use client'

import { useState } from 'react'
import { Banner, BlockStack } from '@shopify/polaris'

interface OnboardingAlertsProps {
  errorMessage: string | null
  warningMessage: string | null
}

export function OnboardingAlerts({
  errorMessage,
  warningMessage,
}: OnboardingAlertsProps) {
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState<
    string | null
  >(null)
  const [dismissedWarningMessage, setDismissedWarningMessage] = useState<
    string | null
  >(null)

  const visibleErrorMessage =
    errorMessage && errorMessage !== dismissedErrorMessage ? errorMessage : null
  const visibleWarningMessage =
    warningMessage && warningMessage !== dismissedWarningMessage
      ? warningMessage
      : null

  if (!visibleErrorMessage && !visibleWarningMessage) {
    return null
  }

  return (
    <BlockStack gap="400">
      {visibleErrorMessage && (
        <Banner
          tone="critical"
          onDismiss={() => setDismissedErrorMessage(visibleErrorMessage)}
        >
          <p>{visibleErrorMessage}</p>
        </Banner>
      )}

      {visibleWarningMessage && (
        <Banner
          tone="warning"
          onDismiss={() => setDismissedWarningMessage(visibleWarningMessage)}
        >
          <p>{visibleWarningMessage}</p>
        </Banner>
      )}
    </BlockStack>
  )
}
