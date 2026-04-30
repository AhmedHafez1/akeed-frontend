export type TemplateLanguage = 'en' | 'ar'

export interface TemplatePreviewData {
  greeting: string
  body: string
  totalLabel: string
  confirmButton: string
  cancelButton: string
}

const templates: Record<TemplateLanguage, TemplatePreviewData> = {
  en: {
    greeting: 'Hello',
    body: 'We have received your order #{order_number} with Cash on Delivery.',
    totalLabel: 'Total Price: {total}',
    confirmButton: 'Confirm',
    cancelButton: 'Cancel',
  },
  ar: {
    greeting: 'السلام عليكم',
    body: 'تم استلام طلبك رقم #{order_number} والدفع عند الاستلام',
    totalLabel: 'إجمالي السعر: {total}',
    confirmButton: 'تأكيد',
    cancelButton: 'إلغاء',
  },
}

export const sampleData = {
  order_number: '1042',
  total: '129.00 EGP',
}

export function getTemplateContent(
  language: TemplateLanguage
): TemplatePreviewData {
  return templates[language]
}

export function renderTemplateBody(
  template: TemplatePreviewData,
  data: { order_number: string; total: string }
): string {
  const body = template.body.replace('{order_number}', data.order_number)
  const totalLine = template.totalLabel.replace('{total}', data.total)
  return `${template.greeting}\n${body}\n${totalLine}`
}
