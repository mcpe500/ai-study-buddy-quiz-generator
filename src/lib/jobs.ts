import { db } from '@/db/repositories'
import { generateStudyMaterial, extractTextFromBase64 } from './ai-provider'

// Process a document in the background
export async function processDocument(documentId: string): Promise<void> {
  console.log(`[Job] Starting processing for document: ${documentId}`)
  
  try {
    // Update status to processing
    await db().documents.updateStatus(documentId, 'processing')
    
    // Get the document
    const doc = await db().documents.findById(documentId)
    if (!doc) {
      throw new Error('Document not found')
    }
    
    // Extract text from the document
    const content = extractTextFromBase64(doc.fileData, doc.mimeType)
    
    // Generate study material using AI
    const material = await generateStudyMaterial(content)
    
    // Save the generated material
    await db().studyMaterials.create({
      documentId: doc.id,
      summary: material.summary,
      flashcards: material.flashcards,
      quiz: material.quiz,
    })
    
    // Update status to completed
    await db().documents.updateStatus(documentId, 'completed')
    
    console.log(`[Job] Completed processing for document: ${documentId}`)
  } catch (error) {
    console.error(`[Job] Error processing document ${documentId}:`, error)
    
    // Update status to failed
    await db().documents.updateStatus(
      documentId, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
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
  const doc = await db().documents.findById(documentId)
  if (!doc) return null
  
  const material = await db().studyMaterials.findByDocumentId(documentId)
  
  return {
    document: doc,
    studyMaterial: material,
  }
}

// Get all documents for a user
export async function getUserDocuments(userId: string) {
  return db().documents.findByUserId(userId)
}
