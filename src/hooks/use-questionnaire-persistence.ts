import { useCallback, useMemo } from 'react'
import type {
  QuestionnaireQuestion,
  QuestionnaireStoredAnswer,
} from '@/types/questionnaire'

interface PersistedStoredAnswer {
  id: string
  text?: string
  value?: number
  selections?: string[]
  fieldValues?: Record<string, string>
  blocksProgress?: boolean
}

interface PersistedState {
  answers: Record<string, PersistedStoredAnswer>
  currentQuestionIndex: number
  showClarification: boolean
}

interface QuestionnairePersistenceState {
  answers: Record<string, QuestionnaireStoredAnswer>
  currentQuestionIndex: number
  showClarification: boolean
}

const STORAGE_KEY_PREFIX = 'ripo_questionnaire_progress'

const buildStorageKey = (questions: QuestionnaireQuestion[]): string => {
  const ids = questions.map((question) => question.id).join('|')
  return `${STORAGE_KEY_PREFIX}:${ids}`
}

const sanitizeAnswersForStorage = (
  answers: Record<string, QuestionnaireStoredAnswer>,
  questionMap: Map<string, QuestionnaireQuestion>,
): Record<string, PersistedStoredAnswer> => {
  return Object.entries(answers).reduce<Record<string, PersistedStoredAnswer>>((acc, [id, stored]) => {
    const question = questionMap.get(id)
    if (!question || question.type === 'file') {
      // Los archivos / videos no se persisten porque localStorage no soporta blobs.
      return acc
    }

    const next: PersistedStoredAnswer = {
      id: stored.id,
      text: stored.text,
      value: stored.value,
      fieldValues: stored.fieldValues,
      blocksProgress: stored.blocksProgress,
    }

    if (stored.selections?.length) {
      next.selections = stored.selections.map((selection) => selection.id)
    }

    acc[id] = next
    return acc
  }, {})
}

const restoreAnswersFromStorage = (
  persisted: Record<string, PersistedStoredAnswer>,
  questionMap: Map<string, QuestionnaireQuestion>,
): Record<string, QuestionnaireStoredAnswer> => {
  return Object.entries(persisted).reduce<Record<string, QuestionnaireStoredAnswer>>(
    (acc, [id, stored]) => {
      const question = questionMap.get(id)
      if (!question || question.type === 'file') {
        return acc
      }

      const selections =
        stored.selections && question.answers
          ? stored.selections
              .map((selectionId) => question.answers?.find((answer) => answer.id === selectionId))
              .filter((answer): answer is NonNullable<typeof answer> => Boolean(answer))
          : undefined

      acc[id] = {
        id: stored.id,
        text: stored.text,
        value: stored.value,
        fieldValues: stored.fieldValues,
        selections,
        blocksProgress:
          typeof stored.blocksProgress === 'boolean'
            ? stored.blocksProgress
            : selections?.some((selection) => selection.blocksProgress) ?? false,
      }
      return acc
    },
    {},
  )
}

const readFromStorage = (
  storageKey: string,
  questionMap: Map<string, QuestionnaireQuestion>,
): QuestionnairePersistenceState | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as PersistedState
    const answers = restoreAnswersFromStorage(parsed.answers ?? {}, questionMap)

    return {
      answers,
      currentQuestionIndex: Math.max(0, Number(parsed.currentQuestionIndex) || 0),
      showClarification: Boolean(parsed.showClarification),
    }
  } catch {
    return null
  }
}

const writeToStorage = (
  storageKey: string,
  state: QuestionnairePersistenceState,
  questionMap: Map<string, QuestionnaireQuestion>,
) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: PersistedState = {
      answers: sanitizeAnswersForStorage(state.answers, questionMap),
      currentQuestionIndex: state.currentQuestionIndex,
      showClarification: state.showClarification,
    }
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    // Si el usuario bloquea el almacenamiento, ignoramos silenciosamente.
  }
}

const clearFromStorage = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Ignorar errores al limpiar.
  }
}

export const useQuestionnairePersistence = (questions: QuestionnaireQuestion[]) => {
  const questionMap = useMemo(() => {
    return new Map(questions.map((question) => [question.id, question]))
  }, [questions])

  const storageKey = useMemo(() => buildStorageKey(questions), [questions])

  const restoredState = useMemo(
    () => readFromStorage(storageKey, questionMap),
    [questionMap, storageKey],
  )

  const persistState = useCallback(
    (state: QuestionnairePersistenceState) => {
      writeToStorage(storageKey, state, questionMap)
    },
    [questionMap, storageKey],
  )

  const clearState = useCallback(() => {
    clearFromStorage(storageKey)
  }, [storageKey])

  return {
    restoredState,
    persistState,
    clearState,
  }
}

















