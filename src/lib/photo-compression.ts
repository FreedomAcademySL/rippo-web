const MAX_SIDE = 1920
const JPEG_QUALITY = 0.8

/**
 * Returns true if the file is HEIC/HEIF.
 * Checks MIME type first; falls back to filename extension because some
 * browsers (e.g. older Safari) report an empty MIME type for HEIC files.
 */
export function isHeic(file: File): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ext === 'heic' || ext === 'heif'
}

/**
 * Converts a HEIC/HEIF file to JPEG before the Canvas compression pipeline.
 * If conversion fails for any reason, falls back to the original file (D-03).
 *
 * Uses heic-to (bundles libheif 1.21.2) instead of the abandoned heic2any
 * (bundled libheif 0.4.5, rejects iOS 18 HEIC containers). Dynamic import
 * keeps the WASM chunk out of the main bundle and out of the jsdom module
 * graph for non-browser test environments.
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const { heicTo } = await import('heic-to')
    const blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 1 })
    const jpegName = file.name.replace(/\.[^.]+$/, '.jpg')
    return new File([blob], jpegName, { type: 'image/jpeg' })
  } catch {
    // heic-to failed — return original so the user is not blocked (D-03)
    return file
  }
}

export async function compressPhoto(file: File): Promise<File> {
  // Convert HEIC/HEIF to JPEG before createImageBitmap (D-02)
  const source = isHeic(file) ? await convertHeicToJpeg(file) : file

  try {
    const bitmap = await createImageBitmap(source)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return source
    }
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    return new Promise<File>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(source)
            return
          }
          const compressedName = source.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], compressedName, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        JPEG_QUALITY,
      )
    })
  } catch {
    // createImageBitmap failed — return source (already JPEG if HEIC was converted)
    return source
  }
}
