import {
  BadgeCheck,
  Building2,
  ClipboardList,
  Languages,
  Lock,
  MessageCircle,
  PhoneCall,
  Send,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { AcquisitionPath } from '@/features/marketing/domain/acquisitionPaths'

export interface HowItWorksStep {
  key: string
  icon: LucideIcon
}

/*
 * Both flows are three steps. Standalone accounts are active with their launch
 * credits as soon as the email address is verified, so there is no waiting
 * step to show.
 */
export const howItWorksByPath: Record<AcquisitionPath, HowItWorksStep[]> = {
  shopify: [
    { key: 'connect', icon: ShoppingBag },
    { key: 'automation', icon: MessageCircle },
    { key: 'ship', icon: Truck },
  ],
  standalone: [
    { key: 'request', icon: UserPlus },
    { key: 'create', icon: ClipboardList },
    { key: 'send', icon: Send },
  ],
}

export interface Audience {
  key: string
  icon: LucideIcon
  path: AcquisitionPath
}

export const audiences: Audience[] = [
  { key: 'shopify', icon: Store, path: 'shopify' },
  { key: 'own_store', icon: Building2, path: 'standalone' },
  { key: 'manual', icon: PhoneCall, path: 'standalone' },
  { key: 'high_cod', icon: Truck, path: 'standalone' },
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
