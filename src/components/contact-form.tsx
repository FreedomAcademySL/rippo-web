'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Questionnaire } from '@/components/questionnaire'
import type { QuestionnaireRef } from '@/components/questionnaire'
import type { QuestionnaireResult } from '@/types/questionnaire'
import { questionnaireQuestions, questionnaireClarification } from '@/data/questionnaire'
import { submitRegistrationData, submitProgressPhotos } from '@/services/questionnaire'
import { buildTelegramUrl, getDisplayNumber } from '@/utils/contact'
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'
import { PhotoUploadField } from '@/components/photo-upload-field'
import { Spinner } from '@/components/ui/spinner'
import { REQUIRED_PHOTO_COUNT } from '@/lib/pose-config'

const TRAINERS = [
  {
    name: 'Ripo',
    username: import.meta.env.VITE_TELEGRAM_USER as string,
    label: 'Contactar a Coach Ripo por Telegram',
    colorClass: 'bg-emerald-400/90 hover:bg-emerald-300 shadow-emerald-500/40',
  },
] as const

const PHOTO_409_RETRY_DELAY_MS = 3000

function buildTrainerMessage(trainerName: string, fullName: string, phone: string): string {
  return `Hola ${trainerName}, ya me inscribi en tu pagina web. Mi nombre es ${fullName}, mi telefono es ${phone}. ¿Como seguimos?`
}

async function submitPhotosWithRetry(
  targetClientId: string,
  photos: File[],
): Promise<void> {
  try {
    await submitProgressPhotos(targetClientId, photos)
  } catch (error) {
    // Check for 409 (Drive folder not ready) — retry once after delay
    if (error instanceof Error && (error as Error & { is409?: boolean }).is409) {
      await new Promise((resolve) => setTimeout(resolve, PHOTO_409_RETRY_DELAY_MS))
      await submitProgressPhotos(targetClientId, photos)
      return
    }
    throw error
  }
}

export function ContactForm() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [photoRetryNeeded, setPhotoRetryNeeded] = useState(false)
  const [photoUploadStep, setPhotoUploadStep] = useState(false)
  const [photoSlots, setPhotoSlots] = useState<(File | null)[]>(
    Array.from({ length: REQUIRED_PHOTO_COUNT }, () => null),
  )
  const questionnaireRef = useRef<QuestionnaireRef>(null)
  const isDev = import.meta.env.DEV

  const handlePhotoSlotChange = useCallback((index: number, file: File | null) => {
    setPhotoSlots(prev => {
      const next = [...prev]
      next[index] = file
      return next
    })
  }, [])

  const handleComplete = useCallback(async (payload: QuestionnaireResult) => {
    setResult(payload)
    setIsSubmitting(true)
    setSubmissionMessage(null)
    setSubmissionError(null)
    setSubmissionSuccess(false)
    setPhotoRetryNeeded(false)

    try {
      const regResponse = await submitRegistrationData(payload)
      setClientId(regResponse.clientId)
      setPhotoUploadStep(true)
    } catch (error) {
      setSubmissionError('Ups, no pudimos guardar tu info. Proba de nuevo en unos minutos.')
      throw error instanceof Error ? error : new Error('questionnaire-submission-failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const handlePhotoSubmit = useCallback(async () => {
    if (!clientId) return
    const photos = photoSlots.filter((f): f is File => f !== null)
    if (photos.length < REQUIRED_PHOTO_COUNT) return

    setIsSubmitting(true)
    setSubmissionError(null)
    setPhotoRetryNeeded(false)

    try {
      await submitPhotosWithRetry(clientId, photos)
      setSubmissionSuccess(true)
      setPhotoUploadStep(false)
      setSubmissionMessage(
        'Todo listo! El siguiente paso es contactar con tu coach por Telegram y empezar tu transformacion.',
      )
    } catch (error) {
      console.error('Photo submission failed:', error)
      setPhotoRetryNeeded(true)
      const is409 = error instanceof Error && (error as Error & { is409?: boolean }).is409
      setSubmissionError(
        is409
          ? 'Estamos preparando tu espacio de entrenamiento. Por favor, reintenta el envio en unos segundos.'
          : 'Hubo un error subiendo las fotos. Intenta de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [clientId, photoSlots])

  const handlePhotoRetry = useCallback(async () => {
    if (!clientId) return
    const photos = photoSlots.filter((f): f is File => f !== null)
    if (!photos.length) return

    setIsSubmitting(true)
    setSubmissionError(null)
    setPhotoRetryNeeded(false)

    try {
      await submitPhotosWithRetry(clientId, photos)
      setSubmissionSuccess(true)
      setPhotoUploadStep(false)
      setSubmissionMessage(
        'Todo listo! El siguiente paso es contactar con tu coach por Telegram y empezar tu transformacion.',
      )
    } catch (error) {
      console.error('Photo retry failed:', error)
      setPhotoRetryNeeded(true)
      const is409 = error instanceof Error && (error as Error & { is409?: boolean }).is409
      setSubmissionError(
        is409
          ? 'Estamos preparando tu espacio de entrenamiento. Por favor, reintenta el envio en unos segundos.'
          : 'Hubo un error subiendo las fotos. Intenta de nuevo.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [clientId, photoSlots])

  const firstName =
    typeof result?.answers?.name?.[0]?.value === 'string' &&
      result.answers.name[0].value.trim().length > 0
      ? result.answers.name[0].value.trim()
      : null
  const lastName =
    typeof result?.answers?.lastName?.[0]?.value === 'string' &&
      result.answers.lastName[0].value.trim().length > 0
      ? result.answers.lastName[0].value.trim()
      : null
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '_____'

  const countryCode =
    typeof result?.answers?.whatsapp_country_code?.[0]?.value === 'string'
      ? result.answers.whatsapp_country_code[0].value.trim()
      : ''
  const phoneNumber =
    typeof result?.answers?.whatsapp_number?.[0]?.value === 'string'
      ? result.answers.whatsapp_number[0].value.trim()
      : ''
  const phone = countryCode && phoneNumber ? `${countryCode}${phoneNumber}` : '_____'

  return (
    <div className="w-full max-w-5xl px-4 py-12 md:px-8">
      <div className="space-y-4 text-center">
        <p className="text-base text-slate-600 dark:text-slate-300 md:text-2xl mx-auto text-balance">
          Contestá las siguientes preguntas <b>con la verdad</b>, para que evalúe si estás listo para empezar tu cambio físico. <br /> Si no estás listo, <b>podés volver cuando lo estés</b>.
        </p>
      </div>

      {isDev && !photoUploadStep && !submissionSuccess && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            className="text-xs uppercase tracking-[0.4em]"
            onClick={() => questionnaireRef.current?.handleAutocomplete()}
          >
            Cargar datos de prueba
          </Button>
        </div>
      )}

      {submissionSuccess ? (
        <div className="relative mt-10 overflow-hidden rounded-[32px] border-6 border-emerald-400 bg-slate-900 p-10 text-white shadow-2xl shadow-emerald-500/20 space-y-6 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-[-40px] h-64 w-64 rounded-full bg-red-500/40 z-0 blur-[120px]"
          />    <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-[40px] h-64 w-64 rounded-full bg-red-500/40 z-0 blur-[120px]"
          />
          <div className="mx-auto flex size-20 items-center justify-center rounded-full  bg-emerald-400/10 text-emerald-300">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black">¡Aplicación recibida! 🎉</p>
            <p className="text-lg text-slate-200">{submissionMessage}</p>
          </div>
          <div className="flex w-full flex-col space-y-3">
            {TRAINERS.map((trainer) => (
              <a
                key={trainer.username}
                href={buildTelegramUrl(trainer.username, buildTrainerMessage(trainer.name, fullName, phone))}
                target="_blank"
                rel="noopener noreferrer"
                className={`group/cta flex w-full flex-col items-center justify-center gap-1 rounded-2xl ${trainer.colorClass} px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-lg hover:shadow-xl transition md:flex-row`}
              >
                <span role="img" aria-hidden="true" className="group-hover/cta:-translate-x-1 transition-transform duration-300">
                  <MessageCircle className="w-6 h-6" />
                </span>
                {trainer.label}
                <span aria-hidden="true" className="group-hover/cta:translate-x-2 transition-transform duration-300">
                  <ArrowRight className="w-6 h-6" />
                </span>
              </a>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-800/80 px-6 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              El numero de Ripo es:
            </p>
            <p className="text-2xl text-white">{getDisplayNumber()}</p>
          </div>
          <p className="text-sm text-slate-400">
            Hacé clic en el botón de tu coach para abrir Telegram y empezar.
          </p>
        </div>
      ) : photoUploadStep ? (
        <div className="mt-10 rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl md:p-10">
          <div className="mx-auto max-w-lg space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-semibold">Fotos de evaluacion</h2>
              <p className="text-sm text-slate-300">
                Ya tenemos tu informacion. Ahora subi las 6 fotos para que Ripo pueda armar tu plan.
              </p>
            </div>

            <PhotoUploadField
              storedFiles={photoSlots}
              onFileChange={handlePhotoSlotChange}
              helperText="Formatos aceptados: JPG, PNG, HEIC."
            />

            {submissionError && (
              <div className="rounded-3xl border border-red-500/30 bg-slate-900/60 p-4">
                <p className="text-sm font-semibold text-red-300">{submissionError}</p>
              </div>
            )}

            <Button
              onClick={photoRetryNeeded ? handlePhotoRetry : handlePhotoSubmit}
              disabled={isSubmitting || photoSlots.some(f => f === null)}
              className="w-full bg-primary text-white hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Subiendo fotos...
                </>
              ) : photoRetryNeeded ? (
                'Reintentar envio de fotos'
              ) : (
                'Enviar fotos'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-10 relative">
            <div className={result && isSubmitting ? 'pointer-events-none opacity-30 blur-[1px]' : ''}>
              <Questionnaire
                ref={questionnaireRef}
                questions={questionnaireQuestions}
                clarification={questionnaireClarification}
                onComplete={handleComplete}
                showProgressBar
              />
            </div>
            {result && isSubmitting && (
              <div className="pointer-events-auto absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[32px] bg-slate-950/80 p-8 text-center text-white space-y-3">
                <p className="text-lg font-semibold">Guardando tu aplicacion...</p>
                <p className="text-sm text-slate-200">
                  Estamos guardando tus respuestas. No cierres esta pestana.
                </p>
              </div>
            )}
          </div>

          {result && !submissionSuccess && submissionError && !photoUploadStep && (
            <div className="mt-8 rounded-3xl border border-red-500/30 bg-slate-900/60 p-6 text-white shadow-lg shadow-red-500/10">
              <p className="text-sm font-semibold text-red-300">{submissionError}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
