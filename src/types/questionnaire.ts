import type { ReactNode, InputHTMLAttributes } from 'react'
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
  | 'select'

export type QuestionnaireFieldType = Exclude<
  QuestionnaireQuestionType,
  'single-choice' | 'multi-choice' | 'file'
>

export interface QuestionnaireField {
  id: string
  label: string
  type?: QuestionnaireFieldType
  placeholder?: string
  helperText?: string
  min?: number
  max?: number
  step?: number
  pattern?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  minLength?: number
  maxLength?: number
}

export interface QuestionnaireSelectOption {
  label: string
  value: string
}

export interface QuestionnaireDependencyConfig {
  questionId: string
  allowedAnswerIds: string[]
}

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
  dependsOn?: QuestionnaireDependencyConfig | QuestionnaireDependencyConfig[]
  fields?: QuestionnaireField[]
  selectOptions?: QuestionnaireSelectOption[]
  optionsSource?: 'countries' | 'callingCodes'
  min?: number
  max?: number
  step?: number
  minAge?: number
  maxAge?: number
  pattern?: string
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
  multiValueFormat?: 'entries' | 'array'
  minLength?: number
  maxLength?: number
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
  fieldValues?: Record<string, string>
}

export interface QuestionnaireTheme {
  backgroundColor: string
  primaryColor: string
  textColor: string
  borderRadius: string
}

export interface QuestionnaireResultAnswer {
  id: string
  fieldId?: string
  value?: string | string[] | { type: 'file'; name: string; file?: File }
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



