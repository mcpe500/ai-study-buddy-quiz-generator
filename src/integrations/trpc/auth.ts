import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { publicProcedure } from './init'
import {
  createUser,
  findUserByEmail,
  validateCredentials,
  createSession,
  deleteSession,
  getUserBySessionId,
} from '@/lib/auth'
import type { TRPCRouterRecord } from '@trpc/server'

// Auth router
export const authRouter = {
  // Register a new user
  register: publicProcedure
    .input(z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
    }))
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existing = await findUserByEmail(input.email)
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      // Create user
      const user = await createUser(input.email, input.password)

      // Create session
      const session = await createSession(user.id)

      return {
        user: { id: user.id, email: user.email },
        sessionId: session.id,
      }
    }),

  // Login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const user = await validateCredentials(input.email, input.password)
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        })
      }

      // Create session
      const session = await createSession(user.id)

      return {
        user: { id: user.id, email: user.email },
        sessionId: session.id,
      }
    }),

  // Logout
  logout: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      await deleteSession(input.sessionId)
      return { success: true }
    }),

  // Get current user
  me: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      if (!input.sessionId) {
        return { user: null }
      }

      const user = await getUserBySessionId(input.sessionId)
      
      if (!user) {
        return { user: null }
      }

      return {
        user: { id: user.id, email: user.email },
      }
    }),
} satisfies TRPCRouterRecord
