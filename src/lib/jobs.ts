import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { documents, studyMaterials } from '@/db/schema'
import { generateStudyMaterial, extractTextFromBase64 } from './ai-provider'
import type { DocumentStatus } from '@/types/study'

// Process a document in the background
export async function processDocument(documentId: string): Promise<void> {
  console.log(`[Job] Starting processing for document: ${documentId}`)
  
  try {
    // Update status to processing
    await updateDocumentStatus(documentId, 'processing')
    
    // Get the document
    const [doc] = await db.select().from(documents).where(eq(documents.id, documentId))
    if (!doc) {
      throw new Error('Document not found')
    }
    
    // Extract text from the document
    const content = extractTextFromBase64(doc.fileData, doc.mimeType)
    
    // Generate study material using AI
    const material = await generateStudyMaterial(content)
    
    // Save the generated material
    await db.insert(studyMaterials).values({
      documentId: doc.id,
      summary: material.summary,
      flashcards: material.flashcards,
      quiz: material.quiz,
    })
    
    // Update status to completed
    await updateDocumentStatus(documentId, 'completed')
    
    console.log(`[Job] Completed processing for document: ${documentId}`)
  } catch (error) {
    console.error(`[Job] Error processing document ${documentId}:`, error)
    
    // Update status to failed
    await updateDocumentStatus(
      documentId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

// Update document status
async function updateDocumentStatus(
  documentId: string, 
  status: DocumentStatus, 
  errorMessage?: string
): Promise<void> {
  await db.update(documents)
    .set({ 
      status, 
      errorMessage: errorMessage || null,
    })
    .where(eq(documents.id, documentId))
}

// Queue a document for processing (runs async, returns immediately)
export function queueDocumentProcessing(documentId: string): void {
  // Run processing in background (fire and forget)
  // In production, you'd use a proper job queue like BullMQ
  setImmediate(() => {
    processDocument(documentId).catch(err => {
      console.error(`[Job] Unhandled error in background job:`, err)
    })
  })
}

// Get document with its study material
export async function getDocumentWithMaterial(documentId: string) {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId))
  if (!doc) return null
  
  const [material] = await db.select().from(studyMaterials).where(eq(studyMaterials.documentId, documentId))
  
  return {
    document: doc,
    studyMaterial: material || null,
  }
}

// Get all documents for a user
export async function getUserDocuments(userId: string) {
  return db.select().from(documents).where(eq(documents.userId, userId))
}
