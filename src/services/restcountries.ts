import type { QuestionnaireSelectOption } from '@/types/questionnaire'

interface RestCountryResponse {
  name?: {
    common?: string
    official?: string
  }
  cca2?: string
  cca3?: string
  idd?: {
    root?: string
    suffixes?: string[]
    
  }
}

const REST_COUNTRIES_ENDPOINT =
  'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,idd'
const COUNTRIES_CACHE_KEY = 'ripo:countries:v1'
const CALLING_CODES_CACHE_KEY = 'ripo:callingCodes:v1'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 horas

const FALLBACK_COUNTRIES: QuestionnaireSelectOption[] = [
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
  'España',
  'Otros',
].map((country) => ({
  label: country,
  value: country,
}))

const FALLBACK_CALLING_CODES: QuestionnaireSelectOption[] = [
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
  { label: 'Otros', value: 'Otros' },
]

interface CachedPayload<T> {
  timestamp: number
  data: T
}

const isBrowser = (): boolean => typeof window !== 'undefined'

const readFromCache = <T>(key: string): T | null => {
  if (!isBrowser()) {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue) as CachedPayload<T>
    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      window.localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

const writeToCache = <T>(key: string, data: T): void => {
  if (!isBrowser()) {
    return
  }

  try {
    const payload: CachedPayload<T> = {
      timestamp: Date.now(),
      data,
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Si el usuario tiene el almacenamiento lleno o bloqueado, ignoramos silenciosamente.
  }
}

const normalizeCountries = (payload: RestCountryResponse[]): QuestionnaireSelectOption[] => {
  const collator = new Intl.Collator('es', { sensitivity: 'base' })

  return payload
    .map((country) => {
      const label = country.name?.common?.trim()
      if (!label) {
        return null
      }

      return {
        label,
        value: label,
      }
    })
    .filter((country): country is QuestionnaireSelectOption => Boolean(country))
    .sort((a, b) => collator.compare(a.label, b.label))
}

const normalizeCallingCodes = (
  payload: RestCountryResponse[],
): QuestionnaireSelectOption[] => {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  const codesMap = new Map<string, QuestionnaireSelectOption>()

  payload.forEach((country) => {
    const root = country.idd?.root?.trim()
    const suffixes = country.idd?.suffixes?.length ? country.idd.suffixes : ['']
    const displayName = country.name?.common ?? country.cca2 ?? country.cca3 ?? 'País'

    if (!root) {
      return
    }

    suffixes.forEach((suffix = '') => {
      const sanitizedSuffix = suffix.trim()
      const dial = `${root}${sanitizedSuffix}`.replace(/\s+/g, '')
      if (!dial) {
        return
      }

      const normalized = dial.startsWith('+') ? dial : `+${dial}`

      if (!codesMap.has(normalized)) {
        codesMap.set(normalized, {
          label: `${normalized} (${displayName})`,
          value: normalized,
        })
      }
    })
  })

  return Array.from(codesMap.values()).sort((a, b) => collator.compare(a.label, b.label))
}

const withFallback = (
  countries?: QuestionnaireSelectOption[] | null,
  callingCodes?: QuestionnaireSelectOption[] | null,
): RestCountriesData => ({
  countries: countries?.length ? countries : FALLBACK_COUNTRIES,
  callingCodes: callingCodes?.length ? callingCodes : FALLBACK_CALLING_CODES,
})

export interface RestCountriesData {
  countries: QuestionnaireSelectOption[]
  callingCodes: QuestionnaireSelectOption[]
}

export const loadRestCountriesData = async (): Promise<RestCountriesData> => {
  const cachedCountries = readFromCache<QuestionnaireSelectOption[]>(COUNTRIES_CACHE_KEY)
  const cachedCallingCodes = readFromCache<QuestionnaireSelectOption[]>(
    CALLING_CODES_CACHE_KEY,
  )

  if (cachedCountries && cachedCallingCodes) {
    return {
      countries: cachedCountries,
      callingCodes: cachedCallingCodes,
    }
  }

  if (!isBrowser()) {
    return withFallback(cachedCountries, cachedCallingCodes)
  }

  try {
    const response = await fetch(REST_COUNTRIES_ENDPOINT)
    if (!response.ok) {
      throw new Error(`REST Countries respondió ${response.status}`)
    }

    const data = (await response.json()) as RestCountryResponse[]
    const countries = normalizeCountries(data)
    const callingCodes = normalizeCallingCodes(data)

    if (countries.length && callingCodes.length) {
      writeToCache(COUNTRIES_CACHE_KEY, countries)
      writeToCache(CALLING_CODES_CACHE_KEY, callingCodes)
      return { countries, callingCodes }
    }

    return withFallback(countries, callingCodes)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[RestCountries] Error al obtener datos', error)
    return withFallback(cachedCountries, cachedCallingCodes)
  }
}



















