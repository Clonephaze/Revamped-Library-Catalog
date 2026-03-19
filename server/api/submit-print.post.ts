import { submitPrint } from '../utils/sheets'

const LIMITS = {
  patron: 100,
  contact: 200,
  label: 200,
  color: 50,
} as const

// Simple in-memory rate limiter: 1 submission per IP per 60 seconds
const RATE_WINDOW_MS = 60_000
const recentSubmissions = new Map<string, number>()

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now()
  for (const [ip, ts] of recentSubmissions) {
    if (now - ts > RATE_WINDOW_MS) recentSubmissions.delete(ip)
  }
}, 300_000)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /[\d]{7,}/

function isValidContact(value: string): boolean {
  const cleaned = value.replace(/[\s\-().+]/g, '')
  return EMAIL_RE.test(value) || PHONE_RE.test(cleaned)
}

export default defineEventHandler(async (event) => {
  // Rate limit by IP
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const lastSubmit = recentSubmissions.get(ip)
  if (lastSubmit && Date.now() - lastSubmit < RATE_WINDOW_MS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Please wait a minute before submitting another request.',
    })
  }

  const body = await readBody(event)

  const { patron, label, color, contact } = body ?? {}

  const missing = (['patron', 'label', 'color', 'contact'] as const).filter(
    (field) => !body?.[field]?.toString().trim(),
  )

  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}.`,
    })
  }

  const sanitized = {
    patron: String(patron).trim().slice(0, LIMITS.patron),
    label: String(label).trim().slice(0, LIMITS.label),
    color: String(color).trim().slice(0, LIMITS.color),
    contact: String(contact).trim().slice(0, LIMITS.contact),
  }

  if (!isValidContact(sanitized.contact)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please enter a valid email address or phone number.',
    })
  }

  try {
    await submitPrint(sanitized)
    recentSubmissions.set(ip, Date.now())

    return {
      success: true,
      details: {
        patron: sanitized.patron,
        label: sanitized.label,
        color: sanitized.color,
      },
    }
  } catch (error) {
    console.error('[POST /api/submit-print]', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to submit print request. Please try again.',
    })
  }
})
