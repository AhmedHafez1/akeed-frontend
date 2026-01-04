import { SiteConfig } from '@/types'
import { Tier } from '@/types/tier.model'

export const siteConfig: SiteConfig = {
  name: 'Akeed',
  description: 'Smart WhatsApp bot for COD order verification',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/images/og-image.jpg',
  links: {
    whatsapp: `https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_WHATSAPP}`,
    facebook: 'https://facebook.com/yourpage',
    instagram: 'https://instagram.com/yourpage',
    linkesdin: 'https://linkedin.com/company/yourpage',
  },
}

export const pricing: { tiers: Tier[] } = {
  tiers: [
    {
      key: 'trial',
      orders: 20,
      price: 0,
      perOrder: 0,
      isFree: true,
      ordersDisplay: null, // Will show free badge
    },
    {
      key: 'growth',
      orders: 200,
      price: 299,
      perOrder: 1.5,
      ordersDisplay: '200',
    },
    {
      key: 'pro',
      orders: 500,
      price: 599,
      perOrder: 1.2,
      saving: 20,
      ordersDisplay: '500',
    },
    {
      key: 'merchant',
      orders: 1000,
      price: 999,
      perOrder: 1,
      saving: 50,
      ordersDisplay: '1000',
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
    { key: 'automation', icon: '🤖' },
    { key: 'ship', icon: '🚚' },
  ],
  solutions: [
    { key: 'auto', icon: '🤖' },
    { key: 'response', icon: '⚡' },
    { key: 'fast-confirm', icon: '🚀' },
    { key: 'location', icon: '🌍' },
    { key: 'save-time', icon: '⌛' },
    { key: 'integration', icon: '🔗' },
    { key: 'natural', icon: '💬' },
    { key: 'analytics', icon: '📊' },
  ],
}

export const testimonials = [
  {
    name: 'Ahmed Mahmoud',
    store: 'Electronics Store',
    orders: '850+',
    confirmationsRaise: '+34% Confirmations',
  },
  {
    name: 'Omar Sayed',
    store: 'Clothes Store',
    orders: '600+',
    confirmationsRaise: '+27% Confirmations',
  },
]

export const faqs = [
  { key: 'easy_integration' },
  { key: 'arabic' },
  { key: 'whatsapp_api' },
  { key: 'unconfirmed_order' },
  { key: 'customize_messages' },
]
