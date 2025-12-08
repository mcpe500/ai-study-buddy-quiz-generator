import type { IDatabase } from './interfaces'
import type { DBAdapter } from '../types'

let dbInstance: IDatabase | null = null

// Get configured database adapter
export function getDbAdapter(): DBAdapter {
  const adapter = process.env.DB_ADAPTER as DBAdapter
  return adapter || 'json'
}

// Create database instance based on environment
async function createDatabase(): Promise<IDatabase> {
  const adapter = getDbAdapter()
  
  switch (adapter) {
    case 'postgres': {
      // Dynamic import to avoid loading unnecessary dependencies
      const { PostgresDatabase } = await import('../adapters/postgres')
      return new PostgresDatabase(process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '')
    }
    
    case 'sqlite': {
      const { SqliteDatabase } = await import('../adapters/sqlite')
      const dbPath = process.env.SQLITE_PATH || './data/study-buddy.db'
      return new SqliteDatabase(dbPath)
    }
    
    case 'json':
    default: {
      const { JsonDatabase } = await import('../adapters/json')
      const jsonPath = process.env.JSON_DB_PATH || './data'
      return new JsonDatabase(jsonPath)
    }
  }
}

// Get or create database singleton
export async function getDatabase(): Promise<IDatabase> {
  if (!dbInstance) {
    dbInstance = await createDatabase()
    await dbInstance.init()
  }
  return dbInstance
}

// Synchronous getter for cases where we know db is initialized
let _syncDb: IDatabase | null = null

export function setDatabase(db: IDatabase): void {
  dbInstance = db
  _syncDb = db
}

// This will be called at app startup to initialize the database
export async function initDatabase(): Promise<IDatabase> {
  const db = await getDatabase()
  _syncDb = db
  return db
}

// Get database synchronously (throws if not initialized)
export function db(): IDatabase {
  if (!_syncDb) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return _syncDb
}
