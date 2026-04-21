import { buildRegistrationJsonBody } from '@/services/questionnaire-mapper'
import type { QuestionnaireResult } from '@/types/questionnaire'

/**
 * Helper: build a minimal QuestionnaireResult with the required fields.
 * Uses the reordered question IDs from Phase 9 (D-01).
 */
function buildMinimalResult(overrides?: Partial<QuestionnaireResult>): QuestionnaireResult {
  const answers: QuestionnaireResult['answers'] = {
    injury: [{ id: 'injury_none', value: 3 }],
    name: [{ id: 'name', value: 'Test' }],
    lastName: [{ id: 'lastName', value: 'User' }],
    gender: [{ id: 'gender_male', value: 1 }],
    birthday: [{ id: 'birthday', value: '1995-06-15' }],
    email: [{ id: 'email', value: 'test@example.com' }],
    whatsapp_country_code: [{ id: 'whatsapp_country_code', value: '+54' }],
    whatsapp_number: [{ id: 'whatsapp_number', value: '1122334455' }],
    whatsapp_confirmation: [{ id: 'whatsapp_confirmation_yes', value: 3 }],
    country: [{ id: 'country', value: 'Argentina' }],
    city: [{ id: 'city', value: 'Buenos Aires' }],
    job: [{ id: 'job', value: 'Developer' }],
    goal: [{ id: 'goal', value: 'Get fit and healthy for summer' }],
    whyGoal: [{ id: 'whyGoal', value: 'I want to feel better about myself' }],
    height: [{ id: 'height', value: '178' }],
    weight: [{ id: 'weight', value: '80' }],
    health_conditions: [{ id: 'cond_none', text: 'No tengo ninguna', value: 3 }],
    other_health_conditions: [{ id: 'cond_none_other', text: 'No tengo ninguna', value: 3 }],
    sleep_issues: [{ id: 'sleep_none', text: 'No tengo problemas', value: 3 }],
    wake_up_time: [{ id: 'wake_immediate', value: 3 }],
    screens_in_bed: [{ id: 'screens_no', value: 3 }],
    body_scale: [{ id: 'body_scale_yes', value: 2 }],
    food_scale: [{ id: 'food_scale_yes', value: 2 }],
    spray_oil: [{ id: 'oil_yes', value: 2 }],
    steps_app: [{ id: 'steps_yes', value: 2 }],
    junk_food: [{ id: 'junk_no', value: 2 }],
    water: [{ id: 'water_yes', value: 2 }],
    walking_enough: [{ id: 'walking_enough_yes', value: 2 }],
    vices: [{ id: 'vice_none', text: 'No tengo ningun vicio', value: 3 }],
    training_days: [{ id: 'train_3', value: 1 }],
    training_location: [{ id: 'train_gym', value: 3 }],
    referral: [{ id: 'ref_tiktok', value: 1 }],
    ...overrides?.answers,
  }

  return {
    answers,
    recaptchaToken: overrides?.recaptchaToken ?? 'test-token-123',
    ...overrides,
    // Re-apply answers after spread so overrides.answers merges
    ...(overrides?.answers ? { answers } : {}),
  }
}

describe('buildRegistrationJsonBody', () => {
  it('returns a flat object with top-level countryCode, number, fullNumber (no nested phone)', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body).toHaveProperty('countryCode', '54')
    expect(body).toHaveProperty('number', '1122334455')
    expect(body).toHaveProperty('fullNumber', '+541122334455')
    expect(body).not.toHaveProperty('phone')
  })

  it('converts dob to ISO string', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(typeof body.dob).toBe('string')
    expect(body.dob as string).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('includes recaptchaToken from QuestionnaireResult', () => {
    const result = buildMinimalResult({ recaptchaToken: 'my-captcha-token' })
    const body = buildRegistrationJsonBody(result)

    expect(body.recaptchaToken).toBe('my-captcha-token')
  })

  it('throws when recaptchaToken is missing', () => {
    const result = buildMinimalResult({ recaptchaToken: undefined })

    expect(() => buildRegistrationJsonBody(result)).toThrow('reCAPTCHA')
  })

  it('maps name and lastName from separate question answers', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.name).toBe('Test')
    expect(body.lastName).toBe('User')
  })

  it('maps gender_male to Sexo.MALE', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.sex).toBe('hombre')
  })

  it('maps height and weight as numbers', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.height).toBe(178)
    expect(body.weight).toBe(80)
  })

  it('includes whyGoal in the output (D-03: whyGoal stays)', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.whyGoal).toBe('I want to feel better about myself')
  })

  it('maps training_location to enum string', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.placeToWorkOut).toBe('gimnasio')
  })

  it('maps boolean fields correctly (body_scale, food_scale, etc.)', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.weighingScale).toBe(true)
    expect(body.foodScale).toBe(true)
    expect(body.cookingSpray).toBe(true)
    expect(body.stepCountingApp).toBe(true)
    expect(body.eatsJunkFoodMoreThan4PerWeek).toBe(false)
    expect(body.drinkEnoughWaterPerDay).toBe(true)
    expect(body.walksEnoughSteps).toBe(true)
  })

  it("produces hasSleepProblems: false for sleep_issues=['sleep_none']", () => {
    const result = buildMinimalResult({
      answers: { sleep_issues: [{ id: 'sleep_none', value: 3 }] },
    })
    const body = buildRegistrationJsonBody(result)
    expect(body.hasSleepProblems).toBe(false)
  })

  it("produces hasSleepProblems: true for sleep_issues=['sleep_bathroom']", () => {
    const result = buildMinimalResult({
      answers: { sleep_issues: [{ id: 'sleep_bathroom', value: 1 }] },
    })
    const body = buildRegistrationJsonBody(result)
    expect(body.hasSleepProblems).toBe(true)
  })

  it('produces hasSleepProblems: false for empty sleep_issues (A1 — empty array case)', () => {
    const result = buildMinimalResult({
      answers: { sleep_issues: [] },
    })
    const body = buildRegistrationJsonBody(result)
    expect(body.hasSleepProblems).toBe(false)
  })

  it('produces walksEnoughSteps: true for walking_enough_yes', () => {
    const result = buildMinimalResult({
      answers: { walking_enough: [{ id: 'walking_enough_yes', value: 2 }] },
    })
    const body = buildRegistrationJsonBody(result)
    expect(body.walksEnoughSteps).toBe(true)
  })

  it('produces walksEnoughSteps: false for walking_enough_no', () => {
    const result = buildMinimalResult({
      answers: { walking_enough: [{ id: 'walking_enough_no', value: 0 }] },
    })
    const body = buildRegistrationJsonBody(result)
    expect(body.walksEnoughSteps).toBe(false)
  })

  it('does NOT include progress_photos in the output (removed in Plan 01)', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body).not.toHaveProperty('progress_photos')
  })

  it('sets userRecordVideo to NO', () => {
    const result = buildMinimalResult()
    const body = buildRegistrationJsonBody(result)

    expect(body.userRecordVideo).toBe('no')
  })
})
