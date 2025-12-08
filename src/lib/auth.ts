import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, sessions, type User, type Session } from '@/db/schema'

// Simple hash function using Web Crypto API (works in both Node and browser)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Generate a random session ID
function generateSessionId(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export async function createUser(email: string, password: string): Promise<User> {
  const passwordHash = await hashPassword(password)
  
  const [user] = await db.insert(users).values({
    email: email.toLowerCase().trim(),
    passwordHash,
  }).returning()
  
  return user
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()))
  return user
}

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email)
  if (!user) return null
  
  const isValid = await verifyPassword(password, user.passwordHash)
  return isValid ? user : null
}

export async function createSession(userId: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  
  const [session] = await db.insert(sessions).values({
    userId,
    expiresAt,
  }).returning()
  
  return session
}

export async function getSessionById(sessionId: string): Promise<Session | undefined> {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId))
  
  if (!session) return undefined
  
  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await deleteSession(sessionId)
    return undefined
  }
  
  return session
}

export async function getUserBySessionId(sessionId: string): Promise<User | undefined> {
  const session = await getSessionById(sessionId)
  if (!session) return undefined
  
  const [user] = await db.select().from(users).where(eq(users.id, session.userId))
  return user
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

// Cookie helpers
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_MS / 1000, // seconds
    path: '/',
  }
}
