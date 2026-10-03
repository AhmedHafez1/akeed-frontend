import type { ComponentType } from 'react'
import { EasyOrdersSourcePanel } from '@/features/onboarding'

/** A source's own connection controls, mounted on the order-source tab. */
export type SettingsSourcePanel = ComponentType<{ onChanged?: () => void }>

export interface SettingsSourceSkin {
  /** Under `settings`. */
  nameKey: 'sourceStandalone' | 'sourceEasyOrders'
  /** Under `settings.standalone.page.store`. */
  helpKey: 'sourceHelp' | 'sourceHelpEasyOrders'
  /** Present for a source the merchant connects, disconnects or reconnects. */
  Panel?: SettingsSourcePanel
  /** The source receives orders by itself, so its health is worth showing. */
  showsHealth: boolean
}

/**
 * What the order-source tab shows per platform. The tab reads this record
 * and never names a provider; a new source adds a row here.
 */
const SETTINGS_SOURCE_SKINS: Partial<Record<string, SettingsSourceSkin>> = {
  standalone: {
    nameKey: 'sourceStandalone',
    helpKey: 'sourceHelp',
    showsHealth: false,
  },
  easyorders: {
    nameKey: 'sourceEasyOrders',
    helpKey: 'sourceHelpEasyOrders',
    Panel: EasyOrdersSourcePanel,
    showsHealth: true,
  },
}

/** Null for a platform with no skin: the tab then shows its raw name. */
export function resolveSettingsSourceSkin(
  platformType: string
): SettingsSourceSkin | null {
  // Own keys only: a platform id must never resolve to an inherited member.
  return Object.hasOwn(SETTINGS_SOURCE_SKINS, platformType)
    ? (SETTINGS_SOURCE_SKINS[platformType] ?? null)
    : null
}
