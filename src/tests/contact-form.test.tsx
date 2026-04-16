import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, type Mock } from 'vitest'

// Mock ResizeObserver — required by Radix/shadcn components in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock the questionnaire service module
vi.mock('@/services/questionnaire', () => ({
  submitRegistrationData: vi.fn(),
  submitProgressPhotos: vi.fn(),
}))

// Mock the mirror service (fires side-effect we don't care about in tests)
vi.mock('@/services/questionnaire-mirror', () => ({
  mirrorSubmissionToTestBackend: vi.fn(),
}))

// Mock the Questionnaire component — it is 1700+ lines and not what we're testing.
// Wrap with forwardRef to match the real component's forwardRef + useImperativeHandle signature.
// The onClick swallows the return value of onComplete (which may be a rejected promise when
// handleComplete re-throws on JSON submit failure) so it doesn't become an unhandled rejection.
vi.mock('@/components/questionnaire', () => ({
  Questionnaire: React.forwardRef(function MockQuestionnaire(
    { onComplete }: { onComplete: (result: unknown) => void },
    _ref: React.Ref<unknown>,
  ) {
    return (
      <div data-testid="mock-questionnaire">
        <button
          data-testid="complete-questionnaire"
          onClick={() => {
            void Promise.resolve(
              onComplete({
                answers: {
                  name: [{ id: 'name', value: 'Test' }],
                  lastName: [{ id: 'lastName', value: 'User' }],
                  whatsapp_country_code: [{ id: 'whatsapp_country_code', value: '+54' }],
                  whatsapp_number: [{ id: 'whatsapp_number', value: '1122334455' }],
                },
                recaptchaToken: 'test-token',
              }),
            ).catch(() => {
              // Absorb re-thrown errors from handleComplete (e.g. on JSON submit failure).
              // ContactForm already shows an error message via setSubmissionError — no need
              // to propagate the rejection to the DOM event handler.
            })
          }}
        >
          Complete
        </button>
      </div>
    )
  }),
}))

// Mock PhotoUploadField — renders a test helper button "Fill all photos" that manually
// calls onFileChange for all 6 slots when clicked, enabling the submit button.
// This avoids the complexity of simulating real file-input interactions in jsdom.
vi.mock('@/components/photo-upload-field', () => ({
  PhotoUploadField: function MockPhotoUploadField({
    onFileChange,
  }: {
    storedFiles: (File | null)[]
    onFileChange: (index: number, file: File | null) => void
    helperText?: string
  }) {
    return (
      <div data-testid="mock-photo-upload-field">
        <button
          data-testid="fill-all-photos"
          onClick={() => {
            for (let i = 0; i < 6; i++) {
              onFileChange(i, new File(['photo'], `photo-${i}.jpg`, { type: 'image/jpeg' }))
            }
          }}
        >
          Fill all photos
        </button>
      </div>
    )
  },
}))

// Mock environment variables
vi.stubEnv('VITE_TELEGRAM_USER', 'test_trainer')
vi.stubEnv('DEV', 'true')

import { ContactForm } from '@/components/contact-form'
import { submitRegistrationData, submitProgressPhotos } from '@/services/questionnaire'

const mockSubmitRegistration = submitRegistrationData as Mock
const mockSubmitPhotos = submitProgressPhotos as Mock

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContactForm — two-step flow', () => {
  it('renders the questionnaire initially (no photo card, no success screen)', () => {
    render(<ContactForm />)

    expect(screen.getByTestId('mock-questionnaire')).toBeInTheDocument()
    expect(screen.queryByText('Fotos de evaluacion')).not.toBeInTheDocument()
    expect(screen.queryByText(/Aplicacion recibida/i)).not.toBeInTheDocument()
  })

  it('shows photo card after successful JSON submit (D-04)', async () => {
    mockSubmitRegistration.mockResolvedValueOnce({
      clientId: 'client-123',
      status: 201,
    })

    render(<ContactForm />)

    // Simulate questionnaire completion
    await act(async () => {
      await userEvent.click(screen.getByTestId('complete-questionnaire'))
    })

    // Wait for the photo card to appear
    await waitFor(() => {
      expect(screen.getByText('Fotos de evaluacion')).toBeInTheDocument()
    })

    // Questionnaire should be gone
    expect(screen.queryByTestId('mock-questionnaire')).not.toBeInTheDocument()

    // Verify registration was called
    expect(mockSubmitRegistration).toHaveBeenCalledTimes(1)

    // Photos should NOT have been submitted yet
    expect(mockSubmitPhotos).not.toHaveBeenCalled()
  })

  it('shows error and NO photo card when JSON submit fails (D-08)', async () => {
    mockSubmitRegistration.mockRejectedValueOnce(new Error('Network error'))

    render(<ContactForm />)

    // The mock button absorbs the re-throw from handleComplete (via void/catch in the mock),
    // so no unhandled rejection escapes to the test runner.
    await act(async () => {
      await userEvent.click(screen.getByTestId('complete-questionnaire'))
    })

    await waitFor(() => {
      expect(
        screen.getByText('Ups, no pudimos guardar tu info. Proba de nuevo en unos minutos.'),
      ).toBeInTheDocument()
    })

    // Photo card should NOT appear
    expect(screen.queryByText('Fotos de evaluacion')).not.toBeInTheDocument()
  })

  it('photo submit button is disabled until all 6 photos are selected', async () => {
    mockSubmitRegistration.mockResolvedValueOnce({
      clientId: 'client-123',
      status: 201,
    })

    render(<ContactForm />)

    await act(async () => {
      await userEvent.click(screen.getByTestId('complete-questionnaire'))
    })

    await waitFor(() => {
      expect(screen.getByText('Fotos de evaluacion')).toBeInTheDocument()
    })

    // The "Enviar fotos" button should be disabled (no photos selected)
    const submitBtn = screen.getByRole('button', { name: /enviar fotos/i })
    expect(submitBtn).toBeDisabled()
  })

  it('shows loading overlay with "Guardando tu aplicacion..." during JSON submit', async () => {
    // Make the registration hang (never resolves during this check)
    let resolveRegistration: (value: unknown) => void
    mockSubmitRegistration.mockImplementationOnce(
      () => new Promise((resolve) => { resolveRegistration = resolve }),
    )

    render(<ContactForm />)

    // Click complete — this starts the async registration
    act(() => {
      screen.getByTestId('complete-questionnaire').click()
    })

    // The loading overlay should appear
    await waitFor(() => {
      expect(screen.getByText('Guardando tu aplicacion...')).toBeInTheDocument()
    })

    // Clean up — resolve the promise so the component settles
    await act(async () => {
      resolveRegistration!({ clientId: 'client-123', status: 201 })
    })
  })

  it('D-14: photo submit success → success screen with "Aplicación recibida" appears', async () => {
    mockSubmitRegistration.mockResolvedValueOnce({ clientId: 'client-123', status: 201 })
    mockSubmitPhotos.mockResolvedValueOnce(undefined)

    render(<ContactForm />)

    // Step 1: complete questionnaire → triggers JSON registration
    await act(async () => {
      await userEvent.click(screen.getByTestId('complete-questionnaire'))
    })

    // Step 2: photo upload step should appear
    await waitFor(() => {
      expect(screen.getByText('Fotos de evaluacion')).toBeInTheDocument()
    })

    // Step 3: fill all 6 photo slots via the mock helper button, then wait for submit to enable
    await act(async () => {
      await userEvent.click(screen.getByTestId('fill-all-photos'))
    })

    const submitBtn = screen.getByRole('button', { name: /enviar fotos/i })
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled()
    })

    // Step 4: click submit
    await act(async () => {
      await userEvent.click(submitBtn)
    })

    // Step 5: success screen should appear
    await waitFor(() => {
      expect(screen.getByText(/Aplicación recibida/i)).toBeInTheDocument()
    })

    expect(mockSubmitPhotos).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Fotos de evaluacion')).not.toBeInTheDocument()
  })
})
