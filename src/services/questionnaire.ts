'use client'

import type { QuestionnaireResult } from '@/types/questionnaire'
import { buildFormCuerpoFitFormData, mapQuestionnaireResultToDto } from '@/services/questionnaire-mapper'

const CUERPO_FIT_ENDPOINT = ''
const FALLBACK_WHATSAPP = '5491127385112'

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
  const formData = buildFormCuerpoFitFormData(payload)
  const { dto } = mapQuestionnaireResultToDto(payload)
  // eslint-disable-next-line no-console
  console.log('[Questionnaire] DTO listo para enviar:', dto)

  if (!CUERPO_FIT_ENDPOINT) {
    // eslint-disable-next-line no-console
    console.warn(
      '[Questionnaire] NEXT_PUBLIC_CUERPOFIT_ENDPOINT no está definido. Enviando respuesta dummy.',
      dto,
    )
    await new Promise((resolve) => setTimeout(resolve, 800))
    return {
      status: 200,
      whatsapp: FALLBACK_WHATSAPP,
    }
  }

  const response = await fetch(CUERPO_FIT_ENDPOINT, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `[Questionnaire] Error al enviar FormData (${response.status}): ${errorBody}`,
    )
  }

  const data = await response.json().catch(() => ({}))

  return {
    status: response.status,
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : FALLBACK_WHATSAPP,
  }
}


