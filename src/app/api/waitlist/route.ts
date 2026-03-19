import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { z } from 'zod'
import * as libphonenumber from 'google-libphonenumber'

export const runtime = 'nodejs'

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance()

const waitlistRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .refine((val) => {
      try {
        const parsed = phoneUtil.parse(val, 'EG')
        return phoneUtil.isValidNumber(parsed)
      } catch {
        return false
      }
    }, 'Invalid phone number format')
    .transform((val) => {
      try {
        const parsed = phoneUtil.parse(val, 'EG')
        return phoneUtil.format(parsed, libphonenumber.PhoneNumberFormat.E164)
      } catch {
        return val
      }
    }),
  monthlyOrders: z.string().trim().min(1).max(50),
  platform: z.string().trim().max(80).optional(),
  locale: z.enum(['ar', 'en']).optional(),
})

const WAITLIST_RATE_LIMIT_WINDOW_MS = 60_000
const WAITLIST_RATE_LIMIT_MAX_REQUESTS = 6

const waitlistRateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>()

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    throw new Error(`[Waitlist] Missing required environment variable: ${name}`)
  }
  return value
}

function resolveClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  return 'unknown'
}

function cleanupExpiredRateLimitEntries(now: number): void {
  for (const [ip, entry] of waitlistRateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      waitlistRateLimitStore.delete(ip)
    }
  }
}

function isRateLimited(ip: string, now: number): boolean {
  cleanupExpiredRateLimitEntries(now)

  const existing = waitlistRateLimitStore.get(ip)
  if (!existing || existing.resetAt <= now) {
    waitlistRateLimitStore.set(ip, {
      count: 1,
      resetAt: now + WAITLIST_RATE_LIMIT_WINDOW_MS,
    })
    return false
  }

  if (existing.count >= WAITLIST_RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  existing.count += 1
  waitlistRateLimitStore.set(ip, existing)
  return false
}

export async function POST(request: NextRequest) {
  const now = Date.now()
  const clientIp = resolveClientIp(request)

  if (isRateLimited(clientIp, now)) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again in a minute.',
      },
      { status: 429 }
    )
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const parsed = waitlistRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission fields' },
        { status: 400 }
      )
    }

    const { name, phone, platform, monthlyOrders, locale } = parsed.data

    const serviceAccountEmail = getRequiredEnvVar(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL'
    )
    const privateKey = getRequiredEnvVar('GOOGLE_PRIVATE_KEY').replace(
      /\\n/g,
      '\n'
    )
    const spreadsheetId = getRequiredEnvVar('GOOGLE_SHEET_ID')

    // Configure Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Prepare the data row
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const values = [
      [
        timestamp,
        name,
        phone,
        platform && platform.length > 0 ? platform : '-',
        monthlyOrders,
        locale ?? 'ar',
      ],
    ]

    // Append data to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Waitlist!A:G', // Sheet name and columns
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Successfully added to waitlist',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Waitlist] Failed to submit:', error)
    return NextResponse.json(
      { error: 'Failed to submit. Please try again.' },
      { status: 500 }
    )
  }
}
