'use client'

import type { QuestionnaireResult } from '@/types/questionnaire'
import { buildFormCuerpoFitFormData,  } from '@/services/questionnaire-mapper'

const BASE_API_URL = import.meta.env.VITE_BASE_API
const CUERPO_FIT_ENDPOINT = BASE_API_URL ? `${BASE_API_URL}/cuerpo-fit` : ''
const FALLBACK_WHATSAPP = '5491155873035'

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
  // const { dto } = mapQuestionnaireResultToDto(payload)
  // eslint-disable-next-line no-console
  // console.log(' DTO listo para enviar:', dto)

  if (!CUERPO_FIT_ENDPOINT) {
    throw new Error(
      ' VITE_BASE_API no está definido. No se puede enviar el formulario.',
    )
  }

  let response: Response
  try {
    response = await fetch(CUERPO_FIT_ENDPOINT, {
      method: 'POST',
      body: formData,
    })
  } catch (networkError) {
    throw new Error(
      ` Error de red al enviar formulario: ${
        (networkError as Error).message ?? 'Error desconocido'
      }`,
    )
  }
  console.log( ' Response:', response)
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      ` Error al enviar FormData (${response.status}): ${errorBody}`,
    )
  }

  const data = await response.json().catch(() => ({}))

  return {
    status: response.status,
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : FALLBACK_WHATSAPP,
  }
}


