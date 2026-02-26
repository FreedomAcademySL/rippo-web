import type { QuestionnaireResult } from '@/types/questionnaire'
import { buildFormCuerpoFitFormData } from '@/services/questionnaire-mapper'

const TEST_API = import.meta.env.VITE_TEST_API
const ENABLED = import.meta.env.VITE_DUAL_SUBMIT === 'true'
const ENDPOINT = TEST_API ? `${TEST_API}/cuerpo-fit` : ''

export function mirrorSubmissionToTestBackend(
  payload: QuestionnaireResult,
): void {
  if (!ENABLED || !ENDPOINT) return

  try {
    const formData = buildFormCuerpoFitFormData(payload)
    formData.delete('file')

    fetch(ENDPOINT, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => '')
          console.warn(`[mirror] ${res.status}: ${body}`)
        }
      })
      .catch((err: unknown) => {
        console.warn('[mirror] Network error:', err)
      })
  } catch (err) {
    console.warn('[mirror] Error building FormData:', err)
  }
}
