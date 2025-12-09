import type {
  User, NewUser,
  Session, NewSession,
  Document, NewDocument,
  StudyMaterial, NewStudyMaterial,
  QuizProgress, NewQuizProgress,
  DocumentStatus,
} from '../types'

// Base repository interface
export interface BaseRepository<T, CreateT> {
  findById(id: string): Promise<T | null>
  findAll(): Promise<T[]>
  create(data: CreateT): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}

// User Repository
export interface IUserRepository extends BaseRepository<User, NewUser> {
  findByEmail(email: string): Promise<User | null>
}

// Session Repository
export interface ISessionRepository extends BaseRepository<Session, NewSession> {
  findByUserId(userId: string): Promise<Session[]>
  deleteByUserId(userId: string): Promise<void>
  deleteExpired(): Promise<void>
}

// Document Repository
export interface IDocumentRepository extends BaseRepository<Document, NewDocument> {
  findByUserId(userId: string): Promise<Document[]>
  updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<void>
}

// Study Material Repository
export interface IStudyMaterialRepository extends BaseRepository<StudyMaterial, NewStudyMaterial> {
  findByDocumentId(documentId: string): Promise<StudyMaterial | null>
}

// Quiz Progress Repository
export interface IQuizProgressRepository extends BaseRepository<QuizProgress, NewQuizProgress> {
  findByUserId(userId: string): Promise<QuizProgress[]>
  findByMaterialId(materialId: string): Promise<QuizProgress[]>
}

// Combined database interface
export interface IDatabase {
  users: IUserRepository
  sessions: ISessionRepository
  documents: IDocumentRepository
  studyMaterials: IStudyMaterialRepository
  quizProgress: IQuizProgressRepository
  
  // Lifecycle methods
  init(): Promise<void>
  close(): Promise<void>
}
