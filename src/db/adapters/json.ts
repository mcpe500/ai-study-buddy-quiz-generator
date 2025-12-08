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

// JSON file storage helper
class JsonStore<T extends { id: string }> {
  private filePath: string
  private data: T[] = []

  constructor(basePath: string, fileName: string) {
    this.filePath = path.join(basePath, `${fileName}.json`)
  }

  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8')
        this.data = JSON.parse(content, (key, value) => {
          // Restore Date objects
          if (key.endsWith('At') && value) {
            return new Date(value)
          }
          return value
        })
      }
    } catch (error) {
      console.warn(`Failed to load ${this.filePath}:`, error)
      this.data = []
    }
  }

  private save(): void {
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
  }

  findById(id: string): T | null {
    return this.data.find(item => item.id === id) || null
  }

  findAll(): T[] {
    return [...this.data]
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    return this.data.filter(predicate)
  }

  findOneWhere(predicate: (item: T) => boolean): T | null {
    return this.data.find(predicate) || null
  }

  create(item: T): T {
    this.data.push(item)
    this.save()
    return item
  }

  update(id: string, updates: Partial<T>): T | null {
    const index = this.data.findIndex(item => item.id === id)
    if (index === -1) return null
    
    this.data[index] = { ...this.data[index], ...updates }
    this.save()
    return this.data[index]
  }

  delete(id: string): boolean {
    const index = this.data.findIndex(item => item.id === id)
    if (index === -1) return false
    
    this.data.splice(index, 1)
    this.save()
    return true
  }

  deleteWhere(predicate: (item: T) => boolean): void {
    this.data = this.data.filter(item => !predicate(item))
    this.save()
  }
}

// User Repository
class JsonUserRepository implements IUserRepository {
  constructor(private store: JsonStore<User>) {}

  async findById(id: string): Promise<User | null> {
    return this.store.findById(id)
  }

  async findAll(): Promise<User[]> {
    return this.store.findAll()
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.store.findOneWhere(u => u.email.toLowerCase() === email.toLowerCase())
  }

  async create(data: NewUser): Promise<User> {
    const user: User = {
      id: data.id || generateId(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(user)
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }
}

// Session Repository
class JsonSessionRepository implements ISessionRepository {
  constructor(private store: JsonStore<Session>) {}

  async findById(id: string): Promise<Session | null> {
    return this.store.findById(id)
  }

  async findAll(): Promise<Session[]> {
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return this.store.findWhere(s => s.userId === userId)
  }

  async create(data: NewSession): Promise<Session> {
    const session: Session = {
      id: data.id || generateId(),
      userId: data.userId,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(session)
  }

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }

  async deleteByUserId(userId: string): Promise<void> {
    this.store.deleteWhere(s => s.userId === userId)
  }

  async deleteExpired(): Promise<void> {
    const now = new Date()
    this.store.deleteWhere(s => s.expiresAt < now)
  }
}

// Document Repository
class JsonDocumentRepository implements IDocumentRepository {
  constructor(private store: JsonStore<Document>) {}

  async findById(id: string): Promise<Document | null> {
    return this.store.findById(id)
  }

  async findAll(): Promise<Document[]> {
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<Document[]> {
    return this.store.findWhere(d => d.userId === userId)
  }

  async create(data: NewDocument): Promise<Document> {
    const doc: Document = {
      id: data.id || generateId(),
      userId: data.userId,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileData: data.fileData,
      status: data.status || 'pending',
      errorMessage: data.errorMessage || null,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(doc)
  }

  async update(id: string, data: Partial<Document>): Promise<Document | null> {
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }

  async updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<void> {
    this.store.update(id, { status, errorMessage: errorMessage || null })
  }
}

// Study Material Repository
class JsonStudyMaterialRepository implements IStudyMaterialRepository {
  constructor(private store: JsonStore<StudyMaterial>) {}

  async findById(id: string): Promise<StudyMaterial | null> {
    return this.store.findById(id)
  }

  async findAll(): Promise<StudyMaterial[]> {
    return this.store.findAll()
  }

  async findByDocumentId(documentId: string): Promise<StudyMaterial | null> {
    return this.store.findOneWhere(m => m.documentId === documentId)
  }

  async create(data: NewStudyMaterial): Promise<StudyMaterial> {
    const material: StudyMaterial = {
      id: data.id || generateId(),
      documentId: data.documentId,
      summary: data.summary || null,
      flashcards: data.flashcards || null,
      quiz: data.quiz || null,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(material)
  }

  async update(id: string, data: Partial<StudyMaterial>): Promise<StudyMaterial | null> {
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }
}

// Quiz Progress Repository
class JsonQuizProgressRepository implements IQuizProgressRepository {
  constructor(private store: JsonStore<QuizProgress>) {}

  async findById(id: string): Promise<QuizProgress | null> {
    return this.store.findById(id)
  }

  async findAll(): Promise<QuizProgress[]> {
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<QuizProgress[]> {
    return this.store.findWhere(p => p.userId === userId)
  }

  async findByMaterialId(materialId: string): Promise<QuizProgress[]> {
    return this.store.findWhere(p => p.studyMaterialId === materialId)
  }

  async create(data: NewQuizProgress): Promise<QuizProgress> {
    const progress: QuizProgress = {
      id: data.id || generateId(),
      userId: data.userId,
      studyMaterialId: data.studyMaterialId,
      score: data.score,
      totalQuestions: data.totalQuestions,
      completedAt: data.completedAt || new Date(),
    }
    return this.store.create(progress)
  }

  async update(id: string, data: Partial<QuizProgress>): Promise<QuizProgress | null> {
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }
}

// Main JSON Database Adapter
export class JsonDatabase implements IDatabase {
  private basePath: string
  private userStore: JsonStore<User>
  private sessionStore: JsonStore<Session>
  private documentStore: JsonStore<Document>
  private studyMaterialStore: JsonStore<StudyMaterial>
  private quizProgressStore: JsonStore<QuizProgress>

  users: IUserRepository
  sessions: ISessionRepository
  documents: IDocumentRepository
  studyMaterials: IStudyMaterialRepository
  quizProgress: IQuizProgressRepository

  constructor(basePath: string = './data') {
    this.basePath = basePath

    this.userStore = new JsonStore(basePath, 'users')
    this.sessionStore = new JsonStore(basePath, 'sessions')
    this.documentStore = new JsonStore(basePath, 'documents')
    this.studyMaterialStore = new JsonStore(basePath, 'study_materials')
    this.quizProgressStore = new JsonStore(basePath, 'quiz_progress')

    this.users = new JsonUserRepository(this.userStore)
    this.sessions = new JsonSessionRepository(this.sessionStore)
    this.documents = new JsonDocumentRepository(this.documentStore)
    this.studyMaterials = new JsonStudyMaterialRepository(this.studyMaterialStore)
    this.quizProgress = new JsonQuizProgressRepository(this.quizProgressStore)
  }

  async init(): Promise<void> {
    // Ensure data directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true })
    }

    // Load all stores
    await this.userStore.load()
    await this.sessionStore.load()
    await this.documentStore.load()
    await this.studyMaterialStore.load()
    await this.quizProgressStore.load()

    console.log('[DB] JSON adapter initialized at:', this.basePath)
  }

  async close(): Promise<void> {
    // Nothing to close for JSON adapter
  }
}
