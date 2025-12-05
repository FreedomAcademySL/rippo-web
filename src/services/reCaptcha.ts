import type { ReCaptchaBody, ReCaptchaResponse } from '@/hooks/re-captcha.models'

const DEFAULT_ENDPOINT = import.meta.env.VITE_BASE_API + '/re-captcha/verify'

export const reCaptcha = async ({ token, action }: ReCaptchaBody): Promise<ReCaptchaResponse> => {
  console.log( '[reCaptcha] token:', token)
  console.log( '[reCaptcha] action:', action)
  const response = await fetch(DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, isRipo: true, action }),
  })
console.log( 'response', response)
  if (!response.ok) {
    throw new Error(`ReCAPTCHA respondió ${response.status}`)
  }

  const payload = (await response.json()) as Partial<ReCaptchaResponse> & {
    success?: boolean
    score?: number
  }

  return {
    isHuman: Boolean(payload.isHuman ?? payload.success ?? (payload.score ?? 0) >= 0.5),
    message: payload.message,
    score: payload.score,
    key: payload.key,
  }
}


