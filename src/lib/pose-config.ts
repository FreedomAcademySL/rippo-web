export interface PoseConfig {
  readonly fieldName: string
  readonly label: string
  readonly referenceSrc: string
}

export const POSE_CONFIG: readonly PoseConfig[] = [
  { fieldName: 'frente',        label: 'Frente',            referenceSrc: '/fotos-referencia/frente.jpg' },
  { fieldName: 'espalda',       label: 'Espalda',           referenceSrc: '/fotos-referencia/espalda.jpg' },
  { fieldName: 'perfil_izq',    label: 'Perfil Izquierdo',  referenceSrc: '/fotos-referencia/perfil_izq.jpg' },
  { fieldName: 'perfil_der',    label: 'Perfil Derecho',    referenceSrc: '/fotos-referencia/perfil_der.jpg' },
  { fieldName: 'bicep_frente',  label: 'Bicep Frente',      referenceSrc: '/fotos-referencia/bicep_frente.jpg' },
  { fieldName: 'bicep_espalda', label: 'Bicep Espalda',     referenceSrc: '/fotos-referencia/bicep_espalda.jpg' },
] as const

export const POSE_FIELD_NAMES = POSE_CONFIG.map((p) => p.fieldName)
export const REQUIRED_PHOTO_COUNT = POSE_CONFIG.length
