import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import * as schema from '../schema'
import type {
  User, NewUser,
  Session, NewSession,
  Document, NewDocument,
  StudyMaterial, NewStudyMaterial,
  QuizProgress, NewQuizProgress,
  DocumentStatus,
  Flashcard, QuizQuestion,
} from '../types'
import type {
  IDatabase,
  IUserRepository,
  ISessionRepository,
  IDocumentRepository,
  IStudyMaterialRepository,
  IQuizProgressRepository,
} from '../repositories/interfaces'

type DrizzleDB = NeonHttpDatabase<typeof schema>

// User Repository
class PgUserRepository implements IUserRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(schema.users).where(eq(schema.users.id, id))
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(schema.users)
    return rows.map(row => this.mapRow(row))
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim()))
    return row ? this.mapRow(row) : null
  }

  async create(data: NewUser): Promise<User> {
    const [row] = await this.db.insert(schema.users).values({
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
    }).returning()
    return this.mapRow(row)
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData: any = {}
    if (data.email !== undefined) updateData.email = data.email
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash
    
    if (Object.keys(updateData).length === 0) return this.findById(id)
    
    const [row] = await this.db.update(schema.users).set(updateData).where(eq(schema.users.id, id)).returning()
    return row ? this.mapRow(row) : null
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.users).where(eq(schema.users.id, id))
    return true
  }

  private mapRow(row: typeof schema.users.$inferSelect): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
    }
  }
}

// Session Repository
class PgSessionRepository implements ISessionRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<Session | null> {
    const [row] = await this.db.select().from(schema.sessions).where(eq(schema.sessions.id, id))
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<Session[]> {
    const rows = await this.db.select().from(schema.sessions)
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const rows = await this.db.select().from(schema.sessions).where(eq(schema.sessions.userId, userId))
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewSession): Promise<Session> {
    const [row] = await this.db.insert(schema.sessions).values({
      userId: data.userId,
      expiresAt: data.expiresAt,
    }).returning()
    return this.mapRow(row)
  }

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    const updateData: any = {}
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt
    
    if (Object.keys(updateData).length === 0) return this.findById(id)
    
    const [row] = await this.db.update(schema.sessions).set(updateData).where(eq(schema.sessions.id, id)).returning()
    return row ? this.mapRow(row) : null
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.sessions).where(eq(schema.sessions.id, id))
    return true
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db.delete(schema.sessions).where(eq(schema.sessions.userId, userId))
  }

  async deleteExpired(): Promise<void> {
    // Note: This would need a lt() comparison, simplified for now
    const all = await this.findAll()
    const now = new Date()
    for (const session of all) {
      if (session.expiresAt < now) {
        await this.delete(session.id)
      }
    }
  }

  private mapRow(row: typeof schema.sessions.$inferSelect): Session {
    return {
      id: row.id,
      userId: row.userId,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    }
  }
}

// Document Repository
class PgDocumentRepository implements IDocumentRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<Document | null> {
    const [row] = await this.db.select().from(schema.documents).where(eq(schema.documents.id, id))
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<Document[]> {
    const rows = await this.db.select().from(schema.documents)
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<Document[]> {
    const rows = await this.db.select().from(schema.documents).where(eq(schema.documents.userId, userId))
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewDocument): Promise<Document> {
    const [row] = await this.db.insert(schema.documents).values({
      userId: data.userId,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileData: data.fileData,
      status: data.status || 'pending',
      errorMessage: data.errorMessage,
    }).returning()
    return this.mapRow(row)
  }

  async update(id: string, data: Partial<Document>): Promise<Document | null> {
    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.errorMessage !== undefined) updateData.errorMessage = data.errorMessage
    
    if (Object.keys(updateData).length === 0) return this.findById(id)
    
    const [row] = await this.db.update(schema.documents).set(updateData).where(eq(schema.documents.id, id)).returning()
    return row ? this.mapRow(row) : null
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.documents).where(eq(schema.documents.id, id))
    return true
  }

  async updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<void> {
    await this.db.update(schema.documents)
      .set({ status, errorMessage: errorMessage || null })
      .where(eq(schema.documents.id, id))
  }

  private mapRow(row: typeof schema.documents.$inferSelect): Document {
    return {
      id: row.id,
      userId: row.userId,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileData: row.fileData,
      status: row.status,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    }
  }
}

// Study Material Repository
class PgStudyMaterialRepository implements IStudyMaterialRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<StudyMaterial | null> {
    const [row] = await this.db.select().from(schema.studyMaterials).where(eq(schema.studyMaterials.id, id))
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<StudyMaterial[]> {
    const rows = await this.db.select().from(schema.studyMaterials)
    return rows.map(row => this.mapRow(row))
  }

  async findByDocumentId(documentId: string): Promise<StudyMaterial | null> {
    const [row] = await this.db.select().from(schema.studyMaterials).where(eq(schema.studyMaterials.documentId, documentId))
    return row ? this.mapRow(row) : null
  }

  async create(data: NewStudyMaterial): Promise<StudyMaterial> {
    const [row] = await this.db.insert(schema.studyMaterials).values({
      documentId: data.documentId,
      summary: data.summary,
      flashcards: data.flashcards,
      quiz: data.quiz,
    }).returning()
    return this.mapRow(row)
  }

  async update(id: string, data: Partial<StudyMaterial>): Promise<StudyMaterial | null> {
    const updateData: any = {}
    if (data.summary !== undefined) updateData.summary = data.summary
    if (data.flashcards !== undefined) updateData.flashcards = data.flashcards
    if (data.quiz !== undefined) updateData.quiz = data.quiz
    
    if (Object.keys(updateData).length === 0) return this.findById(id)
    
    const [row] = await this.db.update(schema.studyMaterials).set(updateData).where(eq(schema.studyMaterials.id, id)).returning()
    return row ? this.mapRow(row) : null
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.studyMaterials).where(eq(schema.studyMaterials.id, id))
    return true
  }

  private mapRow(row: typeof schema.studyMaterials.$inferSelect): StudyMaterial {
    return {
      id: row.id,
      documentId: row.documentId,
      summary: row.summary,
      flashcards: row.flashcards as Flashcard[] | null,
      quiz: row.quiz as QuizQuestion[] | null,
      createdAt: row.createdAt,
    }
  }
}

// Quiz Progress Repository
class PgQuizProgressRepository implements IQuizProgressRepository {
  constructor(private db: DrizzleDB) {}

  async findById(id: string): Promise<QuizProgress | null> {
    const [row] = await this.db.select().from(schema.quizProgress).where(eq(schema.quizProgress.id, id))
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<QuizProgress[]> {
    const rows = await this.db.select().from(schema.quizProgress)
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<QuizProgress[]> {
    const rows = await this.db.select().from(schema.quizProgress).where(eq(schema.quizProgress.userId, userId))
    return rows.map(row => this.mapRow(row))
  }

  async findByMaterialId(materialId: string): Promise<QuizProgress[]> {
    const rows = await this.db.select().from(schema.quizProgress).where(eq(schema.quizProgress.studyMaterialId, materialId))
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewQuizProgress): Promise<QuizProgress> {
    const [row] = await this.db.insert(schema.quizProgress).values({
      userId: data.userId,
      studyMaterialId: data.studyMaterialId,
      score: data.score,
      totalQuestions: data.totalQuestions,
    }).returning()
    return this.mapRow(row)
  }

  async update(id: string, data: Partial<QuizProgress>): Promise<QuizProgress | null> {
    const updateData: any = {}
    if (data.score !== undefined) updateData.score = data.score
    if (data.totalQuestions !== undefined) updateData.totalQuestions = data.totalQuestions
    
    if (Object.keys(updateData).length === 0) return this.findById(id)
    
    const [row] = await this.db.update(schema.quizProgress).set(updateData).where(eq(schema.quizProgress.id, id)).returning()
    return row ? this.mapRow(row) : null
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(schema.quizProgress).where(eq(schema.quizProgress.id, id))
    return true
  }

  private mapRow(row: typeof schema.quizProgress.$inferSelect): QuizProgress {
    return {
      id: row.id,
      userId: row.userId,
      studyMaterialId: row.studyMaterialId,
      score: row.score,
      totalQuestions: row.totalQuestions,
      completedAt: row.completedAt,
    }
  }
}

// Main PostgreSQL Database Adapter
export class PostgresDatabase implements IDatabase {
  private drizzleDb: DrizzleDB

  users: IUserRepository
  sessions: ISessionRepository
  documents: IDocumentRepository
  studyMaterials: IStudyMaterialRepository
  quizProgress: IQuizProgressRepository

  constructor(connectionString: string) {
    const sql = neon(connectionString)
    this.drizzleDb = drizzle(sql, { schema })
    
    this.users = new PgUserRepository(this.drizzleDb)
    this.sessions = new PgSessionRepository(this.drizzleDb)
    this.documents = new PgDocumentRepository(this.drizzleDb)
    this.studyMaterials = new PgStudyMaterialRepository(this.drizzleDb)
    this.quizProgress = new PgQuizProgressRepository(this.drizzleDb)
  }

  async init(): Promise<void> {
    // Tables should be created via drizzle-kit migrations
    console.log('[DB] PostgreSQL adapter initialized')
  }

  async close(): Promise<void> {
    // Neon HTTP connections don't need explicit closing
  }
}
