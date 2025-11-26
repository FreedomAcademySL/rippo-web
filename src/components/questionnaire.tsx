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
import { cn } from '@/utils'
import type {
  QuestionnaireProps,
  QuestionnaireAnswer,
  QuestionnaireResult,
  QuestionnaireStoredAnswer,
  QuestionnaireQuestion,
  QuestionnaireDependencyConfig,
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

    const isDependencySatisfied = useCallback(
      (
        dependency: QuestionnaireDependencyConfig,
        currentAnswers: Record<string, QuestionnaireStoredAnswer>,
      ): boolean => {
        const dependencyAnswer = currentAnswers[dependency.questionId]
        if (!dependencyAnswer) {
          return false
        }
        if (dependencyAnswer.selections?.length) {
          return dependencyAnswer.selections.some((item) => dependency.allowedAnswerIds.includes(item.id))
        }
        if (dependencyAnswer.id) {
          return dependency.allowedAnswerIds.includes(dependencyAnswer.id)
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
      const autoAnswers = buildAutocompleteAnswers(questions)
      setAnswers((prev) => ({
        ...prev,
        ...autoAnswers,
      }))
      setCurrentQuestionIndex(Math.max(questions.length - 1, 0))
      setError(null)
      // eslint-disable-next-line no-console
      console.info('[Questionnaire][debug-autocomplete]', autoAnswers)
    }, [questions])

    const disableButton = (): void => {
      setIsDisabled(true)
    }

    const handleStartQuestions = (): void => {
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

    const handleAnswerSelect = useCallback(
      (answer: QuestionnaireAnswer) => {
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
      [currentQuestionIndex, visibleQuestions],
    )

    const handleInputChange = useCallback(
      (questionId: string, value: string, fieldId?: string) => {
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
      [],
    )

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
    }, [
      allowSkip,
      answers,
      captchaToken,
      currentQuestionIndex,
      isQuestionVisible,
      onComplete,
      questions,
      totalQuestions,
      visibleQuestions,
    ])

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
        canGoNext: Boolean(currentQuestion) && !isDisabled && !isProcessingFile && !currentAnswerBlocks,
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
        isProcessingFile,
        isLastQuestion,
        totalQuestions,
        showClarification,
      ],
    )

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
        case 'file':
          if (question.enableVideoCompression) {
            return (
              <VideoUploadField
                question={question}
                storedAnswer={answer}
                onCompressionComplete={(payload) =>
                  handleVideoCompressionComplete(question.id, payload)
                }
                onRemove={() => handleRemoveFileAnswer(question.id)}
                onProcessingChange={setIsProcessingFile}
              />
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
            </div>
          )
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

      if (question.type === 'text' || question.type === 'textarea') {
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
                  {true && (
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
                    {isLastQuestion
                      ? QUESTIONNAIRE_MESSAGES.submit
                      : QUESTIONNAIRE_MESSAGES.next}
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


