/**
 * Tips Feature — Public API
 *
 * Admin-published tips and feature updates on the merchant dashboard.
 */

export { TipsSection } from './ui/TipsSection'
export { TipCard } from './ui/TipCard'
export type { TipCardProps } from './ui/TipCard'
export { TipsSectionEmbedded } from './skins/embedded/TipsSectionEmbedded'
export { TIP_ACTION_TARGETS, resolveTipHref } from './model/tips.model'
export type {
  TipActionMode,
  TipActionRoute,
  TipCard as TipCardModel,
  TipType,
} from './model/tips.model'
export type { TipLink } from './domain/useTipCards'
