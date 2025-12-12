'use client'

import { useState, useCallback } from 'react'
import { Questionnaire } from '@/components/questionnaire'
// import { VideoCompressionDebugger } from '@/components/video-compression-debugger'
import type { QuestionnaireResult } from '@/types/questionnaire'
import { questionnaireQuestions, questionnaireClarification } from '@/data/questionnaire'
import { submitQuestionnaireApplication } from '@/services/questionnaire'
import { ArrowRight, CheckCircle, MessageCircle } from 'lucide-react'

export function ContactForm() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null)
  const [submissionWhatsapp, setSubmissionWhatsapp] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const handleComplete = useCallback(async (payload: QuestionnaireResult) => {
    setResult(payload)
    // Dummy output mientras esperamos la API real
    // eslint-disable-next-line no-console
    console.log('Formulario enviado (dummy):', payload)

    setIsSubmitting(true)
    setSubmissionMessage(null)
    setSubmissionError(null)
    setSubmissionWhatsapp(null)

    try {
      const response = await submitQuestionnaireApplication(payload)
      const whatsappNumber = response.whatsapp || '5491172468898'
      setSubmissionWhatsapp(whatsappNumber)
      setSubmissionMessage(
        '¡Todo listo! El siguiente paso es contactar a Ripo por WhatsApp y empezar tu transformación.',
      )
    } catch (error) {
      setSubmissionError('Ups, no pudimos guardar tu info. Probá de nuevo en unos minutos.')
      throw error instanceof Error ? error : new Error('questionnaire-submission-failed')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const showSuccess = Boolean(submissionWhatsapp)

  const fullName =
    typeof result?.answers?.full_name?.[0]?.value === 'string' &&
      result.answers.full_name[0].value.trim().length > 0
      ? result.answers.full_name[0].value.trim()
      : '_____'

  const whatsappMessage = `Ripo, ya me inscribí en tu página web. Mi nombre es ${fullName}. ¿Como seguimos?`
  const whatsappTarget = submissionWhatsapp ?? '5491172468898'
  const displayWhatsapp = submissionWhatsapp
    ? submissionWhatsapp.startsWith('+')
      ? submissionWhatsapp
      : `+${submissionWhatsapp}`
    : null

  return (
    <div className="w-full max-w-5xl px-4 py-12 md:px-8">
      <div className="space-y-4 text-center">
        {/* <p className="text-xs uppercase tracking-[0.3em] text-red-500">
          Formulario de aplicación
        </p>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white md:text-5xl">
          Transformate con Ripo 💪
        </h2> */}
        <p className="text-base text-slate-600 dark:text-slate-300 md:text-2xl mx-auto text-balance">
          Contestá las siguientes preguntas <b>con la verdad</b>, para que evalúe si estás listo para empezar tu cambio físico. <br /> Si no estás listo, <b>podés volver cuando lo estés</b>.
        </p>
      </div>

      {showSuccess ? (
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
          <a
            href={`https://api.whatsapp.com/send?phone=${whatsappTarget}&text=${encodeURIComponent(
              whatsappMessage,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta flex w-full flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-400/90 px-8 py-4 text-lg font-black uppercase tracking-wide text-slate-900 shadow-lg hover:shadow-xl shadow-emerald-500/40 transition hover:bg-emerald-300 md:flex-row"
          >
            <span role="img" aria-hidden="true" className="group-hover/cta:-translate-x-1 transition-transform duration-300">
              <MessageCircle className="w-6 h-6" />
            </span>
            Abrir WhatsApp ahora
            <span aria-hidden="true" className="group-hover/cta:translate-x-2 transition-transform duration-300"><ArrowRight className="w-6 h-6" /></span>
          </a>
          {displayWhatsapp && (
            <div className="rounded-2xl bg-slate-800/80 px-6 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                El número de WhatsApp que cargaste es:
              </p>
              <p className="text-2xl text-white">{displayWhatsapp}</p>
            </div>
          )}
          <p className="text-sm text-slate-400">
            Hacé clic en el botón verde para abrir WhatsApp y continuar la conversación con Ripo.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10 relative">
            <div className={result && isSubmitting ? 'pointer-events-none opacity-30 blur-[1px]' : ''}>
              <Questionnaire
                questions={questionnaireQuestions}
                clarification={questionnaireClarification}
                onComplete={handleComplete}
                showProgressBar
              />
            </div>
            {result && isSubmitting && (
              <div className="pointer-events-auto absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[32px] bg-slate-950/80 p-8 text-center text-white space-y-3">
                <p className="text-lg font-semibold">Guardando tu aplicación...</p>
                <p className="text-sm text-slate-200">
                  Estamos enviando tus respuestas. No cierres esta pestaña hasta que terminemos.
                </p>
              </div>
            )}
          </div>

          {/* <div className="mt-16 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Debug interno</p>
            <VideoCompressionDebugger />
          </div> */}

          {result && !showSuccess && submissionError && (
            <div className="mt-8 rounded-3xl border border-red-500/30 bg-slate-900/60 p-6 text-white shadow-lg shadow-red-500/10">
              <p className="text-sm font-semibold text-red-300">{submissionError}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
