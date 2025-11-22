import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(decimals)} ${units[index]}`
}

export function formatSeconds(totalSeconds?: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds === undefined) {
    return '—'
  }

  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)}s`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}
