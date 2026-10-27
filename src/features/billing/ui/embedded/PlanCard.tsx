import { useId } from 'react'
import { Badge, InlineStack } from '@shopify/polaris'
import { useTranslations } from 'next-intl'
import type {
  ShopifyPlanCard,
  ShopifyPlanId,
} from '@/features/billing/domain/shopifyPlans'
import { PlanAllowanceSummary } from './PlanAllowanceSummary'

/** Selected and resting surfaces of a radio card, from Polaris tokens. */
export function radioSurface(isSelected: boolean) {
  return {
    background: isSelected
      ? 'var(--p-color-bg-surface-selected)'
      : 'var(--p-color-bg-surface)',
    boxShadow: isSelected
      ? 'inset 0 0 0 var(--p-border-width-050) var(--p-color-bg-fill-brand)'
      : 'inset 0 0 0 var(--p-border-width-025) var(--p-color-border)',
    borderRadius: 'var(--p-border-radius-300)',
    outlineColor: 'var(--p-color-border-focus)',
  }
}

export const RADIO_SURFACE_CLASS =
  'cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2'

interface PlanCardProps {
  plan: ShopifyPlanCard
  /** The radio group's shared `name`. */
  groupName: string
  isSelected: boolean
  /** The plan the store pays for now. */
  isCurrent?: boolean
  onSelect: (planId: ShopifyPlanId) => void
}

/**
 * One paid plan in the picker: a radio whose label is the whole card, with a
 * badge on the plan the store pays for now.
 */
export function PlanCard({
  plan,
  groupName,
  isSelected,
  isCurrent = false,
  onSelect,
}: PlanCardProps) {
  const t = useTranslations('billing.embeddedPlans')
  const id = useId()

  return (
    <div
      className={`h-full p-4 ${RADIO_SURFACE_CLASS}`}
      style={radioSurface(isSelected)}
      onClick={() => onSelect(plan.id)}
    >
      <PlanAllowanceSummary
        id={id}
        name={plan.name}
        amount={plan.amount}
        currencyCode={plan.currencyCode}
        includedVerifications={plan.includedVerifications}
        trailing={
          <InlineStack gap="200" blockAlign="center" wrap={false}>
            {isCurrent && <Badge tone="info">{t('currentPlan')}</Badge>}
            <input
              type="radio"
              name={groupName}
              value={plan.id}
              checked={isSelected}
              onChange={() => onSelect(plan.id)}
              aria-labelledby={`${id}-name`}
              aria-describedby={`${id}-details`}
              className="m-0 h-[18px] w-[18px] shrink-0 cursor-pointer"
              style={{ accentColor: 'var(--p-color-bg-fill-brand)' }}
            />
          </InlineStack>
        }
      />
    </div>
  )
}
