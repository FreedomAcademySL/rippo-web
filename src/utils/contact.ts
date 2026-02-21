const CONTACT_APP = (import.meta.env.VITE_CONTACT_APP ?? '').toLowerCase().trim()
const CONTACT_NUMBER = import.meta.env.VITE_CONTACT_NUMBER ?? ''
const TELEGRAM_USER = import.meta.env.VITE_TELEGRAM_USER ?? ''

if (import.meta.env.DEV) {
  if (!CONTACT_APP) console.warn('[contact] VITE_CONTACT_APP is not defined, defaulting to WhatsApp')
  if (!CONTACT_NUMBER) console.error('[contact] VITE_CONTACT_NUMBER is not defined')
  if (CONTACT_APP === 'telegram' && !TELEGRAM_USER) {
    console.error('[contact] VITE_TELEGRAM_USER is not defined (required for Telegram mode)')
  }
}

export function getContactAppName(): string {
  return CONTACT_APP === 'telegram' ? 'Telegram' : 'WhatsApp'
}

export function getDisplayNumber(): string {
  return CONTACT_NUMBER.startsWith('+') ? CONTACT_NUMBER : `+${CONTACT_NUMBER}`
}

export function buildContactUrl(message: string): string {
  const encoded = encodeURIComponent(message)

  if (CONTACT_APP === 'telegram') {
    return `https://t.me/${TELEGRAM_USER}?text=${encoded}`
  }

  return `https://api.whatsapp.com/send?phone=${CONTACT_NUMBER}&text=${encoded}`
}