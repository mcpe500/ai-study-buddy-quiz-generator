import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { publicProcedure } from './init'
import { db } from '@/db'
import { documents, studyMaterials, quizProgress } from '@/db/schema'
import { getUserBySessionId } from '@/lib/auth'
import { queueDocumentProcessing, getDocumentWithMaterial, getUserDocuments } from '@/lib/jobs'
import type { TRPCRouterRecord } from '@trpc/server'

// Helper to require auth
async function requireAuth(sessionId: string | undefined) {
  if (!sessionId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' })
  }
  
  const user = await getUserBySessionId(sessionId)
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid session' })
  }
  
  return user
}

// Study router
export const studyRouter = {
  // Upload a document
  upload: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      fileName: z.string(),
      mimeType: z.string(),
      fileData: z.string(), // base64
    }))
    .mutation(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      // Create document record
      const [doc] = await db.insert(documents).values({
        userId: user.id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileData: input.fileData,
        status: 'pending',
      }).returning()
      
      // Queue for background processing
      queueDocumentProcessing(doc.id)
      
      return {
        documentId: doc.id,
        status: 'pending',
      }
    }),

  // Check document status
  status: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      documentId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      const [doc] = await db.select().from(documents)
        .where(eq(documents.id, input.documentId))
      
      if (!doc || doc.userId !== user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' })
      }
      
      return {
        status: doc.status,
        errorMessage: doc.errorMessage,
      }
    }),

  // Get study material for a document
  getMaterial: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      documentId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      const result = await getDocumentWithMaterial(input.documentId)
      
      if (!result || result.document.userId !== user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' })
      }
      
      return {
        document: {
          id: result.document.id,
          fileName: result.document.fileName,
          status: result.document.status,
          createdAt: result.document.createdAt,
        },
        studyMaterial: result.studyMaterial ? {
          id: result.studyMaterial.id,
          summary: result.studyMaterial.summary,
          flashcards: result.studyMaterial.flashcards,
          quiz: result.studyMaterial.quiz,
        } : null,
      }
    }),

  // Get user's document history
  history: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      const docs = await getUserDocuments(user.id)
      
      return docs.map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        status: doc.status,
        createdAt: doc.createdAt,
      }))
    }),

  // Save quiz progress
  saveProgress: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      studyMaterialId: z.string().uuid(),
      score: z.number().int().min(0),
      totalQuestions: z.number().int().min(1),
    }))
    .mutation(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      const [progress] = await db.insert(quizProgress).values({
        userId: user.id,
        studyMaterialId: input.studyMaterialId,
        score: input.score,
        totalQuestions: input.totalQuestions,
      }).returning()
      
      return { id: progress.id }
    }),

  // Get quiz progress history
  getProgress: publicProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      studyMaterialId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      const user = await requireAuth(input.sessionId)
      
      let query = db.select().from(quizProgress).where(eq(quizProgress.userId, user.id))
      
      if (input.studyMaterialId) {
        query = db.select().from(quizProgress)
          .where(eq(quizProgress.studyMaterialId, input.studyMaterialId))
      }
      
      const progress = await query
      
      return progress.map(p => ({
        id: p.id,
        score: p.score,
        totalQuestions: p.totalQuestions,
        percentage: Math.round((p.score / p.totalQuestions) * 100),
        completedAt: p.completedAt,
      }))
    }),
} satisfies TRPCRouterRecord
