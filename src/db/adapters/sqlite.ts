import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import type {
  User, NewUser,
  Session, NewSession,
  Document, NewDocument,
  StudyMaterial, NewStudyMaterial,
  QuizProgress, NewQuizProgress,
  DocumentStatus,
} from '../types'
import type {
  IDatabase,
  IUserRepository,
  ISessionRepository,
  IDocumentRepository,
  IStudyMaterialRepository,
  IQuizProgressRepository,
} from '../repositories/interfaces'

// Generate UUID
function generateId(): string {
  return crypto.randomUUID()
}

// User Repository
class SqliteUserRepository implements IUserRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<User[]> {
    const rows = this.db.prepare('SELECT * FROM users').all() as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as any
    return row ? this.mapRow(row) : null
  }

  async create(data: NewUser): Promise<User> {
    const id = data.id || generateId()
    const createdAt = (data.createdAt || new Date()).toISOString()
    
    this.db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, data.email.toLowerCase().trim(), data.passwordHash, createdAt)
    
    return (await this.findById(id))!
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email) }
    if (data.passwordHash !== undefined) { updates.push('password_hash = ?'); values.push(data.passwordHash) }
    
    if (updates.length === 0) return this.findById(id)
    
    values.push(id)
    this.db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id)
    return result.changes > 0
  }

  private mapRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at ? new Date(row.created_at) : null,
    }
  }
}

// Session Repository
class SqliteSessionRepository implements ISessionRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<Session | null> {
    const row = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<Session[]> {
    const rows = this.db.prepare('SELECT * FROM sessions').all() as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const rows = this.db.prepare('SELECT * FROM sessions WHERE user_id = ?').all(userId) as any[]
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewSession): Promise<Session> {
    const id = data.id || generateId()
    const createdAt = (data.createdAt || new Date()).toISOString()
    const expiresAt = data.expiresAt.toISOString()
    
    this.db.prepare(`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(id, data.userId, expiresAt, createdAt)
    
    return (await this.findById(id))!
  }

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.expiresAt !== undefined) { updates.push('expires_at = ?'); values.push(data.expiresAt.toISOString()) }
    
    if (updates.length === 0) return this.findById(id)
    
    values.push(id)
    this.db.prepare(`UPDATE sessions SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
    return result.changes > 0
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId)
  }

  async deleteExpired(): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(new Date().toISOString())
  }

  private mapRow(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      expiresAt: new Date(row.expires_at),
      createdAt: row.created_at ? new Date(row.created_at) : null,
    }
  }
}

// Document Repository
class SqliteDocumentRepository implements IDocumentRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<Document | null> {
    const row = this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<Document[]> {
    const rows = this.db.prepare('SELECT * FROM documents').all() as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<Document[]> {
    const rows = this.db.prepare('SELECT * FROM documents WHERE user_id = ?').all(userId) as any[]
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewDocument): Promise<Document> {
    const id = data.id || generateId()
    const createdAt = (data.createdAt || new Date()).toISOString()
    
    this.db.prepare(`
      INSERT INTO documents (id, user_id, file_name, mime_type, file_data, status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.userId, data.fileName, data.mimeType, data.fileData, data.status || 'pending', data.errorMessage || null, createdAt)
    
    return (await this.findById(id))!
  }

  async update(id: string, data: Partial<Document>): Promise<Document | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status) }
    if (data.errorMessage !== undefined) { updates.push('error_message = ?'); values.push(data.errorMessage) }
    
    if (updates.length === 0) return this.findById(id)
    
    values.push(id)
    this.db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM documents WHERE id = ?').run(id)
    return result.changes > 0
  }

  async updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<void> {
    this.db.prepare('UPDATE documents SET status = ?, error_message = ? WHERE id = ?')
      .run(status, errorMessage || null, id)
  }

  private mapRow(row: any): Document {
    return {
      id: row.id,
      userId: row.user_id,
      fileName: row.file_name,
      mimeType: row.mime_type,
      fileData: row.file_data,
      status: row.status,
      errorMessage: row.error_message,
      createdAt: row.created_at ? new Date(row.created_at) : null,
    }
  }
}

// Study Material Repository
class SqliteStudyMaterialRepository implements IStudyMaterialRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<StudyMaterial | null> {
    const row = this.db.prepare('SELECT * FROM study_materials WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<StudyMaterial[]> {
    const rows = this.db.prepare('SELECT * FROM study_materials').all() as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByDocumentId(documentId: string): Promise<StudyMaterial | null> {
    const row = this.db.prepare('SELECT * FROM study_materials WHERE document_id = ?').get(documentId) as any
    return row ? this.mapRow(row) : null
  }

  async create(data: NewStudyMaterial): Promise<StudyMaterial> {
    const id = data.id || generateId()
    const createdAt = (data.createdAt || new Date()).toISOString()
    
    this.db.prepare(`
      INSERT INTO study_materials (id, document_id, summary, flashcards, quiz, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      data.documentId, 
      data.summary || null, 
      data.flashcards ? JSON.stringify(data.flashcards) : null,
      data.quiz ? JSON.stringify(data.quiz) : null,
      createdAt
    )
    
    return (await this.findById(id))!
  }

  async update(id: string, data: Partial<StudyMaterial>): Promise<StudyMaterial | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.summary !== undefined) { updates.push('summary = ?'); values.push(data.summary) }
    if (data.flashcards !== undefined) { updates.push('flashcards = ?'); values.push(JSON.stringify(data.flashcards)) }
    if (data.quiz !== undefined) { updates.push('quiz = ?'); values.push(JSON.stringify(data.quiz)) }
    
    if (updates.length === 0) return this.findById(id)
    
    values.push(id)
    this.db.prepare(`UPDATE study_materials SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM study_materials WHERE id = ?').run(id)
    return result.changes > 0
  }

  private mapRow(row: any): StudyMaterial {
    return {
      id: row.id,
      documentId: row.document_id,
      summary: row.summary,
      flashcards: row.flashcards ? JSON.parse(row.flashcards) : null,
      quiz: row.quiz ? JSON.parse(row.quiz) : null,
      createdAt: row.created_at ? new Date(row.created_at) : null,
    }
  }
}

// Quiz Progress Repository
class SqliteQuizProgressRepository implements IQuizProgressRepository {
  constructor(private db: Database.Database) {}

  async findById(id: string): Promise<QuizProgress | null> {
    const row = this.db.prepare('SELECT * FROM quiz_progress WHERE id = ?').get(id) as any
    return row ? this.mapRow(row) : null
  }

  async findAll(): Promise<QuizProgress[]> {
    const rows = this.db.prepare('SELECT * FROM quiz_progress').all() as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByUserId(userId: string): Promise<QuizProgress[]> {
    const rows = this.db.prepare('SELECT * FROM quiz_progress WHERE user_id = ?').all(userId) as any[]
    return rows.map(row => this.mapRow(row))
  }

  async findByMaterialId(materialId: string): Promise<QuizProgress[]> {
    const rows = this.db.prepare('SELECT * FROM quiz_progress WHERE study_material_id = ?').all(materialId) as any[]
    return rows.map(row => this.mapRow(row))
  }

  async create(data: NewQuizProgress): Promise<QuizProgress> {
    const id = data.id || generateId()
    const completedAt = (data.completedAt || new Date()).toISOString()
    
    this.db.prepare(`
      INSERT INTO quiz_progress (id, user_id, study_material_id, score, total_questions, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.userId, data.studyMaterialId, data.score, data.totalQuestions, completedAt)
    
    return (await this.findById(id))!
  }

  async update(id: string, data: Partial<QuizProgress>): Promise<QuizProgress | null> {
    const updates: string[] = []
    const values: any[] = []
    
    if (data.score !== undefined) { updates.push('score = ?'); values.push(data.score) }
    if (data.totalQuestions !== undefined) { updates.push('total_questions = ?'); values.push(data.totalQuestions) }
    
    if (updates.length === 0) return this.findById(id)
    
    values.push(id)
    this.db.prepare(`UPDATE quiz_progress SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM quiz_progress WHERE id = ?').run(id)
    return result.changes > 0
  }

  private mapRow(row: any): QuizProgress {
    return {
      id: row.id,
      userId: row.user_id,
      studyMaterialId: row.study_material_id,
      score: row.score,
      totalQuestions: row.total_questions,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
    }
  }
}

// Main SQLite Database Adapter
export class SqliteDatabase implements IDatabase {
  private db: Database.Database

  users: IUserRepository
  sessions: ISessionRepository
  documents: IDocumentRepository
  studyMaterials: IStudyMaterialRepository
  quizProgress: IQuizProgressRepository

  constructor(dbPath: string = './data/study-buddy.db') {
    // Ensure directory exists
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    this.db = new Database(dbPath)
    
    this.users = new SqliteUserRepository(this.db)
    this.sessions = new SqliteSessionRepository(this.db)
    this.documents = new SqliteDocumentRepository(this.db)
    this.studyMaterials = new SqliteStudyMaterialRepository(this.db)
    this.quizProgress = new SqliteQuizProgressRepository(this.db)
  }

  async init(): Promise<void> {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_data TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS study_materials (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        summary TEXT,
        flashcards TEXT,
        quiz TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS quiz_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        study_material_id TEXT NOT NULL REFERENCES study_materials(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        completed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_study_materials_document_id ON study_materials(document_id);
      CREATE INDEX IF NOT EXISTS idx_quiz_progress_user_id ON quiz_progress(user_id);
    `)

    console.log('[DB] SQLite adapter initialized')
  }

  async close(): Promise<void> {
    this.db.close()
  }
}
