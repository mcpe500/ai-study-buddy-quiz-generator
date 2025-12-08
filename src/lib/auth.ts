import { db } from '@/db/repositories'
import type { User, Session } from '@/db/types'

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

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export async function createUser(email: string, password: string): Promise<User> {
  const passwordHash = await hashPassword(password)
  return db().users.create({
    email: email.toLowerCase().trim(),
    passwordHash,
  })
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return db().users.findByEmail(email)
}

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  const user = await findUserByEmail(email)
  if (!user) return null
  
  const isValid = await verifyPassword(password, user.passwordHash)
  return isValid ? user : null
}

export async function createSession(userId: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  return db().sessions.create({
    userId,
    expiresAt,
  })
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const session = await db().sessions.findById(sessionId)
  
  if (!session) return null
  
  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await deleteSession(sessionId)
    return null
  }
  
  return session
}

export async function getUserBySessionId(sessionId: string): Promise<User | null> {
  const session = await getSessionById(sessionId)
  if (!session) return null
  
  return db().users.findById(session.userId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db().sessions.delete(sessionId)
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db().sessions.deleteByUserId(userId)
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
