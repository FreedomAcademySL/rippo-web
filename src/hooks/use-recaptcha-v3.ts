'use client'

import { useCallback, useState } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import { reCaptcha } from '@/services/reCaptcha'
import type { ReCaptchaValidationResult } from '@/hooks/re-captcha.models'

interface UseRecaptchaV3Options {
  action?: string
}

interface UseRecaptchaV3Store {
  isVerifying: boolean
  error: string | null
  validate: (overrideAction?: string) => Promise<ReCaptchaValidationResult | null>
  resetError: () => void
}

export const useRecaptchaV3 = ({ action = 'default' }: UseRecaptchaV3Options = {}): UseRecaptchaV3Store => {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetError = useCallback(() => setError(null), [])

  const validate = useCallback(
    async (overrideAction?: string): Promise<ReCaptchaValidationResult | null> => {
      const resolvedAction = overrideAction ?? action
      if (!executeRecaptcha) {
        setError('El servicio reCAPTCHA todavía no está listo.')
        return null
      }

      setIsVerifying(true)
      setError(null)

      try {
        const token = await executeRecaptcha(resolvedAction)
        if (!token) {
          setError('No pudimos generar el token de verificación.')
          return null
        }

        const response = await reCaptcha({ token, action: resolvedAction })
        if (!response.isHuman) {
          setError(response.message ?? 'No pudimos confirmar que sos humano.')
        } else if (!response.key) {
          setError('No pudimos generar la firma de verificación.')
          return null
        }

        return {
          ...response,
          action: resolvedAction,
        }
      } catch (validationError) {
        setError('Error al validar reCAPTCHA. Intentalo nuevamente.')
        console.error('[useRecaptchaV3] Validation error', validationError)
        return null
      } finally {
        setIsVerifying(false)
      }
    },
    [action, executeRecaptcha],
  )

  return { isVerifying, error, validate, resetError }
}


