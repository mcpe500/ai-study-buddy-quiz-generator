import type { IDatabase } from './interfaces'
import type { DBAdapter } from '../types'

// Logging prefix
const LOG_PREFIX = '[DB Factory]'

let dbInstance: IDatabase | null = null

// Get configured database adapter
export function getDbAdapter(): DBAdapter {
  const adapter = process.env.DB_ADAPTER as DBAdapter
  const result = adapter || 'json'
  console.log(`${LOG_PREFIX} getDbAdapter() - Configured: ${adapter || 'not set'}, Using: ${result}`)
  return result
}

// Create database instance based on environment
async function createDatabase(): Promise<IDatabase> {
  const adapter = getDbAdapter()
  
  console.log(`${LOG_PREFIX} ========================================`)
  console.log(`${LOG_PREFIX} Creating database instance`)
  console.log(`${LOG_PREFIX} Adapter: ${adapter}`)
  console.log(`${LOG_PREFIX} ========================================`)
  
  switch (adapter) {
    case 'postgres': {
      console.log(`${LOG_PREFIX} Loading PostgresDatabase adapter...`)
      // Dynamic import to avoid loading unnecessary dependencies
      const { PostgresDatabase } = await import('../adapters/postgres')
      const connectionUrl = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || ''
      console.log(`${LOG_PREFIX} PostgresDatabase connection URL: ${connectionUrl ? '[SET]' : '[NOT SET]'}`)
      return new PostgresDatabase(connectionUrl)
    }
    
    case 'sqlite': {
      console.log(`${LOG_PREFIX} Loading SqliteDatabase adapter...`)
      const { SqliteDatabase } = await import('../adapters/sqlite')
      const dbPath = process.env.SQLITE_PATH || './data/study-buddy.db'
      console.log(`${LOG_PREFIX} SqliteDatabase path: ${dbPath}`)
      return new SqliteDatabase(dbPath)
    }
    
    case 'json':
    default: {
      console.log(`${LOG_PREFIX} Loading JsonDatabase adapter...`)
      const { JsonDatabase } = await import('../adapters/json')
      const jsonPath = process.env.JSON_DB_PATH || './data'
      console.log(`${LOG_PREFIX} JsonDatabase path: ${jsonPath}`)
      return new JsonDatabase(jsonPath)
    }
  }
}

// Get or create database singleton
export async function getDatabase(): Promise<IDatabase> {
  console.log(`${LOG_PREFIX} getDatabase() called`)
  
  if (!dbInstance) {
    console.log(`${LOG_PREFIX} No existing instance, creating new database...`)
    dbInstance = await createDatabase()
    console.log(`${LOG_PREFIX} Initializing database...`)
    await dbInstance.init()
    console.log(`${LOG_PREFIX} Database initialized successfully`)
  } else {
    console.log(`${LOG_PREFIX} Returning existing database instance`)
  }
  
  return dbInstance
}

// Synchronous getter for cases where we know db is initialized
let _syncDb: IDatabase | null = null

export function setDatabase(db: IDatabase): void {
  console.log(`${LOG_PREFIX} setDatabase() - Setting database instance`)
  dbInstance = db
  _syncDb = db
}

// This will be called at app startup to initialize the database
export async function initDatabase(): Promise<IDatabase> {
  console.log(`${LOG_PREFIX} ========================================`)
  console.log(`${LOG_PREFIX} initDatabase() - Application startup`)
  console.log(`${LOG_PREFIX} ========================================`)
  
  try {
    const db = await getDatabase()
    _syncDb = db
    console.log(`${LOG_PREFIX} Database ready for use`)
    return db
  } catch (error) {
    console.error(`${LOG_PREFIX} ========================================`)
    console.error(`${LOG_PREFIX} FATAL: Database initialization failed!`)
    console.error(`${LOG_PREFIX} Error:`, error)
    console.error(`${LOG_PREFIX} ========================================`)
    throw error
  }
}

// Get database synchronously (throws if not initialized)
export function db(): IDatabase {
  if (!_syncDb) {
    console.error(`${LOG_PREFIX} ERROR: db() called before initialization!`)
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return _syncDb
}
