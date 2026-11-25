import type { MessageLanguage } from '@/shared/lib/messageLanguage'

type MockupVariable = 'customer' | 'store' | 'order' | 'total'

export type MockupSegment =
  | string
  | { variable: MockupVariable; bold?: boolean }

interface HeroMockupTemplate {
  lines: ReadonlyArray<ReadonlyArray<MockupSegment>>
  confirm: string
  cancel: string
  /** Synthetic store name in the message's language. */
  store: string
}

const customer = { variable: 'customer' } as const
const store = { variable: 'store' } as const
const order = { variable: 'order' } as const
const total = { variable: 'total' } as const

/**
 * The default registered confirmation template of each language, as Meta
 * delivers it. Mirrors the backend template registry (ar `standard`, en
 * `friendly`, the others `standard_v1`); change both together.
 */
export const HERO_MOCKUP_TEMPLATES: Record<
  MessageLanguage,
  HeroMockupTemplate
> = {
  ar: {
    lines: [
      ['أهلاً بك ', customer, '! 👋'],
      ['شكراً لتسوقك من ', { variable: 'store', bold: true }],
      ['طلبك رقم #', order, ' بقيمة ', total, ' جاهز للشحن.'],
      ['يرجى تأكيد الطلب لنتمكن من إرساله إليك بأسرع وقت.'],
    ],
    confirm: 'تأكيد الطلب',
    cancel: 'إلغاء الطلب',
    store: 'متجر الأناقة',
  },
  en: {
    lines: [
      ['Hi ', customer, '! 👋'],
      ['Thank you for shopping with ', store, '.'],
      ['Your order #', order, ' for ', total, ' is ready to go!'],
      [
        'Please tap the button below to confirm your order so we can ship it immediately.',
      ],
    ],
    confirm: 'Confirm Order',
    cancel: 'Cancel Order',
    store: 'Elegance Store',
  },
  ur: {
    lines: [
      ['السلام علیکم ', customer, '،'],
      [
        store,
        ' پر آپ کا آرڈر ',
        order,
        ' موصول ہو گیا ہے۔ کل رقم ',
        total,
        ' ہے، ادائیگی کیش آن ڈیلیوری ہوگی۔',
      ],
      ['براہِ کرم اپنے آرڈر کی تصدیق کریں۔'],
    ],
    confirm: 'آرڈر کی تصدیق کریں',
    cancel: 'آرڈر منسوخ کریں',
    store: 'نور اسٹور',
  },
  es: {
    lines: [
      ['Hola, ', customer, ':'],
      [
        'Hemos recibido tu pedido ',
        order,
        ' en ',
        store,
        '. El total es de ',
        total,
        ' y lo pagas al recibirlo.',
      ],
      ['Por favor, confirma tu pedido.'],
    ],
    confirm: 'Confirmar pedido',
    cancel: 'Cancelar pedido',
    store: 'Tienda Noor',
  },
  fr: {
    lines: [
      ['Bonjour ', customer, ','],
      [
        'Nous avons bien reçu votre commande ',
        order,
        ' sur ',
        store,
        '. Le total est de ',
        total,
        ', à payer à la livraison.',
      ],
      ['Merci de confirmer votre commande.'],
    ],
    confirm: 'Confirmer la commande',
    cancel: 'Annuler la commande',
    store: 'Boutique Noor',
  },
  tr: {
    lines: [
      ['Merhaba ', customer, ','],
      [
        store,
        ' üzerinden verdiğiniz ',
        order,
        ' numaralı siparişiniz alındı. Toplam tutar ',
        total,
        '; ödeme kapıda yapılacaktır.',
      ],
      ['Lütfen siparişinizi onaylayın.'],
    ],
    confirm: 'Siparişi onayla',
    cancel: 'Siparişi iptal et',
    store: 'Noor Mağazası',
  },
}
