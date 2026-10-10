import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Languages,
  Lock,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export interface HowItWorksStep {
  key: string
  icon: LucideIcon
}

/*
 * The same four steps for every order source; message keys live under
 * `how_it_works.steps.<key>`.
 */
export const howItWorksSteps: HowItWorksStep[] = [
  { key: 'order', icon: ShoppingCart },
  { key: 'message', icon: MessageCircle },
  { key: 'reply', icon: UserRound },
  { key: 'update', icon: CheckCircle2 },
]

export interface TrustPoint {
  key: string
  icon: LucideIcon
}

export const trustPoints: TrustPoint[] = [
  { key: 'official_whatsapp', icon: ShieldCheck },
  { key: 'shopify_approved', icon: BadgeCheck },
  { key: 'independent_stores', icon: Building2 },
  { key: 'automated_confirmation', icon: MessageCircle },
  { key: 'arabic_first', icon: Languages },
  { key: 'data_protection', icon: Lock },
]

export const faqs = [
  { key: 'supported_platforms' },
  { key: 'setup_time' },
  { key: 'standalone_start' },
  { key: 'own_whatsapp_number' },
  { key: 'official_apis' },
  { key: 'customize_messages' },
  { key: 'customer_no_reply' },
  { key: 'credit_usage' },
]
