'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type ReCAPTCHA from 'react-google-recaptcha'

import { reCaptcha } from '@/services/reCaptcha'
import type { ReCaptchaResponse, UseReCaptchaProps, UseReCaptchaStore } from './re-captcha.models'

export const useReCaptcha = ({ getReCaptchaValidation }: UseReCaptchaProps): UseReCaptchaStore => {
  const captchaRef = useRef<ReCAPTCHA>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = useCallback(async (): Promise<void> => {
    const ref = captchaRef.current
    if (!ref) {
      return
    }

    const token = ref.getValue()
    if (!token) {
      setIsSuccess(false)
      return
    }

    try {
      const { isHuman }: ReCaptchaResponse = await reCaptcha({ token })
      setIsSuccess(isHuman)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[useReCaptcha] Error al validar el captcha', error)
      setIsSuccess(false)
      ref.reset()
    }
  }, [])

  useEffect(() => {
    if (isSuccess) {
      getReCaptchaValidation(isSuccess)
    }
  }, [getReCaptchaValidation, isSuccess])

  return { captchaRef, handleChange }
}


