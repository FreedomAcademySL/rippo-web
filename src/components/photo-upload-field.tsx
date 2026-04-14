'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { POSE_CONFIG } from '@/lib/pose-config'
import { compressPhoto } from '@/lib/photo-compression'
import { Camera, X } from 'lucide-react'

interface PhotoUploadFieldProps {
  storedFiles: (File | null)[]
  onFileChange: (index: number, file: File | null) => void
  helperText?: string
}

export function PhotoUploadField({
  storedFiles,
  onFileChange,
  helperText,
}: PhotoUploadFieldProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array.from({ length: 6 }, () => null),
  )

  // Managed Object URLs — revoke previous URL immediately when file changes
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>(
    Array.from({ length: 6 }, () => null),
  )
  const prevUrlsRef = useRef<(string | null)[]>(
    Array.from({ length: 6 }, () => null),
  )

  useEffect(() => {
    const newUrls = storedFiles.map((file, i) => {
      // Revoke previous URL for this slot immediately on change
      if (prevUrlsRef.current[i]) {
        URL.revokeObjectURL(prevUrlsRef.current[i]!)
      }
      return file ? URL.createObjectURL(file) : null
    })
    prevUrlsRef.current = newUrls
    setPreviewUrls(newUrls)

    return () => {
      // Revoke all URLs on unmount
      prevUrlsRef.current.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [storedFiles])

  const handleFileSelect = useCallback(
    (index: number) =>
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const compressed = await compressPhoto(file)
        // Rename to pose field name so questionnaire can map files back to slots
        const namedFile = new File(
          [compressed],
          `${POSE_CONFIG[index].fieldName}.jpg`,
          { type: compressed.type },
        )
        onFileChange(index, namedFile)
        // Reset input so re-selecting the same file triggers onChange
        e.target.value = ''
      },
    [onFileChange],
  )

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/40 p-4 md:p-6">
      {/* Reference photos modal */}
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" className="bg-primary text-white">
            Ver fotos de referencia
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fotos de referencia — 6 poses</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {POSE_CONFIG.map((pose) => (
              <div key={pose.fieldName} className="space-y-2 text-center">
                <img
                  src={pose.referenceSrc}
                  alt={pose.label}
                  className="aspect-[3/4] w-full rounded-xl object-cover"
                />
                <p className="text-sm font-medium">{pose.label}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 6 pose upload rows */}
      <div className="mx-auto max-w-md space-y-4">
        {POSE_CONFIG.map((pose, index) => (
          <div key={pose.fieldName} className="flex items-center gap-3">
          {/* Reference thumbnail */}
          <img
            src={pose.referenceSrc}
            alt={pose.label}
            className="h-20 w-16 flex-shrink-0 rounded-lg object-cover"
          />

          {/* Upload slot */}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-slate-300">{pose.label}</p>

            {previewUrls[index] ? (
              <div className="flex items-center gap-3">
                <img
                  src={previewUrls[index]!}
                  alt={pose.label}
                  className="size-20 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-8 border-white/30"
                  onClick={() => onFileChange(index, null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed border-white/30 bg-white/5 text-sm text-white hover:bg-white/15"
                onClick={() => inputRefs.current[index]?.click()}
              >
                <Camera className="mr-2 size-4" />
                Seleccionar foto
              </Button>
            )}

            <input
              ref={(el) => {
                inputRefs.current[index] = el
              }}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect(index)}
            />
          </div>
        </div>
        ))}
        {helperText && <p className="text-xs text-slate-300">{helperText}</p>}
      </div>
    </div>
  )
}
