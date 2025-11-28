import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

import './styles/globals.css'
import App from './App.tsx'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

if (!siteKey) {
  // eslint-disable-next-line no-console
  console.warn('VITE_RECAPTCHA_SITE_KEY no está definido. reCAPTCHA v3 no se inicializará.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleReCaptchaProvider reCaptchaKey={siteKey ?? ''} scriptProps={{ async: true, defer: true }}>
      <App />
    </GoogleReCaptchaProvider>
  </StrictMode>,
)
