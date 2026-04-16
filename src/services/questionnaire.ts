'use client'

import type { QuestionnaireResult } from '@/types/questionnaire'
import { buildRegistrationJsonBody, buildPhotosFormData } from '@/services/questionnaire-mapper'
import { mirrorSubmissionToTestBackend } from '@/services/questionnaire-mirror'

const BASE_API_URL = import.meta.env.VITE_BASE_API
const CUERPO_FIT_ENDPOINT = BASE_API_URL ? `${BASE_API_URL}/cuerpo-fit` : ''

export interface RegistrationResponse {
  clientId: string
  whatsapp?: string
  status: number
}

export interface PhotoSubmissionResponse {
  status: number
}

/**
 * Step 1: Submit registration form data as JSON to POST /cuerpo-fit.
 * Returns { clientId, whatsapp, status }.
 * The JSON body includes recaptchaToken (extracted by buildRegistrationJsonBody
 * via mapQuestionnaireResultToDto from QuestionnaireResult.recaptchaToken).
 */
export async function submitRegistrationData(
  payload: QuestionnaireResult,
): Promise<RegistrationResponse> {
  void mirrorSubmissionToTestBackend(payload)

  if (!CUERPO_FIT_ENDPOINT) {
    throw new Error(
      'VITE_BASE_API no esta definido. No se puede enviar el formulario.',
    )
  }

  const dto = buildRegistrationJsonBody(payload)

  let response: Response
  try {
    response = await fetch(CUERPO_FIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
  } catch (networkError) {
    throw new Error(
      `Error de red al enviar formulario: ${
        (networkError as Error).message ?? 'Error desconocido'
      }`,
    )
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `Error al enviar datos (${response.status}): ${errorBody}`,
    )
  }

  const data = await response.json().catch(() => ({}))

  return {
    clientId: data.clientId,
    whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : undefined,
    status: response.status,
  }
}

/**
 * Step 2: Upload 6 progress photos as multipart FormData
 * to POST /clients/:clientId/progress-photos.
 *
 * Throws with a special property `is409` when the server returns 409
 * (Drive folder not ready yet). The caller should retry after a delay.
 */
export async function submitProgressPhotos(
  clientId: string,
  photos: File[],
): Promise<PhotoSubmissionResponse> {
  if (!BASE_API_URL) {
    throw new Error('VITE_BASE_API no esta definido.')
  }

  const endpoint = `${BASE_API_URL}/clients/${clientId}/progress-photos`
  const formData = buildPhotosFormData(photos)

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type -- browser sets multipart boundary automatically
    })
  } catch (networkError) {
    throw new Error(
      `Error de red al enviar fotos: ${
        (networkError as Error).message ?? 'Error desconocido'
      }`,
    )
  }

  if (response.status === 409) {
    const err = new Error('El espacio de entrenamiento aun se esta preparando. Reintenta en unos segundos.')
    ;(err as Error & { is409: boolean }).is409 = true
    throw err
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new Error(
      `Error al enviar fotos (${response.status}): ${errorBody}`,
    )
  }

  return { status: response.status }
}
