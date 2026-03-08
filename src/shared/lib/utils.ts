import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes without conflicts
 * Example: cn('px-2 py-1', 'px-3') => 'py-1 px-3'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format Egyptian phone number
 * Input: "01012345678" or "201012345678"
 * Output: "+20 101 234 5678"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const withCountryCode = cleaned.startsWith('20') ? cleaned : `20${cleaned}`

  return `+${withCountryCode.slice(0, 2)} ${withCountryCode.slice(2, 5)} ${withCountryCode.slice(5, 8)} ${withCountryCode.slice(8)}`
}

/**
 * Validate Egyptian phone number
 * Accepts: 01012345678, 201012345678, +201012345678
 */
export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  const pattern = /^(20)?(10|11|12|15)[0-9]{8}$/
  return pattern.test(cleaned)
}

/**
 * Format currency for Egyptian market
 */
export function formatCurrency(
  amount: number,
  locale: string = 'ar-EG'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Sleep utility for retry logic
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await sleep(initialDelay * Math.pow(2, i))
      }
    }
  }

  throw lastError!
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .slice(0, 500) // Limit length
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Get base URL based on environment
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  return `http://localhost:${process.env.PORT || 3001}`
}
