'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Input as MediabunnyInput,
  ALL_FORMATS,
  BlobSource,
  Output,
  BufferTarget,
  Mp4OutputFormat,
  Conversion,
} from 'mediabunny'
import type {
  VideoCompressionMetadata,
  VideoCompressionPayload,
  VideoCompressionStatus,
} from '@/types/video'

interface UseVideoCompressorOptions {
  maxWidth?: number
  videoBitrate?: number
  audioBitrate?: number
}

const DEFAULT_OPTIONS: Required<UseVideoCompressorOptions> = {
  maxWidth: 720,
  videoBitrate: 65_000,
  audioBitrate: 28_000,
}

const getCompressedFileName = (name: string) => {
  const dotIndex = name.lastIndexOf('.')
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name
  return `${baseName}-compressed.mp4`
}

export function useVideoCompressor(options?: UseVideoCompressorOptions) {
  const [status, setStatus] = useState<VideoCompressionStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<VideoCompressionMetadata | null>(null)
  const [result, setResult] = useState<VideoCompressionPayload | null>(null)
  const [realtimeFactor, setRealtimeFactor] = useState<number | null>(null)

  const conversionRef = useRef<Conversion | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const realtimeFactorRef = useRef<number | null>(null)

  const cleanupConversion = useCallback(async () => {
    if (!conversionRef.current) {
      return
    }
    try {
      await conversionRef.current.cancel()
    } catch {
      // ignore cancellation errors
    } finally {
      conversionRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
    setMetadata(null)
    setResult(null)
    setRealtimeFactor(null)
    realtimeFactorRef.current = null
  }, [])

  const compress = useCallback(
    async (file: File): Promise<VideoCompressionPayload> => {
      await cleanupConversion()
      setStatus('preparing')
      setProgress(0)
      setError(null)
      setMetadata(null)
      setResult(null)
      setRealtimeFactor(null)
      realtimeFactorRef.current = null

      const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
      const source = new BlobSource(file)
      const input = new MediabunnyInput({
        source,
        formats: ALL_FORMATS,
      })

      const output = new Output({
        target: new BufferTarget(),
        format: new Mp4OutputFormat(),
      })

      const conversion = await Conversion.init({
        input,
        output,
        video: {
          width: resolvedOptions.maxWidth,
          bitrate: resolvedOptions.videoBitrate,
        },
        audio: {
          bitrate: resolvedOptions.audioBitrate,
        },
      })

      conversionRef.current = conversion
      startedAtRef.current = performance.now()
      const startedAt = Date.now()

      try {
        const duration = await input.computeDuration().catch(() => null)

        setStatus('compressing')

        conversion.onProgress = (value: number) => {
          setProgress(value)
          const elapsedSeconds =
            startedAtRef.current !== null ? (performance.now() - startedAtRef.current) / 1000 : null
          if (duration && elapsedSeconds && value > 0) {
            const factor = duration / (elapsedSeconds / value)
            realtimeFactorRef.current = factor
            setRealtimeFactor(factor)
          }
        }

        await conversion.execute()

        const buffer = output.target.buffer
        if (!buffer) {
          throw new Error('No se pudo obtener el buffer comprimido.')
        }

        const blob = new Blob([buffer], { type: output.format.mimeType })
        const compressedFile = new File([blob], getCompressedFileName(file.name), {
          type: output.format.mimeType,
        })

        const metadataPayload: VideoCompressionMetadata = {
          originalName: file.name,
          originalSize: file.size,
          compressedSize: buffer.byteLength,
          compressionPercent: Number(((buffer.byteLength / file.size) * 100).toFixed(2)),
          durationSeconds: duration ?? undefined,
          mimeType: output.format.mimeType ?? 'video/mp4',
          approxRealtimeFactor: realtimeFactorRef.current ?? undefined,
          startedAt,
          finishedAt: Date.now(),
        }

        const payload: VideoCompressionPayload = {
          file: compressedFile,
          originalFile: file,
          blob,
          buffer,
          metadata: metadataPayload,
        }

        setMetadata(metadataPayload)
        setResult(payload)
        setStatus('success')
        return payload
      } catch (conversionError) {
        setStatus('error')
        const message =
          conversionError instanceof Error
            ? conversionError.message
            : 'Ocurrió un error al comprimir el video.'
        setError(message)
        throw conversionError
      } finally {
        await cleanupConversion()
      }
    },
    [cleanupConversion, options],
  )

  const cancel = useCallback(async () => {
    await cleanupConversion()
    setStatus('cancelled')
    setProgress(0)
  }, [cleanupConversion])

  useEffect(() => {
    return () => {
      void cleanupConversion()
    }
  }, [cleanupConversion])

  return {
    compress,
    cancel,
    reset,
    status,
    progress,
    error,
    metadata,
    result,
    realtimeFactor,
  }
}


