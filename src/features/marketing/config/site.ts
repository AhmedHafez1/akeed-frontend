import type { Tier } from '@/features/marketing/model/tier.model'
import { BILLING_PLANS } from '@/shared/config/pricing'

const { starter, basic, pro, business } = BILLING_PLANS

export const pricing: { tiers: Tier[] } = {
  tiers: [
    {
      key: 'starter',
      orders: starter.includedVerifications,
      price: starter.price,
      isFree: starter.isFree,
      ordersDisplay: '30',
    },
    {
      key: 'basic',
      orders: basic.includedVerifications,
      price: basic.price,
      ordersDisplay: '300',
    },
    {
      key: 'pro',
      orders: pro.includedVerifications,
      price: pro.price,
      ordersDisplay: '1,000',
    },
    {
      key: 'business',
      orders: business.includedVerifications,
      price: business.price,
      ordersDisplay: '3,000',
    },
  ],
}

export const features = {
  problems: [
    { key: 'loss', icon: '💸' },
    { key: 'time', icon: '⏰' },
    { key: 'scale', icon: '📈' },
    { key: 'address', icon: '📍' },
  ],
  howItWorks: [
    { key: 'connect', icon: '🔗' },
    { key: 'automation', icon: '💬' },
    { key: 'ship', icon: '🚚' },
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

export const faqs = [
  { key: 'easy_integration' },
  { key: 'whatsapp' },
  { key: 'arabic' },
  { key: 'whatsapp_api' },
  { key: 'unconfirmed_order' },
  { key: 'customize_messages' },
]
