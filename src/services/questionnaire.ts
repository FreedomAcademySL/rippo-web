'use client'

import type { QuestionnaireResult } from '@/types/questionnaire'
import { buildFormCuerpoFitFormData,  } from '@/services/questionnaire-mapper'

const BASE_API_URL = import.meta.env.VITE_BASE_API
const CUERPO_FIT_ENDPOINT = BASE_API_URL ? `${BASE_API_URL}/cuerpo-fit` : ''
export interface QuestionnaireSubmissionResponse {
  whatsapp?: string
  status: number
}

/**
 * Submits the questionnaire form data to the Cuerpo Fit API.
 * Returns a status code and an optional whatsapp number from the backend response.
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
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : undefined,
  }
}


