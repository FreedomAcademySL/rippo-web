import type { ReactNode } from 'react'
import type { VideoCompressionMetadata } from '@/types/video'

export type QuestionnaireQuestionType =
  | 'single-choice'
  | 'multi-choice'
  | 'text'
  | 'textarea'
  | 'number'
  | 'phone'
  | 'date'
  | 'file'

export interface QuestionnaireAnswer {
  id: string
  text: string
  value?: number
  description?: string
  blocksProgress?: boolean
}

export interface QuestionnaireQuestion {
  id: string
  title: string
  category: string
  required?: boolean
  description?: ReactNode
  clarification?: string
  type?: QuestionnaireQuestionType
  answers?: QuestionnaireAnswer[]
  placeholder?: string
  helperText?: string
  accept?: string
  maxFiles?: number
  enableVideoCompression?: boolean
}

export interface QuestionnaireStoredAnswer {
  id: string
  value?: number
  text?: string
  selections?: QuestionnaireAnswer[]
  files?: File[]
  originalFiles?: File[]
  videoCompression?: VideoCompressionMetadata
  blocksProgress?: boolean
}

export interface QuestionnaireTheme {
  backgroundColor: string
  primaryColor: string
  textColor: string
  borderRadius: string
}

export interface QuestionnaireResultAnswer {
  id: string
  value?: string | { type: 'file'; name: string; file?: File }
}

export interface QuestionnaireResult {
  answers: Record<string, QuestionnaireResultAnswer[]>
  completedAt: Date
}

export interface QuestionnaireProps {
  questions: QuestionnaireQuestion[]
  onComplete: (result: QuestionnaireResult) => void
  theme?: QuestionnaireTheme
  allowSkip?: boolean
  showProgressBar?: boolean
  className?: string
  clarification?: ReactNode
  hideButtons?: boolean
  onPrevious?: () => void
  onNext?: () => void
}



