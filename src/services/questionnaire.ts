'use client'

import type { QuestionnaireResult } from '@/types/questionnaire'

export interface QuestionnaireSubmissionResponse {
  whatsapp: string
  status: number
}

/**
 * Dummy service que simula el envío del formulario a una API real.
 * Retorna un número de Whatsapp junto con un status 200/201 después de un pequeño delay.
 */
export async function submitQuestionnaireApplication(
  payload: QuestionnaireResult,
): Promise<QuestionnaireSubmissionResponse> {
  // Simulamos latencia de red / procesamiento
  await new Promise((resolve) => setTimeout(resolve, 1200))

  // Log interno para inspeccionar el payload enviado
  // eslint-disable-next-line no-console
  console.log('API Dummy recibió:', payload)

  // Elegimos 200 o 201 para emular variaciones del backend
  const status = Math.random() > 0.5 ? 200 : 201

  return {
    status,
    whatsapp: '5491127385112',
  }
}


