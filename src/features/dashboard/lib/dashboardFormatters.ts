export function formatDashboardNumber(value: number, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value)
  } catch {
    return String(value)
  }
}

export function formatDashboardPercent(value: number, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value / 100)
  } catch {
    return `${value}%`
  }
}

export function formatDashboardMoney(
  amount: number,
  currency: string,
  locale?: string
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}
