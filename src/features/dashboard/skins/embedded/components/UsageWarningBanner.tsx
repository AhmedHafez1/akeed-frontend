import { Banner } from '@shopify/polaris'

interface UsageWarningBannerProps {
  title: string
  message: string
  manageLabel: string
  isAtLimit: boolean
  onManage: () => void
}

export function UsageWarningBanner({
  title,
  message,
  manageLabel,
  isAtLimit,
  onManage,
}: UsageWarningBannerProps) {
  return (
    <Banner
      tone={isAtLimit ? 'critical' : 'warning'}
      title={title}
      action={{
        content: manageLabel,
        onAction: onManage,
      }}
    >
      <p>{message}</p>
    </Banner>
  )
}
