import { Icon, Text } from '@shopify/polaris'
import { CheckCircleIcon } from '@shopify/polaris-icons'

interface FeatureRowProps {
  feature: string
  isDisabled?: boolean
}

export function FeatureRow({ feature, isDisabled = false }: FeatureRowProps) {
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-2 text-start">
      <span className="flex h-5 w-5 items-center justify-center">
        <Icon
          source={CheckCircleIcon}
          tone={isDisabled ? 'subdued' : 'success'}
        />
      </span>
      <Text as="span" tone={isDisabled ? 'subdued' : undefined}>
        {feature}
      </Text>
    </div>
  )
}
