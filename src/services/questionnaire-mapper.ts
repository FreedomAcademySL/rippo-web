import type { QuestionnaireResult, QuestionnaireResultAnswer } from '@/types/questionnaire'
import {
  type FormCuerpoFitDto,
  type PhoneDto,
  Addiction,
  AddictionFrequency,
  Condition,
  RequireTreatmentConditions,
  Sexo,
  SleepProblem,
  SupplementHowOften,
  SupplementUnit,
  TrainingLocation,
  UserRecordVideo,
  WakeUpDelay,
} from '@/types/form-cuerpo-fit'
import { POSE_FIELD_NAMES } from '@/lib/pose-config'

const enumMaps = {
  treatment: {
    cond_diabetes: RequireTreatmentConditions.DIABETES_TYPE_1_OR_2,
    cond_hypo: RequireTreatmentConditions.HYPOTHYROIDISM,
    cond_hyper: RequireTreatmentConditions.HYPERTHYROIDISM,
    cond_hypertension: RequireTreatmentConditions.HYPERTENSION,
    cond_hypotension: RequireTreatmentConditions.HYPOTENSION,
    cond_litiasis: RequireTreatmentConditions.GALLSTONES,
    cond_anemia: RequireTreatmentConditions.ANEMIA,
    cond_infection: RequireTreatmentConditions.INFECTION,
    cond_none: RequireTreatmentConditions.NONE,
  } as Record<string, RequireTreatmentConditions>,
  condition: {
    cond_cholesterol: Condition.CHOLESTEROL_OR_TRIGLYCERIDES,
    cond_gastritis: Condition.GASTRITIS_OR_HEARTBURN,
    cond_constipation: Condition.CONSTIPATION_OR_DIARRHEA,
    cond_colon: Condition.IRRITABLE_BOWEL_SYNDROME,
  } as Record<string, Condition>,
  sleep: {
    sleep_bathroom: SleepProblem.WAKE_UP_TO_PEE,
    sleep_unknown: SleepProblem.WAKE_UP_NO_REASON,
    sleep_fall_asleep: SleepProblem.DIFFICULTY_FALLING_ASLEEP,
    sleep_noise: SleepProblem.WAKE_UP_MULTIPLE_TIMES,
    sleep_snore: SleepProblem.SNORING,
  } as Record<string, SleepProblem>,
  wakeUp: {
    wake_immediate: WakeUpDelay.INSTANTLY,
    wake_5: WakeUpDelay.FIVE_MINUTES,
    wake_10: WakeUpDelay.TEN_MINUTES,
    wake_more: WakeUpDelay.MORE_THAN_TEN_MINUTES,
  } as Record<string, WakeUpDelay>,
  trainingLocation: {
    train_gym: TrainingLocation.GYM,
    train_home_none: TrainingLocation.HOME_NO_EQUIPMENT,
    train_home_weights: TrainingLocation.HOME_FREE_WEIGHTS,
    train_home_multigym: TrainingLocation.HOME_MULTI_GYM,
  } as Record<string, TrainingLocation>,
  addiction: {
    [Addiction.WEED]: Addiction.WEED,
    [Addiction.CIGARETTES]: Addiction.CIGARETTES,
    [Addiction.ALCOHOL]: Addiction.ALCOHOL,
    [Addiction.GAMBLING]: Addiction.GAMBLING,
    [Addiction.VIDEOGAMES]: Addiction.VIDEOGAMES,
    [Addiction.RRSS]: Addiction.RRSS,
  } as Record<string, Addiction>,
  referral: {
    ref_tiktok: 'TikTok',
    ref_instagram: 'Instagram',
    ref_youtube: 'YouTube',
    ref_friend: 'Recomendado',
    ref_other: 'Otro',
  } as Record<string, string>,
}

const YES_IDS = {
  body_scale: 'body_scale_yes',
  food_scale: 'food_scale_yes',
  spray_oil: 'oil_yes',
  steps_app: 'steps_yes',
  junk_food: 'junk_yes',
  water: 'water_yes',
  screens_in_bed: 'screens_yes',
}

const WORKOUT_CONSISTENCY: Record<string, number> = {
  train_3: 3,
  train_4: 4,
  train_5: 5,
  train_6: 6,
}

const getAnswerEntries = (
  answers: QuestionnaireResult['answers'],
  questionId: string,
): QuestionnaireResultAnswer[] => answers?.[questionId] ?? []

const getSingleChoiceId = (answers: QuestionnaireResult['answers'], questionId: string): string | undefined =>
  getAnswerEntries(answers, questionId)[0]?.id

const getTextAnswer = (answers: QuestionnaireResult['answers'], questionId: string): string => {
  const value = getAnswerEntries(answers, questionId)[0]?.value
  return typeof value === 'string' ? value.trim() : ''
}

const getNumberAnswer = (answers: QuestionnaireResult['answers'], questionId: string): number | null => {
  const text = getTextAnswer(answers, questionId)
  if (!text) {
    return null
  }
  const parsed = Number(text.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

const getDateAnswer = (answers: QuestionnaireResult['answers'], questionId: string): Date => {
  const text = getTextAnswer(answers, questionId)
  const parsed = text ? new Date(text) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

const getMultiChoiceIds = (answers: QuestionnaireResult['answers'], questionId: string): string[] => {
  const entries = getAnswerEntries(answers, questionId)
  if (!entries.length) {
    return []
  }
  return entries.flatMap((entry) => {
    if (Array.isArray(entry.value)) {
      return entry.value
    }
    return entry.id ? [entry.id] : []
  })
}

const sanitizeNumber = (value?: string): string => value?.replace(/\D/g, '') ?? ''

const ensureInstagramHandle = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  if (trimmed.startsWith('@')) {
    return trimmed
  }
  return `@${trimmed}`
}

const getNameFields = (answers: QuestionnaireResult['answers']): { name: string; lastName: string } => {
  const name = getTextAnswer(answers, 'name')
  const lastName = getTextAnswer(answers, 'lastName')

  if (name || lastName) {
    return {
      name: name || 'Sin nombre',
      lastName: lastName || 'Pendiente',
    }
  }

  const legacyFullName = getTextAnswer(answers, 'full_name')
  const [legacyFirst, ...legacyRest] = legacyFullName.split(/\s+/).filter(Boolean)

  return {
    name: legacyFirst || 'Sin nombre',
    lastName: legacyRest.join(' ') || 'Pendiente',
  }
}

const buildPhone = (answers: QuestionnaireResult['answers']): PhoneDto => {
  const countryCode = sanitizeNumber(getTextAnswer(answers, 'whatsapp_country_code')) || '00'
  const number = sanitizeNumber(getTextAnswer(answers, 'whatsapp_number')) || '0000000'
  const explicitFull = getTextAnswer(answers, 'whatsapp_full')
  const normalizedFull = explicitFull ? explicitFull.replace(/\s+/g, '') : ''
  const fullNumber =
    normalizedFull ||
    (countryCode && number ? `+${countryCode}${number}` : undefined)

  return {
    countryCode,
    number,
    fullNumber,
  }
}

const mapGenderToSexo = (genderId?: string): Sexo =>
  genderId === 'gender_female' ? Sexo.FEMALE : Sexo.MALE

const mapBooleanById = (
  answers: QuestionnaireResult['answers'],
  questionId: keyof typeof YES_IDS,
): boolean => {
  const entry = getAnswerEntries(answers, questionId)[0]
  const yesId = YES_IDS[questionId].toLowerCase()

  const id = entry?.id?.toLowerCase()
  if (id) {
    return id === yesId
  }

  const value = entry?.value
  if (typeof value === 'string') {
    return value.toLowerCase() === yesId
  }
  if (typeof value === 'number') {
    return value > 0
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (Array.isArray(value)) {
    return value.some((item) => String(item).toLowerCase() === yesId)
  }

  return false
}

const mapWorkoutConsistency = (answers: QuestionnaireResult['answers']): number =>
  WORKOUT_CONSISTENCY[getSingleChoiceId(answers, 'training_days') ?? ''] ?? 3

const mapTrainingLocation = (answers: QuestionnaireResult['answers']): TrainingLocation =>
  enumMaps.trainingLocation[getSingleChoiceId(answers, 'training_location') ?? ''] ??
  TrainingLocation.GYM

const mapRequireTreatmentCondition = (
  answers: QuestionnaireResult['answers'],
): RequireTreatmentConditions[] | string[] | null => {
  const selections = getMultiChoiceIds(answers, 'health_conditions')
  if (!selections.length) {
    return null
  }
  if (selections.includes('cond_none')) {
    return [RequireTreatmentConditions.NONE]
  }

  const mappedEnums = selections
    .map((id) => enumMaps.treatment[id])
    .filter((value): value is RequireTreatmentConditions => Boolean(value))

  let otherDetail = ''
  if (selections.includes('cond_other')) {
    const detail = getTextAnswer(answers, 'health_conditions_other_detail')
    otherDetail = detail || 'Otro'
  }

  if (!mappedEnums.length && !otherDetail) {
    return null
  }

  if (otherDetail) {
    const enumAsStrings = mappedEnums.map((item) => item as string)
    return [...enumAsStrings, otherDetail]
  }

  return mappedEnums
}

const mapCondition = (answers: QuestionnaireResult['answers']): Condition | string | null => {
  const selections = getMultiChoiceIds(answers, 'other_health_conditions')
  if (!selections.length || selections.includes('cond_none_other')) {
    return null
  }

  // Map all enum selections and join them — backend accepts comma-separated values
  // (consistent with how requireTreatmentCondition is handled in flattenDtoForBackend)
  const mapped = selections
    .map((id) => enumMaps.condition[id])
    .filter(Boolean)

  const parts: string[] = mapped.map((v) => v as string)

  if (selections.includes('cond_other_extra')) {
    const detail = getTextAnswer(answers, 'other_health_conditions_detail')
    if (detail) parts.push(detail)
  }

  return parts.length ? parts.join(',') : null
}

const mapSleepProblem = (
  answers: QuestionnaireResult['answers'],
): SleepProblem[] | string[] | null => {
  const selections = getMultiChoiceIds(answers, 'sleep_issues')
  if (!selections.length || selections.includes('sleep_none')) {
    return null
  }

  const mappedEnums = selections
    .map((id) => enumMaps.sleep[id])
    .filter((value): value is SleepProblem => Boolean(value))

  let otherDetail = ''
  if (selections.includes('sleep_other')) {
    const detail = getTextAnswer(answers, 'sleep_other_detail')
    otherDetail = detail || 'Otro'
  }

  if (!mappedEnums.length && !otherDetail) {
    return null
  }

  if (otherDetail) {
    const enumAsStrings = mappedEnums.map((item) => item as string)
    return [...enumAsStrings, otherDetail]
  }

  return mappedEnums
}

const mapAddiction = (answers: QuestionnaireResult['answers']): {
  addiction: FormCuerpoFitDto['addiction']
  addictionAmount: number | null
  addictionFrequency: AddictionFrequency | null
  detail: string
} => {
  const selections = getMultiChoiceIds(answers, 'vices')
  const detail = getTextAnswer(answers, 'vices_detail')
  const amount = getNumberAnswer(answers, 'vices_amount')
  const frequencyId = getSingleChoiceId(answers, 'vices_frequency') as AddictionFrequency | undefined

  if (!selections.length || selections.includes('vice_none')) {
    return {
      addiction: null,
      addictionAmount: null,
      addictionFrequency: null,
      detail,
    }
  }

  const mappedAddictions = selections
    .map((id) => enumMaps.addiction[id])
    .filter(Boolean)

  let addiction: FormCuerpoFitDto['addiction'] = null
  if (mappedAddictions.length === 1) {
    addiction = mappedAddictions[0]
  } else if (mappedAddictions.length > 1) {
    addiction = mappedAddictions.join(', ')
  } else {
    addiction = detail || selections.join(', ')
  }

  return {
    addiction,
    addictionAmount: amount,
    addictionFrequency: frequencyId ?? null,
    detail,
  }
}

const mapWakeUpDelay = (answers: QuestionnaireResult['answers']): WakeUpDelay | string | null =>
  enumMaps.wakeUp[getSingleChoiceId(answers, 'wake_up_time') ?? ''] ?? null

const mapReferral = (answers: QuestionnaireResult['answers']): string => {
  const referralId = getSingleChoiceId(answers, 'referral') ?? ''
  const label = enumMaps.referral[referralId] ?? ''
  const detail = getTextAnswer(answers, 'referral_detail')

  if (!label && !detail) {
    return 'No especificado'
  }
  if (!detail) {
    return label
  }
  if (!label) {
    return detail
  }
  return `${label} - ${detail}`
}

export const mapQuestionnaireResultToDto = (result: QuestionnaireResult): {
  dto: FormCuerpoFitDto
} => {
  const answers = result.answers ?? {}
  const recaptchaToken = result.recaptchaToken
  if (!recaptchaToken) {
    throw new Error('No pudimos validar reCAPTCHA. Por favor intentá nuevamente.')
  }
  const { name, lastName } = getNameFields(answers)

  const goal = getTextAnswer(answers, 'goal') || 'No definido'
  const whyGoal = getTextAnswer(answers, 'whyGoal') || goal
  const finalMessage = getTextAnswer(answers, 'final_message')
  const whatsappOtherDetail = getTextAnswer(answers, 'whatsapp_other_detail')
  const otherTreatmentDetail = getTextAnswer(answers, 'health_conditions_other_detail')
  const otherConditionDetail = getTextAnswer(answers, 'other_health_conditions_detail')

  const { addiction, addictionAmount, addictionFrequency, detail: addictionDetail } = mapAddiction(answers)
  const supplementDescription = getTextAnswer(answers, 'supplement')
  const supplementAmount = getNumberAnswer(answers, 'supplement_amount')
  const supplementUnit = getSingleChoiceId(answers, 'supplement_unit') as SupplementUnit | undefined
  const supplementFrequency = getSingleChoiceId(
    answers,
    'supplement_frequency',
  ) as SupplementHowOften | undefined

  const notes = [
    finalMessage,
    addictionDetail && `Vicios: ${addictionDetail}`,
    otherTreatmentDetail && `Condiciones tratadas: ${otherTreatmentDetail}`,
    otherConditionDetail && `Otras condiciones: ${otherConditionDetail}`,
    whatsappOtherDetail && `Whatsapp extra: ${whatsappOtherDetail}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const dto: FormCuerpoFitDto = {
    email: getTextAnswer(answers, 'email'),
    name,
    lastName,
    sex: mapGenderToSexo(getSingleChoiceId(answers, 'gender')),
    dob: getDateAnswer(answers, 'birthday'),
    height: getNumberAnswer(answers, 'height') ?? 0,
    weight: getNumberAnswer(answers, 'weight') ?? 0,
    work: getTextAnswer(answers, 'job') || 'No informado',
    goal,
    whyGoal,
    weighingScale: mapBooleanById(answers, 'body_scale'),
    foodScale: mapBooleanById(answers, 'food_scale'),
    cookingSpray: mapBooleanById(answers, 'spray_oil'),
    stepCountingApp: mapBooleanById(answers, 'steps_app'),
    eatsJunkFoodMoreThan4PerWeek: mapBooleanById(answers, 'junk_food'),
    drinkEnoughWaterPerDay: mapBooleanById(answers, 'water'),
    addiction,
    addictionAmount,
    addictionFrequency,
    requireTreatmentCondition: mapRequireTreatmentCondition(answers),
    condition: mapCondition(answers),
    sleepProblem: mapSleepProblem(answers),
    getUpTime: mapWakeUpDelay(answers),
    screenBeforeSleep: mapBooleanById(answers, 'screens_in_bed'),
    workoutConsistency: mapWorkoutConsistency(answers),
    placeToWorkOut: mapTrainingLocation(answers),
    supplement: supplementDescription || null,
    supplementUnit: supplementUnit ?? null,
    supplementHowMany: supplementAmount,
    supplementHowOften: supplementFrequency ?? null,
    userRecordVideo: UserRecordVideo.NO,  // Always NO -- video removed
    country: getTextAnswer(answers, 'country') || 'No informado',
    city: getTextAnswer(answers, 'city') || 'No informado',
    howDidUserEndUpHere: mapReferral(answers),
    recaptchaToken,  // MUST remain -- extracted from result.recaptchaToken
    instagramUser: ensureInstagramHandle(getTextAnswer(answers, 'instagram')),
    phone: buildPhone(answers),
    lastComment: notes ? notes.slice(0, 1000) : undefined,
  }

  return { dto }
}

/**
 * Transforms FormCuerpoFitDto into a flat object matching backend ClientApplicationDto.
 *
 * The backend expects:
 * - phone: flattened to top-level countryCode, number, fullNumber (no nested phone object)
 * - dob: ISO date string (not Date object)
 * - requireTreatmentCondition: comma-joined string (not array)
 * - sleepProblem: comma-joined string (not array)
 * - condition: string (not array -- already single-value but ensure string)
 * - null/undefined fields: omitted entirely (backend uses @IsOptional)
 */
const flattenDtoForBackend = (dto: FormCuerpoFitDto): Record<string, unknown> => {
  // Destructure phone out -- it must NOT appear as a key in the output
  const { phone, dob, requireTreatmentCondition, sleepProblem, condition, ...rest } = dto

  const flat: Record<string, unknown> = { ...rest }

  // Flatten phone to top-level fields
  flat.countryCode = phone.countryCode
  flat.number = phone.number
  if (phone.fullNumber) {
    flat.fullNumber = phone.fullNumber
  }

  // Convert Date to ISO string (e.g., "1990-05-15T00:00:00.000Z")
  flat.dob = dob instanceof Date ? dob.toISOString() : String(dob)

  // Convert arrays to comma-separated strings
  if (requireTreatmentCondition != null) {
    flat.requireTreatmentCondition = Array.isArray(requireTreatmentCondition)
      ? requireTreatmentCondition.join(',')
      : String(requireTreatmentCondition)
  }

  if (sleepProblem != null) {
    flat.sleepProblem = Array.isArray(sleepProblem)
      ? sleepProblem.join(',')
      : String(sleepProblem)
  }

  if (condition != null) {
    flat.condition = String(condition)
  }

  return flat
}

/**
 * Builds the JSON body for the registration request (POST /cuerpo-fit).
 * Returns a flat Record<string, unknown> matching backend ClientApplicationDto:
 * phone is flattened to countryCode/number/fullNumber, dob is an ISO string,
 * requireTreatmentCondition and sleepProblem are comma-separated strings.
 */
export const buildRegistrationJsonBody = (result: QuestionnaireResult): Record<string, unknown> => {
  const { dto } = mapQuestionnaireResultToDto(result)
  return flattenDtoForBackend(dto)
}

/**
 * Builds multipart FormData for the progress photos request
 * (POST /clients/:clientId/progress-photos).
 * Appends each photo file under its pose field name and adds context=registration.
 */
export const buildPhotosFormData = (photos: File[]): FormData => {
  const fd = new FormData()
  POSE_FIELD_NAMES.forEach((pose, i) => {
    if (photos[i]) {
      fd.append(pose, photos[i], photos[i].name)
    }
  })
  fd.append('context', 'registration')
  return fd
}

const appendValue = (formData: FormData, key: string, value: unknown) => {
  if (value === undefined || value === null) {
    return
  }
  if (value instanceof Date) {
    formData.append(key, value.toISOString())
    return
  }
  if (typeof value === 'boolean') {
    formData.append(key, value ? 'true' : 'false')
    return
  }
  formData.append(key, String(value))
}

const appendPhone = (formData: FormData, phone: PhoneDto) => {
  appendValue(formData, 'countryCode', phone.countryCode)
  appendValue(formData, 'number', phone.number)
  if (phone.fullNumber) {
    appendValue(formData, 'fullNumber', phone.fullNumber)
  }
}

/**
 * Kept for backward compatibility (mirror service uses it).
 * Video file appending removed -- video replaced by 6 photos.
 */
export const buildFormCuerpoFitFormData = (result: QuestionnaireResult): FormData => {
  const { dto } = mapQuestionnaireResultToDto(result)
  const formData = new FormData()

  ;(Object.entries(dto) as [keyof FormCuerpoFitDto, FormCuerpoFitDto[keyof FormCuerpoFitDto]][]).forEach(
    ([key, value]) => {
      if (key === 'phone') {
        appendPhone(formData, value as PhoneDto)
        return
      }
      appendValue(formData, key, value)
    },
  )

  return formData
}
