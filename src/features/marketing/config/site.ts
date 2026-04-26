import type { Tier } from '@/features/marketing/model/tier.model'

export const pricing: { tiers: Tier[] } = {
  tiers: [
    {
      key: 'starter',
      orders: 30,
      price: 0,
      perOrder: 0,
      isFree: true,
      ordersDisplay: '30',
    },
    {
      key: 'pro',
      orders: 1000,
      price: 19,
      perOrder: 0.03,
      ordersDisplay: '1,000',
    },
    {
      key: 'business',
      orders: 3000,
      price: 49,
      perOrder: 0.025,
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
