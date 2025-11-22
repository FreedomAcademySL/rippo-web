export type VideoCompressionStatus =
  | 'idle'
  | 'preparing'
  | 'compressing'
  | 'success'
  | 'error'
  | 'cancelled'

export interface VideoCompressionMetadata {
  originalName: string
  originalSize: number
  compressedSize: number
  compressionPercent: number
  durationSeconds?: number
  mimeType: string
  approxRealtimeFactor?: number
  startedAt: number
  finishedAt?: number
}

export interface VideoCompressionPayload {
  file: File
  originalFile: File
  blob: Blob
  buffer: ArrayBuffer
  metadata: VideoCompressionMetadata
}


