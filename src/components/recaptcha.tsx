'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          'error-callback': () => void
        },
      ) => number
      reset: (widgetId?: number) => void
    }
  }
}

interface RecaptchaProps {
  onChange: (token: string | null) => void
}

const RECAPTCHA_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit'

export function RecaptchaField({ onChange }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  useEffect(() => {
    if (!siteKey) {
      console.warn('VITE_RECAPTCHA_SITE_KEY no está definido. El captcha no se renderizará.')
      return
    }

    if (window.grecaptcha) {
      setIsReady(true)
      return
    }

    const script = document.createElement('script')
    script.src = RECAPTCHA_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsReady(true)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [siteKey])

  useEffect(() => {
    if (!isReady || !siteKey || !containerRef.current || !window.grecaptcha) {
      return
    }

    window.grecaptcha.ready(() => {
      if (!containerRef.current || widgetIdRef.current !== null) {
        return
      }

      widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onChange(token),
        'expired-callback': () => onChange(null),
        'error-callback': () => onChange(null),
      })
    })
  }, [isReady, onChange, siteKey])

  return (
    <div className="flex flex-col items-center gap-2 text-sm text-slate-200">
      <div ref={containerRef} className="g-recaptcha" />
      {!siteKey && (
        <p className="text-xs text-red-300">
          Configurá la variable de entorno <code>VITE_RECAPTCHA_SITE_KEY</code> para habilitar el
          captcha.
        </p>
      )}
    </div>
  )
}






