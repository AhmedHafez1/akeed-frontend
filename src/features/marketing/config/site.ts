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

export const features = {
  problems: [
    { key: 'loss', icon: '💸' },
    { key: 'time', icon: '⏰' },
    { key: 'scale', icon: '📈' },
    { key: 'address', icon: '📍' },
  ],
  solutions: [
    { key: 'auto', icon: '⚙️' },
    { key: 'response', icon: '⚡' },
    { key: 'fast-confirm', icon: '🚀' },
    { key: 'location', icon: '🛡️' },
    { key: 'save-time', icon: '⌛' },
    { key: 'integration', icon: '📲' },
    { key: 'natural', icon: '💬' },
    { key: 'analytics', icon: '📊' },
  ],
}

export interface HowItWorksStep {
  key: string
  icon: LucideIcon
}

/*
 * The two flows are deliberately different lengths. Standalone has a real
 * approval step before anything can be sent, and collapsing it to match
 * Shopify's three would hide the one thing an early-access visitor most needs
 * to know.
 */
export const howItWorksByPath: Record<AcquisitionPath, HowItWorksStep[]> = {
  shopify: [
    { key: 'connect', icon: ShoppingBag },
    { key: 'automation', icon: MessageCircle },
    { key: 'ship', icon: Truck },
  ],
  standalone: [
    { key: 'request', icon: UserPlus },
    { key: 'approve', icon: BadgeCheck },
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
  { key: 'arabic_first', icon: Languages },
  { key: 'data_protection', icon: Lock },
]

export const faqs = [
  { key: 'supported_platforms' },
  { key: 'setup_time' },
  { key: 'standalone_approval' },
  { key: 'own_whatsapp_number' },
  { key: 'official_apis' },
  { key: 'customize_messages' },
  { key: 'customer_no_reply' },
  { key: 'credit_usage' },
]
