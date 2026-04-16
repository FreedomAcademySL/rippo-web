import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// isHeic — exported for testing. Pure helper with no side effects.
// ---------------------------------------------------------------------------
import { isHeic } from '@/lib/photo-compression'

function makeFile(name: string, type: string): File {
  return new File(['data'], name, { type })
}

describe('isHeic', () => {
  it('detects image/heic MIME type', () => {
    expect(isHeic(makeFile('photo.heic', 'image/heic'))).toBe(true)
  })

  it('detects image/heif MIME type', () => {
    expect(isHeic(makeFile('photo.heif', 'image/heif'))).toBe(true)
  })

  it('detects .heic extension when MIME is empty (Safari/iOS)', () => {
    expect(isHeic(makeFile('photo.HEIC', ''))).toBe(true)
  })

  it('detects .heif extension when MIME is empty', () => {
    expect(isHeic(makeFile('photo.HEIF', ''))).toBe(true)
  })

  it('returns false for image/jpeg', () => {
    expect(isHeic(makeFile('photo.jpg', 'image/jpeg'))).toBe(false)
  })

  it('returns false for image/png', () => {
    expect(isHeic(makeFile('photo.png', 'image/png'))).toBe(false)
  })
})
