'use client'

import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ChangeEvent,
  useMemo,
  type JSX,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/utils'
import type {
  QuestionnaireProps,
  QuestionnaireAnswer,
  QuestionnaireResult,
  QuestionnaireStoredAnswer,
  QuestionnaireQuestion,
} from '@/types/questionnaire'
import {
  DEFAULT_THEME,
  ANIMATION_VARIANTS,
  TRANSITION_CONFIG,
  QUESTIONNAIRE_MESSAGES,
} from '@/constants/questionnaire.constants'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { VideoUploadField } from '@/components/video-upload-field'
import type { VideoCompressionPayload } from '@/types/video'
import { RecaptchaField } from '@/components/recaptcha'

const BLOCKER_MESSAGE = 'Volvé cuando estés listo para retomarlo.'

const answerBlocksProgress = (stored?: QuestionnaireStoredAnswer): boolean => {
  if (!stored) {
    return false
  }
  if (stored.blocksProgress) {
    return true
  }
  if (stored.selections?.some((item) => item.blocksProgress)) {
    return true
  }
  return false
}

export interface QuestionnaireRef {
  handleNext: () => void
  handlePrevious: () => void
  handleAutocomplete: () => void
  canGoPrevious: boolean
  canGoNext: boolean
  isLastQuestion: boolean
  currentQuestionIndex: number
  totalQuestions: number
  showingClarification: boolean
}

const buildAutocompleteAnswers = (
  questions: QuestionnaireQuestion[],
  _questionIndex: number,
): Record<string, QuestionnaireStoredAnswer> => {
  const nextAnswers: Record<string, QuestionnaireStoredAnswer> = {}

  questions.forEach((question, index) => {
    if (question.type === 'file') {
      nextAnswers[question.id] = {
        id: `${question.id}-demo-video`,
        text: 'demo-video.mp4',
        files: [],
        blocksProgress: false,
      }
      return
    }

    if (question.answers && question.answers.length > 0) {
      const first = question.answers.find((answer) => !answer.blocksProgress) ?? question.answers[0]
      nextAnswers[question.id] = {
        id: first.id,
        text: first.text,
        selections: question.type === 'multi-choice' ? [first] : undefined,
        blocksProgress: first.blocksProgress,
      }
      return
    }

    nextAnswers[question.id] = {
      id: `${question.id}-${index}`,
      text: question.placeholder ?? 'demo',
    }
  })

  return nextAnswers
}

/**
 * Questionnaire es un componente reutilizable para crear cuestionarios interactivos.
 * Soporta múltiples preguntas con respuestas valoradas, temas personalizables,
 * animaciones y es completamente responsivo.
 *
 * @param {QuestionnaireProps} props - Las propiedades del componente
 * @returns {JSX.Element} El componente renderizado
 */
export const Questionnaire = forwardRef<QuestionnaireRef, QuestionnaireProps>(
  function Questionnaire(
    {
      questions,
      onComplete,
      theme = DEFAULT_THEME,
      allowSkip = false,
      showProgressBar = false,
      className,
      clarification,
      hideButtons = false,
      onPrevious,
      onNext,
    },
    ref,
  ): JSX.Element {
    const [showClarification, setShowClarification] = useState<boolean>(true)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
    const [answers, setAnswers] = useState<Record<string, QuestionnaireStoredAnswer>>({})
    const [error, setError] = useState<string | null>(null)
    const [isDisabled, setIsDisabled] = useState(false)
    const [isProcessingFile, setIsProcessingFile] = useState(false)
    const [captchaToken, setCaptchaToken] = useState<string | null>(null)
    const processEnv =
      typeof globalThis !== 'undefined'
        ? (
            (globalThis as typeof globalThis & {
              process?: { env?: Record<string, string | undefined> }
            }).process?.env ?? null
          )
        : null
    const showDebugControls = processEnv?.NEXT_PUBLIC_ENABLE_DEBUG_CONTROLS === 'true'

    const handleAutocomplete = useCallback(() => {
      setAnswers((prev) => ({
        ...prev,
        ...buildAutocompleteAnswers(questions, currentQuestionIndex),
      }))
      setCurrentQuestionIndex(questions.length - 1)
      setError(null)
    }, [currentQuestionIndex, questions])

    const disableButton = (): void => {
      setIsDisabled(true)
    }

    const handleStartQuestions = (): void => {
      setShowClarification(false)
    }

    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    const currentQuestion: QuestionnaireQuestion = questions[currentQuestionIndex]
    const storedAnswer = answers[currentQuestion?.id]
    const currentAnswerBlocks = useMemo(
      () => answerBlocksProgress(storedAnswer),
      [storedAnswer],
    )

    const handleAnswerSelect = useCallback(
      (answer: QuestionnaireAnswer) => {
        const question = questions[currentQuestionIndex]
        setAnswers((prev) => ({
          ...prev,
          [question.id]: {
            id: answer.id,
            text: answer.text,
            value: answer.value,
            blocksProgress: answer.blocksProgress ?? false,
          },
        }))
        setError(null)
      },
      [currentQuestionIndex, questions],
    )

    const handleInputChange = useCallback((questionId: string, value: string) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          id: value || questionId,
          text: value,
          blocksProgress: false,
        },
      }))
      setError(null)
    }, [])

    const handleMultiSelect = useCallback(
      (questionId: string, answer: QuestionnaireAnswer) => {
        setAnswers((prev) => {
          const existingSelections = prev[questionId]?.selections ?? []
          const isSelected = existingSelections.some((item) => item.id === answer.id)
          const selections = isSelected
            ? existingSelections.filter((item) => item.id !== answer.id)
            : [...existingSelections, answer]

          return {
            ...prev,
            [questionId]: {
              id: questionId,
              selections,
              text: selections.map((item) => item.text).join(', '),
              blocksProgress: selections.some((item) => item.blocksProgress),
            },
          }
        })
        setError(null)
      },
      [],
    )

    const handleFileChange = useCallback(
      (question: QuestionnaireQuestion, event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files ? Array.from(event.target.files) : []
        const limitedFiles =
          question.maxFiles && files.length > question.maxFiles
            ? files.slice(0, question.maxFiles)
            : files

        setAnswers((prev) => ({
          ...prev,
          [question.id]: {
            id: limitedFiles[0]?.name ?? question.id,
            files: limitedFiles,
            text: limitedFiles.map((file) => file.name).join(', '),
            blocksProgress: false,
          },
        }))
        setError(null)
      },
      [],
    )

    const handleVideoCompressionComplete = useCallback(
      (questionId: string, payload: VideoCompressionPayload) => {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: {
            id: payload.file.name,
            files: [payload.file],
            originalFiles: [payload.originalFile],
            text: payload.file.name,
            videoCompression: payload.metadata,
            blocksProgress: false,
          },
        }))
        setError(null)
      },
      [],
    )

    const handleRemoveFileAnswer = useCallback((questionId: string) => {
      setAnswers((prev) => {
        const updated = { ...prev }
        delete updated[questionId]
        return updated
      })
      setError(null)
    }, [])

    // Navega a la siguiente pregunta o finaliza el cuestionario
    const handleNext = useCallback(() => {
      const question = questions[currentQuestionIndex]
      const answer = answers[question.id]

      if (question.required && !answer && !allowSkip) {
        setError(QUESTIONNAIRE_MESSAGES.required)
        return
      }

      if (answerBlocksProgress(answer)) {
        setError(BLOCKER_MESSAGE)
        return
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1)
        setError(null)
        return
      }

      const answeredQuestions = questions.filter((q) => answers[q.id])
      const serializedAnswers = answeredQuestions.reduce<
        Record<
          string,
          { id: string; value?: string | { type: 'file'; name: string; file?: File } }[]
        >
      >(
        (acc, questionEntry) => {
          const stored = answers[questionEntry.id]
          if (!stored) {
            return acc
          }

          if (stored.selections?.length) {
            acc[questionEntry.id] = stored.selections.map((item) => ({ id: item.id }))
            return acc
          }

          if (questionEntry.type === 'file') {
            const fileObject = stored.files?.[0]
            const fileName =
              fileObject?.name ?? stored.text ?? stored.id ?? `${questionEntry.id}-video`
            acc[questionEntry.id] = [
              {
                id: stored.id ?? questionEntry.id,
                value: { type: 'file', name: fileName, file: fileObject },
              },
            ]
            return acc
          }

          if (
            questionEntry.type === 'text' ||
            questionEntry.type === 'textarea' ||
            questionEntry.type === 'number' ||
            questionEntry.type === 'phone' ||
            questionEntry.type === 'date'
          ) {
            acc[questionEntry.id] = [
              {
                id: questionEntry.id,
                value: stored.text ?? '',
              },
            ]
            return acc
          }

          if (stored.id) {
            acc[questionEntry.id] = [{ id: stored.id }]
            return acc
          }

          acc[questionEntry.id] = [{ id: questionEntry.id }]
          return acc
        },
        {},
      )

      if (captchaToken) {
        serializedAnswers.__captcha = [{ id: 'captcha', value: captchaToken }]
      }

      const result: QuestionnaireResult = {
        answers: serializedAnswers,
        completedAt: new Date(),
      }

      disableButton()
      onComplete(result)
      setIsDisabled(false)
    }, [allowSkip, answers, currentAnswerBlocks, currentQuestionIndex, onComplete, questions])

    // Navega a la pregunta anterior
    const handlePrevious = useCallback(() => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1)
        setError(null)
      }
    }, [currentQuestionIndex])

    // Funciones para control externo
    const handleExternalNext = useCallback(() => {
      if (onNext) {
        onNext()
        return
      }

      if (showClarification) {
        handleStartQuestions()
      } else {
        handleNext()
      }
    }, [handleNext, onNext, showClarification])

    const handleExternalPrevious = useCallback(() => {
      if (onPrevious) {
        onPrevious()
      } else {
        handlePrevious()
      }
    }, [handlePrevious, onPrevious])

    // Exponer funciones para controlar el cuestionario desde fuera
    useImperativeHandle(
      ref,
      () => ({
        handleNext: handleExternalNext,
        handlePrevious: handleExternalPrevious,
        handleAutocomplete,
        canGoPrevious: currentQuestionIndex > 0 && !showClarification,
        canGoNext: !isDisabled && !isProcessingFile && !currentAnswerBlocks,
        isLastQuestion: currentQuestionIndex === questions.length - 1,
        currentQuestionIndex,
        totalQuestions: questions.length,
        showingClarification: showClarification,
      }),
      [
        currentAnswerBlocks,
        currentQuestionIndex,
        handleAutocomplete,
        handleExternalNext,
        handleExternalPrevious,
        isDisabled,
        isProcessingFile,
        questions.length,
        showClarification,
      ],
    )

    const renderInputField = () => {
      switch (currentQuestion.type) {
        case 'text':
        case 'phone':
        case 'number':
        case 'date': {
          const inputType =
            currentQuestion.type === 'phone'
              ? 'tel'
              : currentQuestion.type === 'number'
                ? 'number'
                : currentQuestion.type === 'date'
                  ? 'date'
                  : 'text'

          return (
            <Input
              type={inputType}
              value={storedAnswer?.text ?? ''}
              placeholder={currentQuestion.placeholder}
              onChange={(event) => handleInputChange(currentQuestion.id, event.target.value)}
              className="bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
            />
          )
        }
        case 'textarea':
          return (
            <Textarea
              value={storedAnswer?.text ?? ''}
              placeholder={currentQuestion.placeholder}
              onChange={(event) => handleInputChange(currentQuestion.id, event.target.value)}
              className="min-h-[120px] bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
            />
          )
        case 'file':
          if (currentQuestion.enableVideoCompression) {
            return (
              <VideoUploadField
                question={currentQuestion}
                storedAnswer={storedAnswer}
                onCompressionComplete={(payload) =>
                  handleVideoCompressionComplete(currentQuestion.id, payload)
                }
                onRemove={() => handleRemoveFileAnswer(currentQuestion.id)}
                onProcessingChange={setIsProcessingFile}
              />
            )
          }

          return (
            <div className="space-y-3">
              <input
                id={`file-${currentQuestion.id}`}
                type="file"
                accept={currentQuestion.accept}
                multiple={(currentQuestion.maxFiles ?? 1) > 1}
                onChange={(event) => handleFileChange(currentQuestion, event)}
                className="block w-full rounded-md border border-dashed border-white/30 bg-slate-900/40 p-3 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
              {storedAnswer?.files && storedAnswer.files.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {storedAnswer.files.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )
        default:
          return null
      }
    }

    const renderAnswers = () => {
      if (currentQuestion.type === 'text' || currentQuestion.type === 'textarea') {
        return (
          <div className="space-y-3">
            {renderInputField()}
            {currentQuestion.helperText && (
              <p className="text-sm text-slate-300">{currentQuestion.helperText}</p>
            )}
          </div>
        )
      }

      if (
        currentQuestion.type === 'number' ||
        currentQuestion.type === 'phone' ||
        currentQuestion.type === 'date' ||
        currentQuestion.type === 'file'
      ) {
        return (
          <div className="space-y-3">
            {renderInputField()}
            {currentQuestion.helperText && (
              <p className="text-sm text-slate-300">{currentQuestion.helperText}</p>
            )}
          </div>
        )
      }

      if (currentQuestion.type === 'multi-choice') {
        return (
          <div className="grid gap-3">
            {currentQuestion.answers?.map((answer) => {
              const isSelected =
                storedAnswer?.selections?.some((item) => item.id === answer.id) ?? false

              return (
                <Button
                  key={answer.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-fit w-full p-4 text-left transition-all',
                    'flex flex-col items-start gap-1 whitespace-normal break-words',
                    isSelected
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-transparent text-white/85 border-white/20 hover:bg-red-500/15 hover:text-white',
                  )}
                  onClick={() => handleMultiSelect(currentQuestion.id, answer)}
                >
                  <span className="font-medium">{answer.text}</span>
                  {answer.description && (
                    <span className="text-sm opacity-70">{answer.description}</span>
                  )}
                </Button>
              )
            })}
          </div>
        )
      }

      return (
        <div className="grid gap-3">
          {currentQuestion.answers?.map((answer) => (
            <Button
              key={answer.id}
              variant={storedAnswer?.id === answer.id ? 'default' : 'outline'}
              className={cn(
                'h-fit w-full p-4 text-left transition-all hover:scale-[1.01]',
                'flex flex-col items-start gap-1 whitespace-normal break-words',
                storedAnswer?.id === answer.id
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-transparent text-white/90 border-white/20 hover:bg-red-500/15 hover:text-white',
              )}
              onClick={() => handleAnswerSelect(answer)}
            >
              <span className="font-medium">{answer.text}</span>
              {answer.description && (
                <span className="text-sm opacity-70">{answer.description}</span>
              )}
            </Button>
          ))}
        </div>
      )
    }

    const isLastQuestion = currentQuestionIndex === questions.length - 1
    const isNextDisabled =
      isDisabled ||
      isProcessingFile ||
      currentAnswerBlocks ||
      (isLastQuestion && !captchaToken)

    return (
      <div
        className={cn(
          'mx-auto w-full max-w-3xl rounded-[32px] p-6 shadow-lg shadow-red-500/10',
          'transition-all duration-300 ease-in-out backdrop-blur-md',
          className,
        )}
        style={{
          backgroundColor: theme.backgroundColor,
          borderRadius: theme.borderRadius,
          color: theme.textColor,
        }}
      >
        <AnimatePresence mode="wait">
          {showClarification && clarification ? (
            <motion.div
              key="clarification"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={ANIMATION_VARIANTS}
              transition={TRANSITION_CONFIG}
              className="space-y-4 text-white"
            >
              <div className="mb-8 rounded-2xl bg-white/10 p-6 text-lg text-slate-100">
                {clarification}
              </div>
              <div className="flex justify-end">
                {!hideButtons && (
                  <Button
                    onClick={handleStartQuestions}
                    className="w-32 bg-red-500 text-white hover:bg-red-600"
                  >
                    Comenzar
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={ANIMATION_VARIANTS}
              transition={TRANSITION_CONFIG}
              className={cn('relative space-y-6', hideButtons ? 'pb-4' : 'pb-20')}
            >
              {showProgressBar && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                    <span>
                      Pregunta {currentQuestionIndex + 1} de {questions.length}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-white/70 underline underline-offset-2"
                  onClick={handleAutocomplete}
                >
                  Autocompletar cuestionario (debug)
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-white">
                  {currentQuestion.title}{' '}
                  {currentQuestion.required && <span className="text-red-400">*</span>}
                </h3>
                {currentQuestion.description && (
                  <p className="text-sm text-slate-300">{currentQuestion.description}</p>
                )}
              </div>

              {renderAnswers()}

              {currentQuestion.clarification && (
                <div className="text-sm italic text-slate-300">
                  {currentQuestion.clarification}
                </div>
              )}

              {error && (
                <p className="mt-2 w-full text-center text-lg font-semibold text-red-300">
                  {error}
                </p>
              )}

              {currentAnswerBlocks && (
                <p className="text-center text-sm font-semibold text-amber-300">
                  {BLOCKER_MESSAGE}
                </p>
              )}

              {isProcessingFile && (
                <p className="text-center text-sm text-amber-200">
                  Estamos comprimiendo tu video. Podés avanzar apenas termine el proceso.
                </p>
              )}

              {isLastQuestion && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-center text-sm text-slate-200">
                    Confirmanos que sos humano resolviendo el captcha:
                  </p>
                  <RecaptchaField onChange={setCaptchaToken} />
                  {!captchaToken && (
                    <p className="text-center text-xs font-semibold text-amber-300">
                      Completá el captcha para poder enviar el formulario.
                    </p>
                  )}
                  {showDebugControls && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-xs text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                      onClick={() => setCaptchaToken(`debug-bypass-${Date.now()}`)}
                    >
                      Saltar captcha (debug)
                    </Button>
                  )}
                </div>
              )}

              {!hideButtons && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-between gap-4 border-t border-white/10 bg-slate-900/40 p-4 backdrop-blur">
                  <Button
                    variant="outline"
                    onClick={handleExternalPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="w-32 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-50"
                  >
                    {QUESTIONNAIRE_MESSAGES.previous}
                  </Button>
                  <Button
                    onClick={handleExternalNext}
                    disabled={isNextDisabled}
                    className="w-32 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    style={{
                      opacity: isNextDisabled ? 0.33 : 1,
                    }}
                  >
                    {currentQuestionIndex === questions.length - 1
                      ? QUESTIONNAIRE_MESSAGES.submit
                      : QUESTIONNAIRE_MESSAGES.next}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  },
)


