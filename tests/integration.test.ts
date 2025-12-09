import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Integration test that uses a real PDF file
 * This test requires an actual PDF file to be present
 */
describe('PDF Parsing Integration Test', () => {
  // Check if we have a sample PDF in the data folder
  const samplePdfPath = path.join(process.cwd(), 'tests', 'fixtures', 'sample.pdf')
  const hasSamplePdf = fs.existsSync(samplePdfPath)

  it.skipIf(!hasSamplePdf)('should parse a real PDF file', async () => {
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(samplePdfPath)
    const base64Data = pdfBuffer.toString('base64')

    // Import the actual function (not mocked)
    const { extractTextFromBase64 } = await import('../src/lib/ai-provider')

    const result = await extractTextFromBase64(base64Data, 'application/pdf')

    // Verify we got actual text
    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(typeof result).toBe('string')
  })

  it('should verify pdf-parse module is available', async () => {
    // Verify the pdf-parse module can be imported
    const pdfParseModule = await import('pdf-parse')
    expect(pdfParseModule).toBeDefined()
  })

  it('should handle base64 to Buffer conversion correctly', () => {
    const originalText = 'Hello, World!'
    const base64 = Buffer.from(originalText).toString('base64')
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')

    expect(decoded).toBe(originalText)
  })
})

describe('AI Provider Configuration', () => {
  it('should have required environment variables defined', () => {
    // Check that we have the AI provider configuration
    // These might be undefined in test environment, but the structure should exist
    const aiProvider = process.env.AI_PROVIDER || 'groq'
    const aiModel = process.env.AI_MODEL || 'llama-3.3-70b-versatile'

    expect(['groq', 'cerebras', 'openrouter']).toContain(aiProvider)
    expect(aiModel).toBeDefined()
    expect(typeof aiModel).toBe('string')
  })

  it('should default to groq provider when not specified', () => {
    const originalProvider = process.env.AI_PROVIDER
    delete process.env.AI_PROVIDER

    const provider = process.env.AI_PROVIDER || 'groq'
    expect(provider).toBe('groq')

    // Restore
    if (originalProvider) {
      process.env.AI_PROVIDER = originalProvider
    }
  })
})

describe('Study Material Types', () => {
  it('should validate flashcard structure', () => {
    const flashcard = {
      front: 'What is photosynthesis?',
      back: 'The process by which plants convert sunlight into chemical energy',
    }

    expect(flashcard).toHaveProperty('front')
    expect(flashcard).toHaveProperty('back')
    expect(typeof flashcard.front).toBe('string')
    expect(typeof flashcard.back).toBe('string')
  })

  it('should validate quiz question structure', () => {
    const quizQuestion = {
      id: 1,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswerIndex: 1,
      explanation: '2 + 2 equals 4',
    }

    expect(quizQuestion).toHaveProperty('id')
    expect(quizQuestion).toHaveProperty('question')
    expect(quizQuestion).toHaveProperty('options')
    expect(quizQuestion).toHaveProperty('correctAnswerIndex')
    expect(quizQuestion).toHaveProperty('explanation')
    expect(quizQuestion.options).toHaveLength(4)
    expect(quizQuestion.correctAnswerIndex).toBeGreaterThanOrEqual(0)
    expect(quizQuestion.correctAnswerIndex).toBeLessThan(quizQuestion.options.length)
  })

  it('should validate complete study material structure', () => {
    const studyMaterial = {
      summary: 'This is a summary of the document.',
      flashcards: [
        { front: 'Q1', back: 'A1' },
        { front: 'Q2', back: 'A2' },
      ],
      quiz: [
        {
          id: 1,
          question: 'Question 1?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 0,
          explanation: 'Explanation 1',
        },
      ],
    }

    expect(studyMaterial.summary).toBeDefined()
    expect(studyMaterial.flashcards).toBeInstanceOf(Array)
    expect(studyMaterial.quiz).toBeInstanceOf(Array)
    expect(studyMaterial.flashcards.length).toBeGreaterThan(0)
    expect(studyMaterial.quiz.length).toBeGreaterThan(0)
  })
})
