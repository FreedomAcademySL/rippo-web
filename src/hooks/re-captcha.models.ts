'use client'

import type ReCAPTCHA from 'react-google-recaptcha'

export interface UseReCaptchaProps {
  getReCaptchaValidation: (isValid: boolean) => void
}

export interface UseReCaptchaStore {
  captchaRef: React.RefObject<ReCAPTCHA>
  handleChange: () => Promise<void>
}

export interface ReCaptchaBody {
  token: string
  action?: string
}

export interface ReCaptchaResponse {
  isHuman: boolean
  message?: string
  score?: number
}


