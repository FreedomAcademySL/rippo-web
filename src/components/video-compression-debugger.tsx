'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { formatBytes, formatSeconds } from '@/utils'
import { useVideoCompressor } from '@/hooks/use-video-compressor'

const STATUS_COPY: Record<string, string> = {
  idle: 'Esperando archivo',
  preparing: 'Analizando archivo',
  compressing: 'Comprimiendo',
  success: 'Listo',
  error: 'Error',
  cancelled: 'Cancelado',
}

export function VideoCompressionDebugger() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  const { compress, cancel, reset, status, progress, metadata, result, error, realtimeFactor } =
    useVideoCompressor({
      maxWidth: 720,
    })

  const displayedMetadata = useMemo(() => metadata ?? result?.metadata ?? null, [metadata, result])

  useEffect(() => {
    if (!result?.file) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(result.file)
    setPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [result])

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) {
        return
      }
      setSelectedName(file.name)

      try {
        await compress(file)
      } catch {
        // el hook ya maneja el estado de error
      } finally {
        event.target.value = ''
      }
    },
    [compress],
  )

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleReset = useCallback(() => {
    reset()
    setSelectedName(null)
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [reset])

  const isProcessing = status === 'preparing' || status === 'compressing'

  return (
    <Card className="border-white/10 bg-slate-900/40 text-white">
      <CardHeader>
        <CardTitle>Debugger de compresión</CardTitle>
        <CardDescription className="text-slate-300">
          Probá Mediabunny con tus propios videos y mirá los metadatos resultantes antes de
          integrarlo en flujo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={handleInputChange}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={openFileDialog}
            disabled={isProcessing}
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Seleccionar video de prueba
          </Button>
          {isProcessing ? (
            <Button type="button" variant="outline" onClick={() => cancel()} className="text-white">
              Cancelar
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={handleReset} className="text-white">
              Limpiar
            </Button>
          )}
        </div>
        {selectedName && (
          <p className="text-sm text-slate-300">
            Archivo elegido:{' '}
            <span className="font-semibold text-white">{selectedName}</span>
          </p>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
          <div className="flex items-center justify-between text-white">
            <span>Estado</span>
            <span className="font-semibold">
              {STATUS_COPY[status] ?? status}
              {isProcessing && '...'}
            </span>
          </div>
          {(status === 'preparing' || status === 'compressing') && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Spinner className="text-red-400" />
                <span>Avance {Math.round(progress * 100)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" />
            </div>
          )}
          {realtimeFactor && (
            <p className="mt-3 text-xs text-slate-400">
              Velocidad aproximada: {realtimeFactor.toFixed(2)}x tiempo real
            </p>
          )}
        </div>

        {displayedMetadata && (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Peso original</span>
              <span>{formatBytes(displayedMetadata.originalSize)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Peso comprimido</span>
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
            {displayedMetadata.mimeType && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Formato</span>
                <span>{displayedMetadata.mimeType}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <p className="text-sm text-slate-300">Vista previa</p>
            <video
              src={previewUrl}
              controls
              className="aspect-video w-full rounded-2xl border border-white/10"
            />
          </div>
        )}
      </CardContent>
      {result?.file && previewUrl && (
        <CardFooter className="flex flex-wrap gap-3">
          <a
            href={previewUrl}
            download={result.file.name}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
          >
            Descargar MP4 comprimido
          </a>
          <p className="text-xs text-slate-400">
            Peso final: {formatBytes(result.file.size)} ({result.file.name})
          </p>
        </CardFooter>
      )}
    </Card>
  )
}


