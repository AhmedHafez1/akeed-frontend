/**
 * Skin Resolver for the Dashboard Feature
 *
 * Maps AkeedMode → Dashboard skin component.
 * This is the ONLY place where mode is mapped to UI.
 * No `if (isEmbedded)` should ever appear inside JSX.
 */

import type { ComponentType } from 'react'
import type { AkeedMode } from '@/hooks/useAkeedMode'
import type { DashboardSkinProps } from '../domain/dashboard.types'
import { DashboardStandaloneSkin } from './standalone'
import { DashboardEmbeddedSkin } from './embedded'

const SKIN_MAP: Record<AkeedMode, ComponentType<DashboardSkinProps>> = {
  STANDALONE: DashboardStandaloneSkin,
  EMBEDDED: DashboardEmbeddedSkin,
}

/**
 * Returns the correct dashboard skin component for the given mode.
 *
 * Usage in a page:
 * ```tsx
 * const Skin = resolveDashboardSkin(mode)
 * return <Skin {...skinProps} />
 * ```
 */
export function resolveDashboardSkin(
  mode: AkeedMode
): ComponentType<DashboardSkinProps> {
  return SKIN_MAP[mode]
}
