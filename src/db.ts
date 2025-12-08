import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './db/schema'

// Create the neon SQL client
const sql = neon(process.env.DATABASE_URL || process.env.VITE_DATABASE_URL || '')

// Export the drizzle database instance
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export * from './db/schema'
