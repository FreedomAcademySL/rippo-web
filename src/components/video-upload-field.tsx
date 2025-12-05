'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { formatBytes, formatSeconds } from '@/utils'
import { useVideoCompressor } from '@/hooks/use-video-compressor'
import type {
  QuestionnaireQuestion,
  QuestionnaireStoredAnswer,
} from '@/types/questionnaire'
import type { VideoCompressionPayload } from '@/types/video'

interface VideoUploadFieldProps {
  question: QuestionnaireQuestion
  storedAnswer?: QuestionnaireStoredAnswer
  onCompressionComplete: (payload: VideoCompressionPayload) => void
  onRemove: () => void
  onProcessingChange?: (processing: boolean) => void
}

export function VideoUploadField({
  question,
  storedAnswer,
  onCompressionComplete,
  onRemove,
  onProcessingChange,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { compress, status, progress, error, metadata, reset, realtimeFactor } = useVideoCompressor({
    maxWidth: 720,
  })

  const isProcessing = status === 'preparing' || status === 'compressing'

  const displayedMetadata = useMemo(() => {
    return storedAnswer?.videoCompression ?? metadata ?? null
  }, [metadata, storedAnswer])

  useEffect(() => {
    onProcessingChange?.(isProcessing)

    return () => {
      onProcessingChange?.(false)
    }
  }, [isProcessing, onProcessingChange])

  useEffect(() => {
    if (!storedAnswer?.files?.[0]) {
      setPreviewUrl(null)
      return
    }

    const file = storedAnswer.files[0]
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [storedAnswer])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }

      try {
        const payload = await compress(file)
        onCompressionComplete(payload)
      } catch {
        // El hook ya gestiona los estados de error
      } finally {
        event.target.value = ''
      }
    },
    [compress, onCompressionComplete],
  )

  const handleReset = useCallback(() => {
    onRemove()
    reset()
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [onRemove, reset])

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4">
      <input
        ref={inputRef}
        id={`file-${question.id}`}
        type="file"
        accept={question.accept ?? 'video/*'}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={openFileDialog}
          disabled={isProcessing}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          {storedAnswer?.files?.length ? 'Reemplazar video' : 'Seleccionar video'}
        </Button>
        {storedAnswer?.files?.length ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isProcessing}
            className="border-white/30 text-black hover:bg-white/10"
          >
            Eliminar video
          </Button>
        ) : null}
      </div>

      {question.helperText && (
        <p className="text-xs text-slate-300">{question.helperText}</p>
      )}

      {isProcessing && (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Spinner className="text-red-400" />
            <span>
              Comprimiendo video... {Math.round(progress * 100).toString().padStart(2, '0')}%
            </span>
          </div>
          <Progress value={progress * 100} className="h-2 w-full" />
          <p className="text-xs text-slate-400">
            Este proceso puede tardar unos minutos según el peso del archivo.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {previewUrl && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Vista previa comprimida</p>
            <video
              src={previewUrl}
              controls
              className="aspect-video w-full rounded-2xl border border-white/10 bg-black/20"
              preload="metadata"
            />
          </div>

          {displayedMetadata && (
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Original</span>
                <span>{formatBytes(displayedMetadata.originalSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Comprimido</span>
                <span>{formatBytes(displayedMetadata.compressedSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tamaño final</span>
                <span>{`${displayedMetadata.compressionPercent.toFixed(2)}% del original`}</span>
              </div>
              {displayedMetadata.durationSeconds ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Duración</span>
                  <span>{formatSeconds(displayedMetadata.durationSeconds)}</span>
                </div>
              ) : null}
              {realtimeFactor ? (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Velocidad aprox.</span>
                  <span>{`${realtimeFactor.toFixed(2)}x`}</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


