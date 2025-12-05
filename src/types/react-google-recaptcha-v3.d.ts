declare module 'react-google-recaptcha-v3' {
  import type { ComponentType, ReactNode } from 'react'

  interface GoogleReCaptchaProviderProps {
    reCaptchaKey: string
    scriptProps?: Record<string, string | boolean>
    container?: string | HTMLElement
    language?: string
    useRecaptchaNet?: boolean
    children?: ReactNode
  }

  export const GoogleReCaptchaProvider: ComponentType<GoogleReCaptchaProviderProps>

  interface UseGoogleReCaptchaValue {
    executeRecaptcha?: (action?: string) => Promise<string>
  }

  export function useGoogleReCaptcha(): UseGoogleReCaptchaValue
}












