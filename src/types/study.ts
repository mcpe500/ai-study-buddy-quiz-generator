export enum ContentType {
  SUMMARY = 'SUMMARY',
  FLASHCARDS = 'FLASHCARDS',
  QUIZ = 'QUIZ'
}

export interface Flashcard {
  front: string
  back: string
}

export interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation: string
}

export interface GeneratedStudyMaterial {
  summary: string
  flashcards: Flashcard[]
  quiz: QuizQuestion[]
}

export interface StudySessionState {
  hasUploaded: boolean
  isLoading: boolean
  error: string | null
  material: GeneratedStudyMaterial | null
  fileName: string
}

// Document status
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'

// AI Provider types
export type AIProvider = 'groq' | 'cerebras' | 'openrouter'

export interface AIConfig {
  provider: AIProvider
  model: string
  apiKey: string
}
