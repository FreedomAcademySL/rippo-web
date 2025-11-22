import type { QuestionnaireTheme } from '@/types/questionnaire'

export const DEFAULT_THEME: QuestionnaireTheme = {
  backgroundColor: '#0f172a',
  primaryColor: '#ef4444',
  textColor: '#f8fafc',
  borderRadius: '32px',
}

export const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const TRANSITION_CONFIG = {
  duration: 0.45,
  ease: 'easeOut' as const,
}

export const QUESTIONNAIRE_MESSAGES = {
  previous: 'Volver',
  next: 'Siguiente',
  submit: 'Enviar',
  required: 'Esta respuesta es obligatoria para continuar.',
}




