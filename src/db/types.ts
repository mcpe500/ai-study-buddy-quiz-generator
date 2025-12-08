// Shared types for all database adapters
// These are adapter-agnostic, no Drizzle dependencies

export interface User {
  id: string
  email: string
  passwordHash: string
  createdAt: Date | null
}

export interface NewUser {
  id?: string
  email: string
  passwordHash: string
  createdAt?: Date
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  createdAt: Date | null
}

export interface NewSession {
  id?: string
  userId: string
  expiresAt: Date
  createdAt?: Date
}

export interface Document {
  id: string
  userId: string
  fileName: string
  mimeType: string
  fileData: string
  status: string
  errorMessage: string | null
  createdAt: Date | null
}

export interface NewDocument {
  id?: string
  userId: string
  fileName: string
  mimeType: string
  fileData: string
  status?: string
  errorMessage?: string | null
  createdAt?: Date
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

export interface StudyMaterial {
  id: string
  documentId: string
  summary: string | null
  flashcards: Flashcard[] | null
  quiz: QuizQuestion[] | null
  createdAt: Date | null
}

export interface NewStudyMaterial {
  id?: string
  documentId: string
  summary?: string | null
  flashcards?: Flashcard[] | null
  quiz?: QuizQuestion[] | null
  createdAt?: Date
}

export interface QuizProgress {
  id: string
  userId: string
  studyMaterialId: string
  score: number
  totalQuestions: number
  completedAt: Date | null
}

export interface NewQuizProgress {
  id?: string
  userId: string
  studyMaterialId: string
  score: number
  totalQuestions: number
  completedAt?: Date
}

// Document status type
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Database adapter type
export type DBAdapter = 'postgres' | 'sqlite' | 'json'
