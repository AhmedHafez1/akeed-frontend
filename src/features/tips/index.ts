/**
 * Tips Feature — Public API
 *
 * Admin-published tips and feature updates on the merchant dashboard.
 */

export { TipsSection } from './ui/TipsSection'
export { TipCard } from './ui/TipCard'
export type { TipCardProps } from './ui/TipCard'
export { TipEntryEmbedded } from './skins/embedded/TipEntryEmbedded'
export { useTipCards } from './domain/useTipCards'
export { TIP_ACTION_TARGETS, resolveTipHref } from './model/tips.model'
export type {
  TipActionMode,
  TipActionRoute,
  TipCard as TipCardModel,
  TipType,
} from './model/tips.model'
export type { TipCardView, TipLink } from './domain/useTipCards'
