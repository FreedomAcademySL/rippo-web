export enum Sexo {
  MALE = 'hombre',
  FEMALE = 'mujer',
}

export enum UserRecordVideo {
  WHATSAPP = 'whatsapp',
  FORM = 'form',
  NO = 'no',
}

export enum Condition {
  CHOLESTEROL_OR_TRIGLYCERIDES = 'colesterolOTrigliceridos',
  GASTRITIS_OR_HEARTBURN = 'gastritisOAcidez',
  CONSTIPATION_OR_DIARRHEA = 'estrenimientoODiarrea',
  IRRITABLE_BOWEL_SYNDROME = 'colonIrritable',
}

export enum RequireTreatmentConditions {
  DIABETES_TYPE_1_OR_2 = 'diabetesTipo1o2',
  HYPOTHYROIDISM = 'hipotiroidismo',
  HYPERTHYROIDISM = 'hipertiroidismo',
  HYPERTENSION = 'hipertension',
  HYPOTENSION = 'hipotension',
  GALLSTONES = 'calculosVesiculares',
  ANEMIA = 'anemia',
  INFECTION = 'infeccion',
  NONE = 'ninguna',
}

export enum SleepProblem {
  WAKE_UP_TO_PEE = 'despertarParaOrinar',
  WAKE_UP_NO_REASON = 'despertarSinRazon',
  DIFFICULTY_FALLING_ASLEEP = 'dificultadParaDormir',
  WAKE_UP_MULTIPLE_TIMES = 'despertarMultiplesVeces',
  SNORING = 'ronquidos',
}

export enum WakeUpDelay {
  INSTANTLY = 'instantaneamente',
  FIVE_MINUTES = 'cincoMinutos',
  TEN_MINUTES = 'diezMinutos',
  MORE_THAN_TEN_MINUTES = 'masDeDiezMinutos',
}

export enum TrainingLocation {
  GYM = 'gimnasio',
  HOME_NO_EQUIPMENT = 'casaSinEquipamiento',
  HOME_FREE_WEIGHTS = 'casaConPesosLibres',
  HOME_MULTI_GYM = 'casaConMultigym',
}

export enum Addiction {
  WEED = 'marihuana',
  CIGARETTES = 'cigarrillos',
  ALCOHOL = 'alcohol',
  GAMBLING = 'juego',
  VIDEOGAMES = 'videojuegos',
  RRSS = 'redesSociales',
}

export enum AddictionFrequency  {
  HOUR = 'hora',
  DAY = 'dia',
  WEEK = 'semana',
  MONTH = 'mes',
}

export enum SupplementUnit {
  MG = 'mg',
  G = 'g',
  ML = 'ml',
}

export enum SupplementHowOften {
  HOUR = 'hora',
  DAY = 'dia',
  WEEK = 'semana',
  MONTH = 'mes',
}

export interface PhoneDto {
  countryCode: string
  number: string
  fullNumber?: string
}

export interface FormCuerpoFitDto {
  email: string
  name: string
  lastName: string
  sex: Sexo
  dob: Date
  height: number
  weight: number
  work: string
  goal: string
  whyGoal: string
  weighingScale: boolean
  foodScale: boolean
  cookingSpray: boolean
  stepCountingApp: boolean
  eatsJunkFoodMoreThan4PerWeek: boolean
  drinkEnoughWaterPerDay: boolean
  addiction: Addiction | string | null
  addictionAmount: number | null
  addictionFrequency: AddictionFrequency | null
  requireTreatmentCondition: RequireTreatmentConditions[] | string[] | null
  condition: Condition | string | null
  sleepProblem: SleepProblem[] | string[] | null
  getUpTime: WakeUpDelay | string | null
  screenBeforeSleep: boolean
  workoutConsistency: number
  placeToWorkOut: TrainingLocation
  supplement: string | null
  supplementUnit: SupplementUnit | null
  supplementHowMany: number | null
  supplementHowOften: SupplementHowOften | null
  userRecordVideo: UserRecordVideo
  country: string
  city: string
  howDidUserEndUpHere: string
  instagramUser: string | null
  phone: PhoneDto
  lastComment?: string
}



