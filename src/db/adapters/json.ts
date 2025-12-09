import * as fs from 'node:fs'
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

// Logging prefix
const LOG_PREFIX = '[JSON DB]'

// Simple path utilities (avoid Node.js path module for edge runtime compatibility)
function joinPath(basePath: string, fileName: string): string {
  // Normalize slashes and join
  const normalizedBase = basePath.replace(/\\/g, '/').replace(/\/+$/, '')
  return `${normalizedBase}/${fileName}`
}

function getDirname(filePath: string): string {
  // Get directory part of path
  const normalized = filePath.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : '.'
}

// Generate UUID
function generateId(): string {
  const id = crypto.randomUUID()
  console.log(`${LOG_PREFIX} Generated new ID: ${id}`)
  return id
}

// JSON file storage helper
class JsonStore<T extends { id: string }> {
  private filePath: string
  private data: T[] = []
  private storeName: string

  constructor(basePath: string, fileName: string) {
    this.storeName = fileName
    this.filePath = joinPath(basePath, `${fileName}.json`)
    console.log(`${LOG_PREFIX} [${this.storeName}] Store created, file path: ${this.filePath}`)
  }

  async load(): Promise<void> {
    console.log(`${LOG_PREFIX} [${this.storeName}] Loading data from file...`)
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
        console.log(`${LOG_PREFIX} [${this.storeName}] Loaded ${this.data.length} records`)
      } else {
        console.log(`${LOG_PREFIX} [${this.storeName}] File does not exist, starting with empty data`)
        this.data = []
      }
    } catch (error) {
      console.warn(`${LOG_PREFIX} [${this.storeName}] Failed to load:`, error)
      this.data = []
    }
  }

  private save(): void {
    console.log(`${LOG_PREFIX} [${this.storeName}] Saving ${this.data.length} records to file...`)
    const dir = getDirname(this.filePath)
    if (!fs.existsSync(dir)) {
      console.log(`${LOG_PREFIX} [${this.storeName}] Creating directory: ${dir}`)
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
    console.log(`${LOG_PREFIX} [${this.storeName}] Save complete`)
  }

  findById(id: string): T | null {
    console.log(`${LOG_PREFIX} [${this.storeName}] findById: ${id}`)
    const result = this.data.find(item => item.id === id) || null
    console.log(`${LOG_PREFIX} [${this.storeName}] findById result: ${result ? 'found' : 'not found'}`)
    return result
  }

  findAll(): T[] {
    console.log(`${LOG_PREFIX} [${this.storeName}] findAll: returning ${this.data.length} records`)
    return [...this.data]
  }

  findWhere(predicate: (item: T) => boolean): T[] {
    const results = this.data.filter(predicate)
    console.log(`${LOG_PREFIX} [${this.storeName}] findWhere: found ${results.length} matching records`)
    return results
  }

  findOneWhere(predicate: (item: T) => boolean): T | null {
    const result = this.data.find(predicate) || null
    console.log(`${LOG_PREFIX} [${this.storeName}] findOneWhere: ${result ? 'found' : 'not found'}`)
    return result
  }

  create(item: T): T {
    console.log(`${LOG_PREFIX} [${this.storeName}] Creating new record with ID: ${item.id}`)
    this.data.push(item)
    this.save()
    console.log(`${LOG_PREFIX} [${this.storeName}] Record created successfully`)
    return item
  }

  update(id: string, updates: Partial<T>): T | null {
    console.log(`${LOG_PREFIX} [${this.storeName}] Updating record: ${id}`)
    const index = this.data.findIndex(item => item.id === id)
    if (index === -1) {
      console.log(`${LOG_PREFIX} [${this.storeName}] Record not found for update`)
      return null
    }
    
    this.data[index] = { ...this.data[index], ...updates }
    this.save()
    console.log(`${LOG_PREFIX} [${this.storeName}] Record updated successfully`)
    return this.data[index]
  }

  delete(id: string): boolean {
    console.log(`${LOG_PREFIX} [${this.storeName}] Deleting record: ${id}`)
    const index = this.data.findIndex(item => item.id === id)
    if (index === -1) {
      console.log(`${LOG_PREFIX} [${this.storeName}] Record not found for deletion`)
      return false
    }
    
    this.data.splice(index, 1)
    this.save()
    console.log(`${LOG_PREFIX} [${this.storeName}] Record deleted successfully`)
    return true
  }

  deleteWhere(predicate: (item: T) => boolean): void {
    const countBefore = this.data.length
    this.data = this.data.filter(item => !predicate(item))
    const deleted = countBefore - this.data.length
    console.log(`${LOG_PREFIX} [${this.storeName}] deleteWhere: removed ${deleted} records`)
    this.save()
  }
}

// User Repository
class JsonUserRepository implements IUserRepository {
  constructor(private store: JsonStore<User>) {
    console.log(`${LOG_PREFIX} UserRepository initialized`)
  }

  async findById(id: string): Promise<User | null> {
    console.log(`${LOG_PREFIX} [Users] findById: ${id}`)
    return this.store.findById(id)
  }

  async findAll(): Promise<User[]> {
    console.log(`${LOG_PREFIX} [Users] findAll`)
    return this.store.findAll()
  }

  async findByEmail(email: string): Promise<User | null> {
    console.log(`${LOG_PREFIX} [Users] findByEmail: ${email}`)
    return this.store.findOneWhere(u => u.email.toLowerCase() === email.toLowerCase())
  }

  async create(data: NewUser): Promise<User> {
    console.log(`${LOG_PREFIX} [Users] Creating new user with email: ${data.email}`)
    const user: User = {
      id: data.id || generateId(),
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(user)
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    console.log(`${LOG_PREFIX} [Users] Updating user: ${id}`)
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    console.log(`${LOG_PREFIX} [Users] Deleting user: ${id}`)
    return this.store.delete(id)
  }
}

// Session Repository
class JsonSessionRepository implements ISessionRepository {
  constructor(private store: JsonStore<Session>) {
    console.log(`${LOG_PREFIX} SessionRepository initialized`)
  }

  async findById(id: string): Promise<Session | null> {
    console.log(`${LOG_PREFIX} [Sessions] findById: ${id}`)
    return this.store.findById(id)
  }

  async findAll(): Promise<Session[]> {
    console.log(`${LOG_PREFIX} [Sessions] findAll`)
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<Session[]> {
    console.log(`${LOG_PREFIX} [Sessions] findByUserId: ${userId}`)
    return this.store.findWhere(s => s.userId === userId)
  }

  async create(data: NewSession): Promise<Session> {
    console.log(`${LOG_PREFIX} [Sessions] Creating new session for user: ${data.userId}`)
    const session: Session = {
      id: data.id || generateId(),
      userId: data.userId,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt || new Date(),
    }
    return this.store.create(session)
  }

  async update(id: string, data: Partial<Session>): Promise<Session | null> {
    console.log(`${LOG_PREFIX} [Sessions] Updating session: ${id}`)
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    console.log(`${LOG_PREFIX} [Sessions] Deleting session: ${id}`)
    return this.store.delete(id)
  }

  async deleteByUserId(userId: string): Promise<void> {
    console.log(`${LOG_PREFIX} [Sessions] Deleting all sessions for user: ${userId}`)
    this.store.deleteWhere(s => s.userId === userId)
  }

  async deleteExpired(): Promise<void> {
    console.log(`${LOG_PREFIX} [Sessions] Deleting expired sessions`)
    const now = new Date()
    this.store.deleteWhere(s => s.expiresAt < now)
  }
}

// Document Repository
class JsonDocumentRepository implements IDocumentRepository {
  constructor(private store: JsonStore<Document>) {
    console.log(`${LOG_PREFIX} DocumentRepository initialized`)
  }

  async findById(id: string): Promise<Document | null> {
    console.log(`${LOG_PREFIX} [Documents] findById: ${id}`)
    return this.store.findById(id)
  }

  async findAll(): Promise<Document[]> {
    console.log(`${LOG_PREFIX} [Documents] findAll`)
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<Document[]> {
    console.log(`${LOG_PREFIX} [Documents] findByUserId: ${userId}`)
    return this.store.findWhere(d => d.userId === userId)
  }

  async create(data: NewDocument): Promise<Document> {
    console.log(`${LOG_PREFIX} [Documents] Creating new document: ${data.fileName}`)
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
    console.log(`${LOG_PREFIX} [Documents] Updating document: ${id}`)
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    console.log(`${LOG_PREFIX} [Documents] Deleting document: ${id}`)
    return this.store.delete(id)
  }

  async updateStatus(id: string, status: DocumentStatus, errorMessage?: string): Promise<void> {
    console.log(`${LOG_PREFIX} [Documents] Updating status for ${id}: ${status}${errorMessage ? ` (error: ${errorMessage})` : ''}`)
    this.store.update(id, { status, errorMessage: errorMessage || null })
  }
}

// Study Material Repository
class JsonStudyMaterialRepository implements IStudyMaterialRepository {
  constructor(private store: JsonStore<StudyMaterial>) {
    console.log(`${LOG_PREFIX} StudyMaterialRepository initialized`)
  }

  async findById(id: string): Promise<StudyMaterial | null> {
    console.log(`${LOG_PREFIX} [StudyMaterials] findById: ${id}`)
    return this.store.findById(id)
  }

  async findAll(): Promise<StudyMaterial[]> {
    console.log(`${LOG_PREFIX} [StudyMaterials] findAll`)
    return this.store.findAll()
  }

  async findByDocumentId(documentId: string): Promise<StudyMaterial | null> {
    console.log(`${LOG_PREFIX} [StudyMaterials] findByDocumentId: ${documentId}`)
    return this.store.findOneWhere(m => m.documentId === documentId)
  }

  async create(data: NewStudyMaterial): Promise<StudyMaterial> {
    console.log(`${LOG_PREFIX} [StudyMaterials] Creating new study material for document: ${data.documentId}`)
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
    console.log(`${LOG_PREFIX} [StudyMaterials] Updating study material: ${id}`)
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    console.log(`${LOG_PREFIX} [StudyMaterials] Deleting study material: ${id}`)
    return this.store.delete(id)
  }
}

// Quiz Progress Repository
class JsonQuizProgressRepository implements IQuizProgressRepository {
  constructor(private store: JsonStore<QuizProgress>) {
    console.log(`${LOG_PREFIX} QuizProgressRepository initialized`)
  }

  async findById(id: string): Promise<QuizProgress | null> {
    console.log(`${LOG_PREFIX} [QuizProgress] findById: ${id}`)
    return this.store.findById(id)
  }

  async findAll(): Promise<QuizProgress[]> {
    console.log(`${LOG_PREFIX} [QuizProgress] findAll`)
    return this.store.findAll()
  }

  async findByUserId(userId: string): Promise<QuizProgress[]> {
    console.log(`${LOG_PREFIX} [QuizProgress] findByUserId: ${userId}`)
    return this.store.findWhere(p => p.userId === userId)
  }

  async findByMaterialId(materialId: string): Promise<QuizProgress[]> {
    console.log(`${LOG_PREFIX} [QuizProgress] findByMaterialId: ${materialId}`)
    return this.store.findWhere(p => p.studyMaterialId === materialId)
  }

  async create(data: NewQuizProgress): Promise<QuizProgress> {
    console.log(`${LOG_PREFIX} [QuizProgress] Creating new quiz progress for user: ${data.userId}`)
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
    console.log(`${LOG_PREFIX} [QuizProgress] Updating quiz progress: ${id}`)
    return this.store.update(id, data)
  }

  async delete(id: string): Promise<boolean> {
    console.log(`${LOG_PREFIX} [QuizProgress] Deleting quiz progress: ${id}`)
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
    console.log(`${LOG_PREFIX} ========================================`)
    console.log(`${LOG_PREFIX} Initializing JSON Database Adapter`)
    console.log(`${LOG_PREFIX} Base path: ${basePath}`)
    console.log(`${LOG_PREFIX} ========================================`)
    
    this.basePath = basePath

    console.log(`${LOG_PREFIX} Creating store instances...`)
    this.userStore = new JsonStore(basePath, 'users')
    this.sessionStore = new JsonStore(basePath, 'sessions')
    this.documentStore = new JsonStore(basePath, 'documents')
    this.studyMaterialStore = new JsonStore(basePath, 'study_materials')
    this.quizProgressStore = new JsonStore(basePath, 'quiz_progress')

    console.log(`${LOG_PREFIX} Creating repository instances...`)
    this.users = new JsonUserRepository(this.userStore)
    this.sessions = new JsonSessionRepository(this.sessionStore)
    this.documents = new JsonDocumentRepository(this.documentStore)
    this.studyMaterials = new JsonStudyMaterialRepository(this.studyMaterialStore)
    this.quizProgress = new JsonQuizProgressRepository(this.quizProgressStore)
    
    console.log(`${LOG_PREFIX} Constructor completed`)
  }

  async init(): Promise<void> {
    console.log(`${LOG_PREFIX} ========================================`)
    console.log(`${LOG_PREFIX} Running database initialization...`)
    console.log(`${LOG_PREFIX} ========================================`)
    
    // Ensure data directory exists
    if (!fs.existsSync(this.basePath)) {
      console.log(`${LOG_PREFIX} Creating data directory: ${this.basePath}`)
      fs.mkdirSync(this.basePath, { recursive: true })
    } else {
      console.log(`${LOG_PREFIX} Data directory already exists: ${this.basePath}`)
    }

    // Load all stores
    console.log(`${LOG_PREFIX} Loading all stores...`)
    await this.userStore.load()
    await this.sessionStore.load()
    await this.documentStore.load()
    await this.studyMaterialStore.load()
    await this.quizProgressStore.load()

    console.log(`${LOG_PREFIX} ========================================`)
    console.log(`${LOG_PREFIX} JSON adapter initialized successfully!`)
    console.log(`${LOG_PREFIX} Data location: ${this.basePath}`)
    console.log(`${LOG_PREFIX} ========================================`)
  }

  async close(): Promise<void> {
    console.log(`${LOG_PREFIX} Closing database connection (no-op for JSON adapter)`)
    // Nothing to close for JSON adapter
  }
}
