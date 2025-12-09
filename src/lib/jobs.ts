import { initDatabase, db } from '@/db/repositories'
import { generateStudyMaterial, extractTextFromBase64 } from './ai-provider'

// Logging prefix
const LOG_PREFIX = '[Job]'

// Ensure database is initialized before any operation
async function ensureDb() {
  console.log(`${LOG_PREFIX} Ensuring database is initialized...`)
  try {
    await initDatabase()
    console.log(`${LOG_PREFIX} Database ready`)
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to initialize database:`, error)
    throw error
  }
}

// Process a document in the background
export async function processDocument(documentId: string): Promise<void> {
  console.log(`${LOG_PREFIX} ========================================`)
  console.log(`${LOG_PREFIX} Starting document processing`)
  console.log(`${LOG_PREFIX} Document ID: ${documentId}`)
  console.log(`${LOG_PREFIX} ========================================`)
  
  try {
    // Ensure database is ready
    await ensureDb()
    
    // Update status to processing
    console.log(`${LOG_PREFIX} Updating status to 'processing'...`)
    await db().documents.updateStatus(documentId, 'processing')
    
    // Get the document
    console.log(`${LOG_PREFIX} Fetching document from database...`)
    const doc = await db().documents.findById(documentId)
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`)
    }
    console.log(`${LOG_PREFIX} Document found: ${doc.fileName} (${doc.mimeType})`)
    console.log(`${LOG_PREFIX} File data length: ${doc.fileData.length} chars`)
    
    // Extract text from the document
    console.log(`${LOG_PREFIX} Extracting text from document...`)
    const content = await extractTextFromBase64(doc.fileData, doc.mimeType)
    console.log(`${LOG_PREFIX} Extracted content length: ${content.length} chars`)
    
    // Generate study material using AI
    console.log(`${LOG_PREFIX} Generating study material with AI...`)
    const startTime = Date.now()
    const material = await generateStudyMaterial(content)
    const duration = Date.now() - startTime
    console.log(`${LOG_PREFIX} AI generation completed in ${duration}ms`)
    console.log(`${LOG_PREFIX} Generated summary: ${material.summary?.substring(0, 100)}...`)
    console.log(`${LOG_PREFIX} Generated ${material.flashcards?.length || 0} flashcards`)
    console.log(`${LOG_PREFIX} Generated ${material.quiz?.length || 0} quiz questions`)
    
    // Save the generated material
    console.log(`${LOG_PREFIX} Saving study material to database...`)
    const savedMaterial = await db().studyMaterials.create({
      documentId: doc.id,
      summary: material.summary,
      flashcards: material.flashcards,
      quiz: material.quiz,
    })
    console.log(`${LOG_PREFIX} Study material saved with ID: ${savedMaterial.id}`)
    
    // Update status to completed
    console.log(`${LOG_PREFIX} Updating status to 'completed'...`)
    await db().documents.updateStatus(documentId, 'completed')
    
    console.log(`${LOG_PREFIX} ========================================`)
    console.log(`${LOG_PREFIX} Document processing COMPLETED!`)
    console.log(`${LOG_PREFIX} Document ID: ${documentId}`)
    console.log(`${LOG_PREFIX} Total duration: ${Date.now() - startTime}ms (AI only: ${duration}ms)`)
    console.log(`${LOG_PREFIX} ========================================`)
    
  } catch (error) {
    console.error(`${LOG_PREFIX} ========================================`)
    console.error(`${LOG_PREFIX} Document processing FAILED!`)
    console.error(`${LOG_PREFIX} Document ID: ${documentId}`)
    console.error(`${LOG_PREFIX} Error:`, error)
    console.error(`${LOG_PREFIX} ========================================`)
    
    // Update status to failed
    try {
      await ensureDb()
      await db().documents.updateStatus(
        documentId, 
        'failed', 
        error instanceof Error ? error.message : 'Unknown error'
      )
      console.log(`${LOG_PREFIX} Status updated to 'failed'`)
    } catch (updateError) {
      console.error(`${LOG_PREFIX} Failed to update status to 'failed':`, updateError)
    }
  }
}

// Queue a document for processing (runs async, returns immediately)
export function queueDocumentProcessing(documentId: string): void {
  console.log(`${LOG_PREFIX} Queueing document for processing: ${documentId}`)
  
  // Run processing in background (fire and forget)
  // In production, you'd use a proper job queue like BullMQ
  setImmediate(() => {
    console.log(`${LOG_PREFIX} Background job starting for: ${documentId}`)
    processDocument(documentId).catch(err => {
      console.error(`${LOG_PREFIX} Unhandled error in background job for ${documentId}:`, err)
    })
  })
  
  console.log(`${LOG_PREFIX} Document queued, returning immediately`)
}

// Get document with its study material
export async function getDocumentWithMaterial(documentId: string) {
  console.log(`${LOG_PREFIX} getDocumentWithMaterial: ${documentId}`)
  
  await ensureDb()
  
  const doc = await db().documents.findById(documentId)
  if (!doc) {
    console.log(`${LOG_PREFIX} Document not found: ${documentId}`)
    return null
  }
  
  const material = await db().studyMaterials.findByDocumentId(documentId)
  console.log(`${LOG_PREFIX} Found document: ${doc.fileName}, has material: ${!!material}`)
  
  return {
    document: doc,
    studyMaterial: material,
  }
}

// Get all documents for a user
export async function getUserDocuments(userId: string) {
  console.log(`${LOG_PREFIX} getUserDocuments for user: ${userId}`)
  
  await ensureDb()
  
  const docs = await db().documents.findByUserId(userId)
  console.log(`${LOG_PREFIX} Found ${docs.length} documents for user: ${userId}`)
  
  return docs
}
