import { Badge, InlineStack } from '@shopify/polaris'
import { useTranslations } from 'next-intl'

interface ConfirmationStatusFlagsProps {
  autoConfirmStatus: boolean
  followUpStatus?: boolean
  quietHoursConfigured?: boolean
}

export function ConfirmationStatusFlags({
  autoConfirmStatus: activeStatus,
  followUpStatus,
  quietHoursConfigured,
}: ConfirmationStatusFlagsProps) {
  const t = useTranslations('dashboard.statusCard')
  return (
    <InlineStack align="space-between" blockAlign="center" gap="400">
      <Badge tone={activeStatus ? 'success' : 'attention'} size="large">
        {activeStatus ? t('activeLabel') : t('inactiveLabel')}
      </Badge>
      <Badge tone={followUpStatus ? 'success' : 'read-only'} size="large">
        {followUpStatus ? t('followUpActiveLabel') : t('followUpInactiveLabel')}
      </Badge>
      <Badge tone={quietHoursConfigured ? 'success' : 'read-only'} size="large">
        {quietHoursConfigured
          ? t('quietHoursActiveLabel')
          : t('quietHoursInactiveLabel')}
      </Badge>
    </InlineStack>
  )
}
