/**
 * Dashboard Feature — Public API
 *
 * Barrel export for the dashboard feature module.
 * Consumers should import from here, not from internal paths.
 */

// Domain
export { useDashboard } from './domain/useDashboard'
export type {
  DashboardSkinProps,
  StatusFilterOption,
  TestFeedback,
} from './domain/dashboard.types'

// Individual skins (for direct import if needed)
export { DashboardStandaloneSkin } from './skins/standalone'
export { DashboardEmbeddedSkin } from './skins/embedded'
