'use client'

import { useState, useCallback } from 'react'
import { Questionnaire } from '@/components/questionnaire'
import { VideoCompressionDebugger } from '@/components/video-compression-debugger'
import type { QuestionnaireResult } from '@/types/questionnaire'
import { questionnaireQuestions, questionnaireClarification } from '@/data/questionnaire'
import { submitQuestionnaireApplication } from '@/services/questionnaire'

export function ContactForm() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const handleComplete = useCallback((payload: QuestionnaireResult) => {
    setResult(payload)
    // Dummy output mientras esperamos la API real
    // eslint-disable-next-line no-console
    console.log('Formulario enviado (dummy):', payload)

    setIsSubmitting(true)
    setSubmissionMessage(null)
    setSubmissionError(null)

    submitQuestionnaireApplication(payload)
      .then((response) => {
        setSubmissionMessage(
          `Todo listo. Usá este número para continuar por Whatsapp: ${response.whatsapp}`,
        )
      })
      .catch(() => {
        setSubmissionError('Ups, no pudimos guardar tu info. Probá de nuevo en unos minutos.')
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }, [])

  const showSuccess = Boolean(submissionMessage)

  const fullName =
    typeof result?.answers?.full_name?.[0]?.value === 'string' &&
    result.answers.full_name[0].value.trim().length > 0
      ? result.answers.full_name[0].value.trim()
      : '_____'

  const whatsappMessage = `Ripo, ya me inscribí en tu página web. Mi nombre es ${fullName}. ¿Como seguimos?`

  return (
    <div className="w-full max-w-5xl px-4 py-12 md:px-8">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Formulario de aplicación
        </p>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white md:text-5xl">
          Entrená con Joa Ripo
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 md:text-lg">
          Contestá cada pregunta con total honestidad. Si no estás listo, podés volver cuando lo
          estés.
        </p>
      </div>

      {showSuccess ? (
        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-white shadow-lg shadow-red-500/10 space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-2xl font-bold text-white">¡Aplicación recibida! 🎉</p>
          </div>
          <a
            href={`https://api.whatsapp.com/send?phone==5491172468898&text=${encodeURIComponent(
              whatsappMessage,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-3xl font-black text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
          >
            {submissionMessage}
          </a>
        </div>
      ) : (
        <>
          <div className="mt-10">
            <Questionnaire
              questions={questionnaireQuestions}
              clarification={questionnaireClarification}
              onComplete={handleComplete}
              showProgressBar
            />
          </div>

          {/* <div className="mt-16 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Debug interno</p>
            <VideoCompressionDebugger />
          </div> */}

          {result && (
            <div className="mt-8 rounded-3xl border border-red-500/30 bg-slate-900/60 p-6 text-white shadow-lg shadow-red-500/10 space-y-3">
              <p className="text-lg font-semibold">¡Listo! Te espero en Whatsapp 👇</p>
              <p className="text-sm text-slate-200">
                Estamos enviando tus respuestas. Apenas tengamos el número te lo muestro
                acá mismo.
              </p>

              {isSubmitting && (
                <p className="text-sm text-amber-200">
                  Guardando tu aplicación... mantené esta pestaña abierta unos segundos.
                </p>
              )}

              {submissionError && (
                <p className="text-sm font-semibold text-red-300">{submissionError}</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
