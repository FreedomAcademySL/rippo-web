import type { QuestionnaireSelectOption } from '@/types/questionnaire'

const LATAM_COUNTRIES = [
  'Argentina',
  'Bolivia',
  'Brasil',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'Guatemala',
  'Honduras',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
] as const

const EU_COUNTRIES = [
  'Alemania',
  'España',
  'Francia',
  'Italia',
  'Países Bajos',
  'Portugal',
  'Bélgica',
  'Suecia',
  'Noruega',
  'Dinamarca',
  'Finlandia',
  'Irlanda',
  'Grecia',
] as const

const NORTH_AMERICA = ['Estados Unidos', 'Canadá'] as const

const makeOptions = (entries: readonly string[]): QuestionnaireSelectOption[] =>
  entries.map((label) => ({
    label,
    value: label,
  }))

export const COUNTRY_OPTIONS: QuestionnaireSelectOption[] = [
  ...makeOptions(LATAM_COUNTRIES),
  ...makeOptions(EU_COUNTRIES),
  ...makeOptions(NORTH_AMERICA),
  { label: 'Otros', value: 'Otros' },
]

export const CALLING_CODE_OPTIONS: QuestionnaireSelectOption[] = [
  { label: '+54 (Argentina)', value: '+54' },
  { label: '+591 (Bolivia)', value: '+591' },
  { label: '+55 (Brasil)', value: '+55' },
  { label: '+56 (Chile)', value: '+56' },
  { label: '+57 (Colombia)', value: '+57' },
  { label: '+506 (Costa Rica)', value: '+506' },
  { label: '+53 (Cuba)', value: '+53' },
  { label: '+593 (Ecuador)', value: '+593' },
  { label: '+503 (El Salvador)', value: '+503' },
  { label: '+502 (Guatemala)', value: '+502' },
  { label: '+504 (Honduras)', value: '+504' },
  { label: '+52 (México)', value: '+52' },
  { label: '+505 (Nicaragua)', value: '+505' },
  { label: '+507 (Panamá)', value: '+507' },
  { label: '+595 (Paraguay)', value: '+595' },
  { label: '+51 (Perú)', value: '+51' },
  { label: '+1787 (Puerto Rico)', value: '+1787' },
  { label: '+1809 (República Dominicana)', value: '+1809' },
  { label: '+598 (Uruguay)', value: '+598' },
  { label: '+58 (Venezuela)', value: '+58' },
  { label: '+34 (España)', value: '+34' },
  { label: '+49 (Alemania)', value: '+49' },
  { label: '+33 (Francia)', value: '+33' },
  { label: '+39 (Italia)', value: '+39' },
  { label: '+31 (Países Bajos)', value: '+31' },
  { label: '+351 (Portugal)', value: '+351' },
  { label: '+32 (Bélgica)', value: '+32' },
  { label: '+46 (Suecia)', value: '+46' },
  { label: '+47 (Noruega)', value: '+47' },
  { label: '+45 (Dinamarca)', value: '+45' },
  { label: '+358 (Finlandia)', value: '+358' },
  { label: '+353 (Irlanda)', value: '+353' },
  { label: '+30 (Grecia)', value: '+30' },
  { label: '+1 (Estados Unidos / Canadá)', value: '+1' },
  { label: 'Otros', value: 'Otros' },
]


