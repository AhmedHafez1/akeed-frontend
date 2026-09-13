import { CREDIT_PRESETS } from '@/shared/config/pricing'
import type { CreditSummary } from './billing.types'

/**
 * Preset sizes are a presentation layer over the server's continuous range —
 * there is no package concept in the API, only `{ min, max, step }` and a unit
 * price. Any preset a config change would make unpurchasable is dropped rather
 * than offered and then rejected at checkout.
 *
 * The ladder itself lives in `shared/config/pricing` because the public pricing
 * section shows the same sizes and must not drift from this one.
 */
const PRESET_CREDITS = CREDIT_PRESETS

export interface CreditPackage {
  credits: number
  totalMinor: number
}

export function derivePackages(
  range: CreditSummary['range'],
  unitPriceMinor: number
): CreditPackage[] {
  return PRESET_CREDITS.filter(
    (credits) =>
      credits >= range.min && credits <= range.max && credits % range.step === 0
  ).map((credits) => ({ credits, totalMinor: credits * unitPriceMinor }))
}
