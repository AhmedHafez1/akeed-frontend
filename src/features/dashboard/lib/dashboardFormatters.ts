export function formatDashboardNumber(value: number, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value)
  } catch {
    return String(value)
  }
}

