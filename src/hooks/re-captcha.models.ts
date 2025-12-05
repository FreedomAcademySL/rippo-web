export interface ReCaptchaBody {
  token: string
  action?: string
}

export interface ReCaptchaResponse {
  isHuman: boolean
  message?: string
  score?: number
  key?: string
}

export interface ReCaptchaValidationResult extends ReCaptchaResponse {
  action: string
}


