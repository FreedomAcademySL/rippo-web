'use client'

import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type ChangeEvent,
  useMemo,
  useEffect,
  startTransition,
  type JSX,
} from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'
import type {
  QuestionnaireProps,
  QuestionnaireAnswer,
  QuestionnaireResult,
  QuestionnaireStoredAnswer,
  QuestionnaireQuestion,
  QuestionnaireDependencyConfig,
  QuestionnaireSelectOption,
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
import { useRecaptchaV3 } from '@/hooks/use-recaptcha-v3'
import { useQuestionnairePersistence } from '@/hooks/use-questionnaire-persistence'
import { useRestCountries } from '@/hooks/use-rest-countries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BLOCKER_MESSAGE = 'Volvé cuando estés listo para retomarlo.'
const VIDEO_QUESTION_ID = 'video_upload'
const CAPTCHA_ACTION = 'cuerpo_fit_form'

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

const normalizeSearchText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const buildDefaultDateAnswer = (question: QuestionnaireQuestion): string => {
  const today = new Date()
  let targetAge = typeof question.minAge === 'number' ? question.minAge : 25
  if (typeof question.maxAge === 'number') {
    targetAge = Math.min(targetAge, question.maxAge)
  }
  if (!Number.isFinite(targetAge) || targetAge <= 0) {
    targetAge = 25
  }
  const dateCopy = new Date(today)
  dateCopy.setFullYear(today.getFullYear() - targetAge)
  return dateCopy.toISOString().split('T')[0]
}

const buildAutocompleteAnswers = (
  questions: QuestionnaireQuestion[],
): Record<string, QuestionnaireStoredAnswer> => {
  const nextAnswers: Record<string, QuestionnaireStoredAnswer> = {}

  questions.forEach((question, index) => {
    if (question.fields?.length) {
      nextAnswers[question.id] = {
        id: question.id,
        text: question.fields
          .map((field) => field.label ?? field.placeholder ?? `Campo ${field.id}`)
          .join(', '),
        fieldValues: question.fields.reduce<Record<string, string>>((acc, field, fieldIndex) => {
          if (field.type === 'number') {
            acc[field.id] = String(field.min ?? 1)
          } else if (field.type === 'phone') {
            acc[field.id] = '123456789'
          } else {
            acc[field.id] = field.placeholder ?? `demo-${fieldIndex + 1}`
          }
          return acc
        }, {}),
        blocksProgress: false,
      }
      return
    }

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
      if (question.type === 'multi-choice') {
        const safeAnswers =
          question.answers.filter((answer) => !answer.blocksProgress) ?? question.answers
        const pool = safeAnswers.length > 0 ? safeAnswers : question.answers
        let selectionCount = pool.length
        if (pool.length >= 3) {
          selectionCount = 3
        } else if (pool.length === 2) {
          selectionCount = 2
        }
        const selections = pool.slice(0, selectionCount)

        nextAnswers[question.id] = {
          id: question.id,
          text: selections.map((item) => item.text).join(', '),
          selections,
          blocksProgress: selections.some((item) => item.blocksProgress),
        }
        return
      }

      const first = question.answers.find((answer) => !answer.blocksProgress) ?? question.answers[0]
      nextAnswers[question.id] = {
        id: first.id,
        text: first.text,
        selections: undefined,
        blocksProgress: first.blocksProgress,
      }
      return
    }

    nextAnswers[question.id] = {
      id: `${question.id}-${index}`,
      text:
        question.type === 'number'
          ? String(question.min ?? 1)
          : question.type === 'phone'
            ? '123456789'
            : question.type === 'date'
              ? buildDefaultDateAnswer(question)
            : question.placeholder ?? 'demo',
    }
  })

  return nextAnswers
}

const parseNumberValue = (value?: string): number | null => {
  if (!value) {
    return null
  }
  const normalized = value.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const validatePatternValue = (
  value: string | undefined,
  label: string,
  pattern?: string,
): string | null => {
  if (!value || !pattern) {
    return null
  }

  try {
    const regex = new RegExp(pattern)
    if (!regex.test(value.trim())) {
      return `Revisá el formato de "${label}".`
    }
  } catch {
    // Si el patrón es inválido no cortamos el flujo.
  }

  return null
}

const validateNumericValue = (
  value: string | undefined,
  label: string,
  min?: number,
  max?: number,
  step?: number,
): string | null => {
  if (!value) {
    return null
  }

  const parsed = parseNumberValue(value)
  if (parsed === null) {
    return `Ingresá un número válido en "${label}".`
  }

  if (typeof min === 'number' && parsed < min) {
    return `El valor de "${label}" debe ser al menos ${min}.`
  }

  if (typeof max === 'number' && parsed > max) {
    return `El valor de "${label}" debe ser como máximo ${max}.`
  }

  if (typeof step === 'number' && step > 0) {
    const base = typeof min === 'number' ? min : 0
    const multiplier = (parsed - base) / step
    const rounded = Math.round(multiplier)
    if (Math.abs(multiplier - rounded) > 1e-6) {
      return `El valor de "${label}" debe respetar incrementos de ${step}.`
    }
  }

  return null
}

const validateLengthValue = (
  value: string | undefined,
  label: string,
  minLength?: number,
  maxLength?: number,
): string | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed.length) {
    return null
  }

  if (typeof minLength === 'number' && trimmed.length < minLength) {
    return `El texto de "${label}" debe tener al menos ${minLength} caracteres.`
  }

  if (typeof maxLength === 'number' && trimmed.length > maxLength) {
    return `El texto de "${label}" debe tener como máximo ${maxLength} caracteres.`
  }

  return null
}

const calculateAgeFromDate = (value: string): number | null => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  const dayDiff = today.getDate() - parsed.getDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age
}

const validateDateAgeValue = (
  value: string | undefined,
  label: string,
  minAge?: number,
  maxAge?: number,
): string | null => {
  if (!value) {
    return null
  }

  const age = calculateAgeFromDate(value)
  if (age === null || age < 0) {
    return `Ingresá una fecha válida en "${label}".`
  }

  if (typeof minAge === 'number' && age < minAge) {
    return `Necesitás tener al menos ${minAge} años para completar "${label}".`
  }

  if (typeof maxAge === 'number' && age > maxAge) {
    return `La edad máxima permitida para "${label}" es ${maxAge} años.`
  }

  return null
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
    const { restoredState, persistState, clearState } = useQuestionnairePersistence(questions)
    const [showClarification, setShowClarification] = useState<boolean>(
      restoredState?.showClarification ?? true,
    )
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(
      restoredState?.currentQuestionIndex ?? 0,
    )
    const [answers, setAnswers] = useState<Record<string, QuestionnaireStoredAnswer>>(
      restoredState?.answers ?? {},
    )
    const [error, setError] = useState<string | null>(null)
    const [isDisabled, setIsDisabled] = useState(false)
    const [isProcessingFile, setIsProcessingFile] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCaptchaSatisfied, setIsCaptchaSatisfied] = useState(false)
    const [captchaScore, setCaptchaScore] = useState<number | null>(null)
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
    const [selectFilters, setSelectFilters] = useState<Record<string, string>>({})
    const [showReturnToFinalShortcut, setShowReturnToFinalShortcut] = useState(false)
    const {
      validate: validateRecaptcha,
      isVerifying: isRecaptchaVerifying,
      error: recaptchaError,
      resetError: resetRecaptchaError,
    } = useRecaptchaV3({ action: CAPTCHA_ACTION })

    useEffect(() => {
      persistState({ answers, currentQuestionIndex, showClarification })
    }, [answers, currentQuestionIndex, persistState, showClarification])
    const { countries, callingCodes, loading: restCountriesLoading } = useRestCountries()

    const isDependencySatisfied = useCallback(
      (
        dependency: QuestionnaireDependencyConfig,
        currentAnswers: Record<string, QuestionnaireStoredAnswer>,
      ): boolean => {
        const dependencyAnswer = currentAnswers[dependency.questionId]
        if (!dependencyAnswer) {
          return false
        }
        if (dependency.requiresText) {
          const hasPlainText = Boolean(dependencyAnswer.text?.trim())
          const hasFieldValue = Object.values(dependencyAnswer.fieldValues ?? {}).some((value) =>
            Boolean(value?.trim()),
          )
          if (hasPlainText || hasFieldValue) {
            return true
          }
        }

        const allowedIds = dependency.allowedAnswerIds ?? []
        if (dependencyAnswer.selections?.length) {
          if (allowedIds.length === 0) {
            return true
          }
          return dependencyAnswer.selections.some((item) => allowedIds.includes(item.id))
        }
        if (dependencyAnswer.id) {
          if (allowedIds.length === 0) {
            return true
          }
          return allowedIds.includes(dependencyAnswer.id)
        }
        return false
      },
      [],
    )

    const isQuestionVisible = useCallback(
      (question: QuestionnaireQuestion, currentAnswers: Record<string, QuestionnaireStoredAnswer>): boolean => {
        if (!question.dependsOn) {
          return true
        }
        const dependencies = Array.isArray(question.dependsOn)
          ? question.dependsOn
          : [question.dependsOn]
        return dependencies.some((dependency) => isDependencySatisfied(dependency, currentAnswers))
      },
      [isDependencySatisfied],
    )

    const visibleQuestions = useMemo(
      () => questions.filter((question) => isQuestionVisible(question, answers)),
      [answers, isQuestionVisible, questions],
    )

    const totalQuestions = visibleQuestions.length
    const videoQuestionIndex = useMemo(
      () => visibleQuestions.findIndex((question) => question.id === VIDEO_QUESTION_ID),
      [visibleQuestions],
    )
    const videoAnswer = videoQuestionIndex >= 0 ? answers[VIDEO_QUESTION_ID] : undefined
    const isVideoUploaded = Boolean(videoAnswer?.files?.length)
    const isVideoQuestionAvailable = videoQuestionIndex >= 0
    const canJumpToVideo = isVideoQuestionAvailable && !isVideoUploaded

    useEffect(() => {
      if (showClarification) {
        return
      }
      if (!totalQuestions) {
        startTransition(() => {
          setCurrentQuestionIndex(0)
        })
        return
      }
      if (currentQuestionIndex >= totalQuestions) {
        startTransition(() => {
          setCurrentQuestionIndex(totalQuestions - 1)
        })
      }
    }, [currentQuestionIndex, showClarification, totalQuestions])

    const handleAutocomplete = useCallback(() => {
      if (isSubmitting) {
        return
      }
      const autoAnswers = buildAutocompleteAnswers(questions)
      setAnswers((prev) => ({
        ...prev,
        ...autoAnswers,
      }))
      setCurrentQuestionIndex(Math.max(questions.length - 1, 0))
      setError(null)
      // eslint-disable-next-line no-console
      console.info('[Questionnaire][debug-autocomplete]', autoAnswers)
    }, [isSubmitting, questions])

    const disableButton = (): void => {
      setIsDisabled(true)
    }

    const handleStartQuestions = (): void => {
      if (isSubmitting) {
        return
      }
      setShowClarification(false)
    }

    const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

    const currentQuestion: QuestionnaireQuestion | undefined =
      visibleQuestions[currentQuestionIndex]
    const storedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
    const isLastQuestion = totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1
    const currentAnswerBlocks = useMemo(
      () => answerBlocksProgress(storedAnswer),
      [storedAnswer],
    )
    useEffect(() => {
      if (currentQuestion?.id !== VIDEO_QUESTION_ID && showReturnToFinalShortcut) {
        setShowReturnToFinalShortcut(false)
      }
    }, [currentQuestion?.id, showReturnToFinalShortcut])

    const handleJumpToVideoQuestion = useCallback(() => {
      if (videoQuestionIndex < 0 || isSubmitting) {
        return
      }
      setShowReturnToFinalShortcut(true)
      setCurrentQuestionIndex(videoQuestionIndex)
      setError(null)
    }, [isSubmitting, setCurrentQuestionIndex, setError, videoQuestionIndex])

    const handleReturnToFinalStep = useCallback(() => {
      if (totalQuestions <= 0 || isSubmitting) {
        return
      }
      setShowReturnToFinalShortcut(false)
      setCurrentQuestionIndex(Math.max(totalQuestions - 1, 0))
      setError(null)
    }, [isSubmitting, setCurrentQuestionIndex, setError, totalQuestions])

    const handleAnswerSelect = useCallback(
      (answer: QuestionnaireAnswer) => {
        if (isSubmitting) {
          return
        }
        const question = visibleQuestions[currentQuestionIndex]
        if (!question) {
          return
        }
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
      [currentQuestionIndex, isSubmitting, visibleQuestions],
    )

    const handleInputChange = useCallback(
      (questionId: string, value: string, fieldId?: string) => {
        if (isSubmitting) {
          return
        }
        setAnswers((prev) => {
          if (fieldId) {
            const existing = prev[questionId]
            const nextFieldValues = { ...(existing?.fieldValues ?? {}) }
            if (value) {
              nextFieldValues[fieldId] = value
            } else {
              delete nextFieldValues[fieldId]
            }

            if (Object.keys(nextFieldValues).length === 0) {
              const updated = { ...prev }
              delete updated[questionId]
              return updated
            }

            return {
              ...prev,
              [questionId]: {
                id: questionId,
                fieldValues: nextFieldValues,
                text: existing?.text,
                blocksProgress: false,
              },
            }
          }

          if (!value) {
            const updated = { ...prev }
            delete updated[questionId]
            return updated
          }

          return {
            ...prev,
            [questionId]: {
              id: value || questionId,
              text: value,
              blocksProgress: false,
            },
          }
        })
        setError(null)
      },
      [isSubmitting],
    )

    const handleMultiSelect = useCallback(
      (questionId: string, answer: QuestionnaireAnswer) => {
        if (isSubmitting) {
          return
        }
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
      [isSubmitting],
    )

    const handleFileChange = useCallback(
      (question: QuestionnaireQuestion, event: ChangeEvent<HTMLInputElement>) => {
        if (isSubmitting) {
          return
        }
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
      [isSubmitting],
    )

    const handleVideoCompressionComplete = useCallback(
      (questionId: string, payload: VideoCompressionPayload) => {
        if (isSubmitting) {
          return
        }
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
      [isSubmitting],
    )

    const handleRemoveFileAnswer = useCallback((questionId: string) => {
      if (isSubmitting) {
        return
      }
      setAnswers((prev) => {
        const updated = { ...prev }
        delete updated[questionId]
        return updated
      })
      setError(null)
    }, [isSubmitting])

    const attemptCaptchaValidation = useCallback(async (): Promise<string | null> => {
      resetRecaptchaError()
      const response = await validateRecaptcha()
      if (response && response.isHuman && response.key) {
        setIsCaptchaSatisfied(true)
        setCaptchaScore(response.score ?? null)
        setRecaptchaToken(response.key)
        return response.key
      }

      setIsCaptchaSatisfied(false)
      setRecaptchaToken(null)
      return null
    }, [resetRecaptchaError, validateRecaptcha])

    // Navega a la siguiente pregunta o finaliza el cuestionario
    const handleNext = useCallback(async () => {
      if (isSubmitting) {
        return
      }
      const question = visibleQuestions[currentQuestionIndex]
      if (!question) {
        return
      }
      const answer = answers[question.id]
      const requiresAnswer = question.required && !allowSkip
      const isFieldQuestion = Boolean(question.fields?.length)
      const textualTypes: QuestionnaireQuestion['type'][] = [
        'text',
        'textarea',
        'number',
        'phone',
        'date',
        'select',
      ]

      if (requiresAnswer) {
        if (!answer) {
          setError(QUESTIONNAIRE_MESSAGES.required)
          return
        }

        if (isFieldQuestion) {
          const fieldValues = answer.fieldValues ?? {}
          const allFieldsCompleted = question.fields?.every((field) => {
            const fieldValue = fieldValues[field.id]
            return typeof fieldValue === 'string' && fieldValue.trim().length > 0
          })
          if (!allFieldsCompleted) {
            setError(QUESTIONNAIRE_MESSAGES.required)
            return
          }
        } else if (
          textualTypes.includes(question.type ?? 'text') &&
          !(answer.text && answer.text.trim())
        ) {
          setError(QUESTIONNAIRE_MESSAGES.required)
          return
        } else if (question.type === 'multi-choice' && !(answer.selections?.length)) {
          setError(QUESTIONNAIRE_MESSAGES.required)
          return
        }
      }

      const runAdvancedValidation = (): string | null => {
        if (!answer) {
          return null
        }

        if (isFieldQuestion && question.fields?.length) {
          return question.fields.reduce<string | null>((acc, field) => {
            if (acc) {
              return acc
            }

            const fieldValue = answer.fieldValues?.[field.id]
            const fieldLabel = field.label ?? field.placeholder ?? field.id
            const patternError = validatePatternValue(fieldValue, fieldLabel, field.pattern)
            if (patternError) {
              return patternError
            }

            if (field.type === 'number') {
              return validateNumericValue(fieldValue, fieldLabel, field.min, field.max, field.step)
            }

            const fieldType = field.type ?? 'text'
            const isTextField = fieldType === 'text' || fieldType === 'textarea'
            if (isTextField) {
              return validateLengthValue(fieldValue, fieldLabel, field.minLength, field.maxLength)
            }

            return null
          }, null)
        }

        const patternError = validatePatternValue(answer.text, question.title, question.pattern)
        if (patternError) {
          return patternError
        }

        if (question.type === 'number') {
          return validateNumericValue(answer.text, question.title, question.min, question.max, question.step)
        }

        if (question.type === 'date') {
          return validateDateAgeValue(answer.text, question.title, question.minAge, question.maxAge)
        }

        if (question.type === 'text' || question.type === 'textarea') {
          return validateLengthValue(answer.text, question.title, question.minLength, question.maxLength)
        }

        return null
      }

      const validationMessage = runAdvancedValidation()
      if (validationMessage) {
        setError(validationMessage)
        return
      }

      if (answerBlocksProgress(answer)) {
        setError(BLOCKER_MESSAGE)
        return
      }

      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1))
        setError(null)
        return
      }

      let effectiveRecaptchaToken = recaptchaToken
      if (!isCaptchaSatisfied) {
        const token = await attemptCaptchaValidation()
        if (!token) {
          return
        }
        effectiveRecaptchaToken = token
      }

      if (!effectiveRecaptchaToken) {
        setError('No pudimos validar reCAPTCHA. Intentalo nuevamente.')
        setIsCaptchaSatisfied(false)
        setRecaptchaToken(null)
        return
      }

      const answeredQuestions = questions.filter(
        (questionEntry) => answers[questionEntry.id] && isQuestionVisible(questionEntry, answers),
      )
      const serializedAnswers = answeredQuestions.reduce<QuestionnaireResult['answers']>(
        (acc, questionEntry) => {
          const stored = answers[questionEntry.id]
          if (!stored) {
            return acc
          }

          if (questionEntry.fields?.length && stored.fieldValues) {
            const entries = questionEntry.fields
              .map((field) => {
                const fieldValue = stored.fieldValues?.[field.id]
                if (!fieldValue) {
                  return null
                }
                return {
                  id: questionEntry.id,
                  fieldId: field.id,
                  value: fieldValue,
                }
              })
              .filter(
                (
                  entry,
                ): entry is {
                  id: string
                  fieldId: string
                  value: string
                } => Boolean(entry),
              )
            if (entries.length) {
              acc[questionEntry.id] = entries
            }
            return acc
          }

          if (stored.selections?.length) {
            const selectedIds = stored.selections.map((item) => item.id)
            if (questionEntry.multiValueFormat === 'array') {
              acc[questionEntry.id] = [
                {
                  id: questionEntry.id,
                  value: selectedIds,
                },
              ]
              return acc
            }
            acc[questionEntry.id] = selectedIds.map((selectionId) => ({
              id: selectionId,
              value: selectionId,
            }))
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

          if (textualTypes.includes(questionEntry.type ?? 'text')) {
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

      if (isCaptchaSatisfied) {
        serializedAnswers.__captcha = [
          {
            id: 'captcha',
            value: captchaScore !== null ? `score:${captchaScore.toFixed(2)}` : 'validated',
          },
        ]
      }

      const result: QuestionnaireResult = {
        answers: serializedAnswers,
        completedAt: new Date(),
        recaptchaToken: effectiveRecaptchaToken,
      }

      setIsSubmitting(true)
      disableButton()
      try {
        const maybePromise = onComplete(result)
        if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
          await maybePromise
        }
        clearState()
      } catch (submissionError) {
        const message =
          submissionError instanceof Error && submissionError.message
            ? submissionError.message
            : 'No pudimos enviar el formulario. Intentá nuevamente.'
        setError(message)
        return
      } finally {
        setIsSubmitting(false)
        setIsDisabled(false)
      }
      setIsCaptchaSatisfied(false)
      setCaptchaScore(null)
      setRecaptchaToken(null)
    }, [
      allowSkip,
      answers,
      attemptCaptchaValidation,
      captchaScore,
      clearState,
      currentQuestionIndex,
      isCaptchaSatisfied,
      isQuestionVisible,
      isSubmitting,
      onComplete,
      questions,
      recaptchaToken,
      totalQuestions,
      visibleQuestions,
    ])

    // Navega a la pregunta anterior
    const handlePrevious = useCallback(() => {
      if (isSubmitting) {
        return
      }
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex((prev) => prev - 1)
        setError(null)
      }
    }, [currentQuestionIndex, isSubmitting])

    // Funciones para control externo
    const handleExternalNext = useCallback(() => {
      if (isSubmitting) {
        return
      }
      if (onNext) {
        onNext()
        return
      }

      if (showClarification) {
        handleStartQuestions()
      } else {
        void handleNext()
      }
    }, [handleNext, isSubmitting, onNext, showClarification])

    const handleExternalPrevious = useCallback(() => {
      if (isSubmitting) {
        return
      }
      if (onPrevious) {
        onPrevious()
      } else {
        handlePrevious()
      }
    }, [handlePrevious, isSubmitting, onPrevious])

    // Exponer funciones para controlar el cuestionario desde fuera
    useImperativeHandle(
      ref,
      () => ({
        handleNext: handleExternalNext,
        handlePrevious: handleExternalPrevious,
        handleAutocomplete,
        canGoPrevious: currentQuestionIndex > 0 && !showClarification && !isSubmitting,
        canGoNext:
          Boolean(currentQuestion) &&
          !isDisabled &&
          !isProcessingFile &&
          !currentAnswerBlocks &&
          !isSubmitting,
        isLastQuestion,
        currentQuestionIndex,
        totalQuestions,
        showingClarification: showClarification,
      }),
      [
        currentAnswerBlocks,
        currentQuestionIndex,
        currentQuestion,
        handleAutocomplete,
        handleExternalNext,
        handleExternalPrevious,
        isDisabled,
        isSubmitting,
        isProcessingFile,
        isLastQuestion,
        totalQuestions,
        showClarification,
      ],
    )

    const handleSelectFilterChange = useCallback((questionId: string, value: string) => {
      setSelectFilters((prev) => ({
        ...prev,
        [questionId]: value,
      }))
    }, [])

    const resetSelectFilter = useCallback((questionId: string) => {
      setSelectFilters((prev) => {
        if (!prev[questionId]) {
          return prev
        }
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }, [])

    const getSelectOptions = useCallback(
      (question: QuestionnaireQuestion): QuestionnaireSelectOption[] => {
        if (question.selectOptions?.length) {
          return question.selectOptions
        }

        if (question.optionsSource === 'countries') {
          return countries
        }

        if (question.optionsSource === 'callingCodes') {
          return callingCodes
        }

        return []
      },
      [callingCodes, countries],
    )

    const renderSelectField = (
      question: QuestionnaireQuestion,
      answer?: QuestionnaireStoredAnswer,
    ): JSX.Element => {
      const options = getSelectOptions(question)
      const isLoading =
        Boolean(question.optionsSource) && restCountriesLoading && options.length === 0
      const isDisabled = isLoading || options.length === 0
      const placeholder = isLoading
        ? 'Cargando opciones...'
        : question.placeholder ?? 'Seleccioná una opción'
      const showSearch =
        question.optionsSource === 'countries' || question.optionsSource === 'callingCodes'
      const rawFilterValue = selectFilters[question.id] ?? ''
      const filterValue = rawFilterValue.trim()
      const normalizedFilter = filterValue ? normalizeSearchText(filterValue) : ''
      const filteredOptions =
        normalizedFilter && showSearch
          ? options.filter((option) =>
              normalizeSearchText(option.label).includes(normalizedFilter),
            )
          : options

      return (
        <div className="space-y-2">
          <Select
            value={answer?.text ?? undefined}
            onValueChange={(value) => handleInputChange(question.id, value)}
            disabled={isDisabled}
            onOpenChange={(open) => {
              if (!open) {
                resetSelectFilter(question.id)
              }
            }}
          >
            <SelectTrigger className="w-full border border-white/10 bg-slate-900/40 text-white placeholder:text-slate-400">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-72 w-[var(--radix-select-trigger-width)] border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur-lg">
              {showSearch && (
                <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/95 p-2">
                  <Input
                    value={rawFilterValue}
                    onChange={(event) => handleSelectFilterChange(question.id, event.target.value)}
                    placeholder={
                      question.optionsSource === 'callingCodes'
                        ? 'Buscá por código o país (+54 o Argentina)'
                        : 'Buscá por nombre (Argentina)'
                    }
                    autoFocus
                    className="h-9 w-full bg-slate-900/50 text-sm text-white placeholder:text-slate-400 focus-visible:ring-red-500"
                  />
                </div>
              )}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-300">
                  No encontramos opciones que coincidan con “{filterValue}”.
                </div>
              )}
            </SelectContent>
          </Select>
          {isLoading && <p className="text-xs text-slate-300">Cargando opciones...</p>}
          {!isLoading && options.length === 0 && (
            <p className="text-xs text-amber-300">
              No encontramos opciones disponibles. Intentá recargar la página.
            </p>
          )}
        </div>
      )
    }

    const renderInputField = (
      question: QuestionnaireQuestion,
      answer?: QuestionnaireStoredAnswer,
    ): JSX.Element | null => {
      const commonInputProps = {
        inputMode: question.inputMode,
        min: question.min,
        max: question.max,
        step: question.step,
        pattern: question.pattern,
      }

      switch (question.type) {
        case 'select':
          return renderSelectField(question, answer)
        case 'text':
        case 'phone':
        case 'number':
        case 'date': {
          const inputType =
            question.type === 'phone'
              ? 'tel'
              : question.type === 'number'
                ? 'number'
                : question.type === 'date'
                  ? 'date'
                  : 'text'

          return (
            <Input
              type={inputType}
              value={answer?.text ?? ''}
              placeholder={question.placeholder}
              onChange={(event) => handleInputChange(question.id, event.target.value)}
              className="bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
              {...commonInputProps}
              {...(question.type === 'text'
                ? { minLength: question.minLength, maxLength: question.maxLength }
                : {})}
            />
          )
        }
        case 'textarea':
          return (
            <Textarea
              value={answer?.text ?? ''}
              placeholder={question.placeholder}
              onChange={(event) => handleInputChange(question.id, event.target.value)}
              className="min-h-[120px] resize-none bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
              minLength={question.minLength}
              maxLength={question.maxLength}
            />
          )
        case 'file': {
          const renderReturnToFinalButton =
            question.id === VIDEO_QUESTION_ID && showReturnToFinalShortcut ? (
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/30 bg-white/5 text-xs text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessingFile || isSubmitting}
                onClick={handleReturnToFinalStep}
              >
                Volver al final
              </Button>
            ) : null

          if (question.enableVideoCompression) {
            return (
              <div className="space-y-3">
                <VideoUploadField
                  question={question}
                  storedAnswer={answer}
                  onCompressionComplete={(payload) =>
                    handleVideoCompressionComplete(question.id, payload)
                  }
                  onRemove={() => handleRemoveFileAnswer(question.id)}
                  onProcessingChange={setIsProcessingFile}
                />
                {renderReturnToFinalButton}
              </div>
            )
          }

          return (
            <div className="space-y-3">
              <input
                id={`file-${question.id}`}
                type="file"
                accept={question.accept}
                multiple={(question.maxFiles ?? 1) > 1}
                onChange={(event) => handleFileChange(question, event)}
                className="block w-full rounded-md border border-dashed border-white/30 bg-slate-900/40 p-3 text-white file:mr-4 file:rounded-md file:border-0 file:bg-red-500 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
              {answer?.files && answer.files.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                  {answer.files.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              )}
              {renderReturnToFinalButton}
            </div>
          )
        }
        default:
          return null
      }
    }

    const renderFieldInputs = (
      question: QuestionnaireQuestion,
      answer?: QuestionnaireStoredAnswer,
    ): JSX.Element | null => {
      if (!question.fields?.length) {
        return null
      }

      return (
        <div className="space-y-4">
          {question.fields.map((field) => {
            const fieldType = field.type ?? 'text'
            const htmlInputType =
              fieldType === 'phone'
                ? 'tel'
                : fieldType === 'number'
                  ? 'number'
                  : fieldType === 'date'
                    ? 'date'
                    : 'text'
            const value = answer?.fieldValues?.[field.id] ?? ''
            const fieldId = `${question.id}-${field.id}`
            const fieldInputProps = {
              inputMode: field.inputMode,
              min: field.min,
              max: field.max,
              step: field.step,
              pattern: field.pattern,
            }

            return (
              <div key={field.id} className="space-y-2">
                <label htmlFor={fieldId} className="text-sm font-semibold text-slate-100">
                  {field.label}
                </label>
                {fieldType === 'textarea' ? (
                  <Textarea
                    id={fieldId}
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(event) => handleInputChange(question.id, event.target.value, field.id)}
                    className="min-h-[80px] resize-none bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
                    minLength={field.minLength}
                    maxLength={field.maxLength}
                  />
                ) : (
                  <Input
                    id={fieldId}
                    type={htmlInputType}
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(event) => handleInputChange(question.id, event.target.value, field.id)}
                    className="bg-slate-900/40 border border-white/10 text-white placeholder:text-slate-400"
                    {...(fieldType === 'text'
                      ? { minLength: field.minLength, maxLength: field.maxLength }
                      : {})}
                    {...fieldInputProps}
                  />
                )}
                {field.helperText && (
                  <p className="text-xs text-slate-300">{field.helperText}</p>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    const renderAnswers = (
      question: QuestionnaireQuestion,
      storedAnswer?: QuestionnaireStoredAnswer,
    ): JSX.Element | null => {
      if (question.fields?.length) {
        return (
          <div className="space-y-3">
            {renderFieldInputs(question, storedAnswer)}
            {question.helperText && (
              <p className="text-sm text-slate-300">{question.helperText}</p>
            )}
          </div>
        )
      }

      if (question.type === 'text' || question.type === 'textarea' || question.type === 'select') {
        return (
          <div className="space-y-3">
            {renderInputField(question, storedAnswer)}
            {question.helperText && (
              <p className="text-sm text-slate-300">{question.helperText}</p>
            )}
          </div>
        )
      }

      if (
        question.type === 'number' ||
        question.type === 'phone' ||
        question.type === 'date' ||
        question.type === 'file'
      ) {
        return (
          <div className="space-y-3">
            {renderInputField(question, storedAnswer)}
            {question.helperText && (
              <p className="text-sm text-slate-300">{question.helperText}</p>
            )}
          </div>
        )
      }

      if (question.type === 'multi-choice') {
        return (
          <div className="grid gap-3">
            {question.answers?.map((option) => {
              const isSelected =
                storedAnswer?.selections?.some((item) => item.id === option.id) ?? false

              return (
                <Button
                  key={option.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn(
                    'h-fit w-full p-4 text-left transition-all',
                    'flex flex-col items-start gap-1 whitespace-normal break-words',
                    isSelected
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-transparent text-white/85 border-white/20 hover:bg-red-500/15 hover:text-white',
                  )}
                  onClick={() => handleMultiSelect(question.id, option)}
                >
                  <span className="font-medium">{option.text}</span>
                  {option.description && (
                    <span className="text-sm opacity-70">{option.description}</span>
                  )}
                </Button>
              )
            })}
          </div>
        )
      }

      return (
        <div className="grid gap-3">
          {question.answers?.map((option) => (
            <Button
              key={option.id}
              variant={storedAnswer?.id === option.id ? 'default' : 'outline'}
              className={cn(
                'h-fit w-full p-4 text-left transition-all hover:scale-[1.01]',
                'flex flex-col items-start gap-1 whitespace-normal break-words',
                storedAnswer?.id === option.id
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-transparent text-white/90 border-white/20 hover:bg-red-500/15 hover:text-white',
              )}
              onClick={() => handleAnswerSelect(option)}
            >
              <span className="font-medium">{option.text}</span>
              {option.description && (
                <span className="text-sm opacity-70">{option.description}</span>
              )}
            </Button>
          ))}
        </div>
      )
    }

    const isNextDisabled =
      !currentQuestion ||
      isDisabled ||
      isProcessingFile ||
      isSubmitting ||
      currentAnswerBlocks ||
      (isLastQuestion && isRecaptchaVerifying)

    const isPrimaryActionLoading =
      isLastQuestion && (isRecaptchaVerifying || isDisabled || isSubmitting)

    const primaryButtonClass = cn(
      'w-32 font-semibold text-white transition focus-visible:ring-2 focus-visible:ring-red-400 flex items-center justify-center gap-2',
      isPrimaryActionLoading
        ? 'bg-red-500/60 text-white/70 shadow-none'
        : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30',
      !isPrimaryActionLoading && isNextDisabled && 'bg-red-500/40 text-white/60',
      'disabled:cursor-not-allowed disabled:opacity-80',
    )

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
          ) : currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={ANIMATION_VARIANTS}
              transition={TRANSITION_CONFIG}
              className={cn('relative space-y-6', hideButtons ? 'pb-4' : 'pb-20')}
            >
              {showProgressBar && totalQuestions > 0 && (
                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                    <span>
                      Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 w-full" />
                </div>
              )}

      
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-white">
                  {currentQuestion.title}{' '}
                  {currentQuestion.required && <span className="text-red-400">*</span>}
                </h3>
                {currentQuestion.description && (
                  <p className="text-sm text-slate-300">{currentQuestion.description}</p>
                )}
              </div>

              {renderAnswers(currentQuestion, storedAnswer)}

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
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white/90">Estado del video</p>
                        <p
                          className={cn(
                            'text-sm',
                            isVideoUploaded ? 'text-emerald-300' : 'text-amber-300',
                          )}
                        >
                          {isVideoUploaded
                            ? 'Video cargado correctamente.'
                            : 'Todavía no subiste tu video.'}
                        </p>
                      </div>
                      {canJumpToVideo && (
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0 border-white/30 bg-white/5 text-xs text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isProcessingFile || isSubmitting}
                          onClick={handleJumpToVideoQuestion}
                        >
                          Ir a la pregunta del video
                        </Button>
                      )}
                    </div>
                    {!isVideoUploaded && (
                      <p className="text-xs text-slate-300">
                        El video es clave para personalizar tu plan. Volvé a esa pregunta y cargalo
                        antes de enviar.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-center text-sm text-slate-200">
                      Validamos automáticamente que sos humano al enviar el formulario.
                    </p>
                    {isRecaptchaVerifying && (
                      <p className="text-center text-xs text-slate-300">Validando con reCAPTCHA…</p>
                    )}
                    {recaptchaError && (
                      <p className="text-center text-xs font-semibold text-amber-300">{recaptchaError}</p>
                    )}
                    {isCaptchaSatisfied && (
                      <p className="text-center text-xs font-semibold text-emerald-300">
                        Verificación completada
                        {captchaScore !== null ? ` (score ${captchaScore.toFixed(2)})` : ''}.
                      </p>
                    )}
                    {isSubmitting && (
                      <p className="text-center text-xs text-slate-200">
                        Enviando tus respuestas... No cierres esta pestaña.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!hideButtons && (
                <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-between gap-4 border-t border-white/10 bg-slate-900/40 p-4 backdrop-blur">
                  <Button
                    variant="outline"
                    onClick={handleExternalPrevious}
                    disabled={currentQuestionIndex === 0 || isSubmitting}
                    className="w-32 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-50"
                  >
                    {QUESTIONNAIRE_MESSAGES.previous}
                  </Button>
                  <Button
                    onClick={handleExternalNext}
                    disabled={isNextDisabled}
                    className={primaryButtonClass}
                  >
                    {isPrimaryActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>
                      {isLastQuestion
                        ? QUESTIONNAIRE_MESSAGES.submit
                        : QUESTIONNAIRE_MESSAGES.next}
                    </span>
                  </Button>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    )
  },
)


