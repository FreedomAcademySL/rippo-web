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
  videoBitrate: 400_000,
  audioBitrate: 10_000,
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

      const readVideoMetadata = () =>
        new Promise<{ width: number | null; height: number | null; duration: number | null }>(
          resolve => {
            const url = URL.createObjectURL(file)
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.onloadedmetadata = () => {
              const width = video.videoWidth || null
              const height = video.videoHeight || null
              const duration = Number.isFinite(video.duration) ? video.duration : null
              URL.revokeObjectURL(url)
              resolve({ width, height, duration })
            }
            video.onerror = () => {
              URL.revokeObjectURL(url)
              resolve({ width: null, height: null, duration: null })
            }
            video.src = url
          },
        )

      try {
        const videoMeta = await readVideoMetadata()
        const duration = videoMeta.duration ?? (await input.computeDuration().catch(() => null))
        const originalBitrate = duration ? Math.round((file.size * 8) / duration) : null
        const isLowBitrateSource = originalBitrate !== null && originalBitrate < 1_200_000
        const isMidBitrateSource =
          originalBitrate !== null && originalBitrate >= 1_200_000 && originalBitrate < 3_000_000
        const widthScale = isLowBitrateSource ? 0.6 : isMidBitrateSource ? 0.7 : 1
        const targetWidth = videoMeta.width
          ? Math.min(
              resolvedOptions.maxWidth,
              isLowBitrateSource || isMidBitrateSource
                ? Math.max(320, Math.round(videoMeta.width * widthScale))
                : videoMeta.width,
            )
          : resolvedOptions.maxWidth
        const pixelScale =
          videoMeta.width && videoMeta.width > 0
            ? Math.min(1, Math.pow(targetWidth / videoMeta.width, 2))
            : 1
        const MIN_VIDEO_BITRATE = 180_000
        const lowBitrateThreshold = 1_200_000
        const midBitrateThreshold = 3_000_000
        const safetyFactor =
          originalBitrate !== null && originalBitrate < lowBitrateThreshold
            ? 0.25
            : originalBitrate !== null && originalBitrate < midBitrateThreshold
              ? 0.5
              : 0.8
        const scaledBitrate =
          originalBitrate !== null ? Math.round(originalBitrate * pixelScale * safetyFactor) : null
        const baseChosen =
          scaledBitrate !== null
            ? Math.min(resolvedOptions.videoBitrate, Math.max(MIN_VIDEO_BITRATE, scaledBitrate))
            : resolvedOptions.videoBitrate
        const totalCap =
          originalBitrate !== null
            ? Math.max(
                MIN_VIDEO_BITRATE,
                Math.round(originalBitrate * safetyFactor - resolvedOptions.audioBitrate),
              )
            : null
        const targetVideoBitrate =
          totalCap !== null ? Math.min(baseChosen, totalCap) : baseChosen

        const conversion = await Conversion.init({
          input,
          output,
          video: {
            width: targetWidth,
            bitrate: targetVideoBitrate,
          },
          audio: {
            bitrate: resolvedOptions.audioBitrate,
          },
        })

        conversionRef.current = conversion
        startedAtRef.current = performance.now()
        const startedAt = Date.now()

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
        // Only allow fallback for actual video files
        const isVideo =
          file.type.startsWith('video/') ||
          /\.(mp4|mov|mkv|webm|avi|m4v|wmv|flv|3gp)$/i.test(file.name)

        if (!isVideo) {
          setStatus('error')
          setError('El archivo seleccionado no es un video válido.')
          throw new Error('El archivo seleccionado no es un video válido.')
        }

        const MAX_FALLBACK_SIZE = 128 * 1024 * 1024 // 128 MB (matches backend limit)
        if (file.size > MAX_FALLBACK_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
          setStatus('error')
          setError(
            `El video pesa ${sizeMB} MB y no pudo ser comprimido. El límite es 128 MB.`,
          )
          throw new Error(
            `Uncompressed fallback rejected: file size ${sizeMB} MB exceeds 128 MB limit.`,
          )
        }

        // Fallback: use original file without compression
        const mimeType = file.type || 'video/mp4'
        const fallbackMetadata: VideoCompressionMetadata = {
          originalName: file.name,
          originalSize: file.size,
          compressedSize: file.size,
          compressionPercent: 100,
          mimeType,
          startedAt: Date.now(),
          finishedAt: Date.now(),
        }
        const fallbackPayload: VideoCompressionPayload = {
          file,
          originalFile: file,
          metadata: fallbackMetadata,
        }

        setMetadata(fallbackMetadata)
        setResult(fallbackPayload)
        setStatus('success')
        return fallbackPayload
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


