import { Banner, Button } from '@shopify/polaris'

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
    <Banner tone={isAtLimit ? 'critical' : 'warning'} title={title}>
      <div className="flex flex-col gap-3">
        <p>{message}</p>
        <div className="flex justify-end">
          <Button onClick={onManage}>{manageLabel}</Button>
        </div>
      </div>
    </Banner>
  )
}
