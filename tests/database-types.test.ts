import { describe, it, expect } from 'vitest'
import type {
  User,
  NewUser,
  Session,
  NewSession,
  Document,
  NewDocument,
  Flashcard,
  QuizQuestion,
  StudyMaterial,
  NewStudyMaterial,
  QuizProgress,
  NewQuizProgress,
  DocumentStatus,
} from '@/db/types'

/**
 * Database Types Validation Tests
 * Validates structure and type constraints for all database entities
 */

describe('Database Types', () => {
  describe('User Types', () => {
    it('should validate User structure', () => {
      const user: User = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: 'hash123',
        createdAt: new Date(),
      }

      expect(user.id).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.passwordHash).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should validate NewUser with optional fields', () => {
      const newUser: NewUser = {
        email: 'new@example.com',
        passwordHash: 'newhash',
      }

      expect(newUser.email).toBe('new@example.com')
      expect(newUser.id).toBeUndefined()
      expect(newUser.createdAt).toBeUndefined()
    })

    it('should allow null createdAt in User', () => {
      const user: User = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        createdAt: null,
      }

      expect(user.createdAt).toBeNull()
    })
  })

  describe('Session Types', () => {
    it('should validate Session structure', () => {
      const session: Session = {
        id: 'session-uuid',
        userId: 'user-uuid',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      }

      expect(session.id).toBeDefined()
      expect(session.userId).toBeDefined()
      expect(session.expiresAt).toBeInstanceOf(Date)
    })

    it('should validate NewSession requires userId and expiresAt', () => {
      const newSession: NewSession = {
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 86400000),
      }

      expect(newSession.userId).toBe('user-123')
      expect(newSession.expiresAt).toBeInstanceOf(Date)
    })
  })

  describe('Document Types', () => {
    it('should validate Document structure', () => {
      const doc: Document = {
        id: 'doc-uuid',
        userId: 'user-uuid',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileData: 'base64data',
        status: 'completed',
        errorMessage: null,
        createdAt: new Date(),
      }

      expect(doc.id).toBeDefined()
      expect(doc.fileName).toBe('test.pdf')
      expect(doc.mimeType).toBe('application/pdf')
      expect(doc.status).toBe('completed')
    })

    it('should validate Document with error message', () => {
      const doc: Document = {
        id: 'doc-uuid',
        userId: 'user-uuid',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        fileData: 'base64data',
        status: 'failed',
        errorMessage: 'PDF parsing failed',
        createdAt: new Date(),
      }

      expect(doc.status).toBe('failed')
      expect(doc.errorMessage).toBe('PDF parsing failed')
    })

    it('should validate NewDocument with minimal required fields', () => {
      const newDoc: NewDocument = {
        userId: 'user-123',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        fileData: 'base64==',
      }

      expect(newDoc.status).toBeUndefined()
      expect(newDoc.errorMessage).toBeUndefined()
    })
  })

  describe('DocumentStatus Enum', () => {
    it('should accept valid status values', () => {
      const statuses: DocumentStatus[] = ['pending', 'processing', 'completed', 'failed']
      
      expect(statuses).toContain('pending')
      expect(statuses).toContain('processing')
      expect(statuses).toContain('completed')
      expect(statuses).toContain('failed')
      expect(statuses).toHaveLength(4)
    })
  })

  describe('Flashcard Type', () => {
    it('should validate Flashcard structure', () => {
      const flashcard: Flashcard = {
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
      }

      expect(flashcard.front).toBeDefined()
      expect(flashcard.back).toBeDefined()
      expect(typeof flashcard.front).toBe('string')
      expect(typeof flashcard.back).toBe('string')
    })

    it('should allow empty strings in flashcard', () => {
      const flashcard: Flashcard = {
        front: '',
        back: '',
      }

      expect(flashcard.front).toBe('')
      expect(flashcard.back).toBe('')
    })
  })

  describe('QuizQuestion Type', () => {
    it('should validate QuizQuestion structure', () => {
      const question: QuizQuestion = {
        id: 1,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswerIndex: 1,
        explanation: '2 + 2 equals 4',
      }

      expect(question.id).toBe(1)
      expect(question.options).toHaveLength(4)
      expect(question.correctAnswerIndex).toBe(1)
      expect(question.correctAnswerIndex).toBeLessThan(question.options.length)
    })

    it('should validate correctAnswerIndex is within bounds', () => {
      const question: QuizQuestion = {
        id: 1,
        question: 'Test?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 3,
        explanation: 'D is correct',
      }

      expect(question.correctAnswerIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctAnswerIndex).toBeLessThan(question.options.length)
    })
  })

  describe('StudyMaterial Types', () => {
    it('should validate complete StudyMaterial', () => {
      const material: StudyMaterial = {
        id: 'material-uuid',
        documentId: 'doc-uuid',
        summary: 'This is a summary',
        flashcards: [
          { front: 'Q1', back: 'A1' },
          { front: 'Q2', back: 'A2' },
        ],
        quiz: [
          {
            id: 1,
            question: 'Test Q?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswerIndex: 0,
            explanation: 'A is correct',
          },
        ],
        createdAt: new Date(),
      }

      expect(material.summary).toBe('This is a summary')
      expect(material.flashcards).toHaveLength(2)
      expect(material.quiz).toHaveLength(1)
    })

    it('should allow null fields in StudyMaterial', () => {
      const material: StudyMaterial = {
        id: 'material-uuid',
        documentId: 'doc-uuid',
        summary: null,
        flashcards: null,
        quiz: null,
        createdAt: null,
      }

      expect(material.summary).toBeNull()
      expect(material.flashcards).toBeNull()
      expect(material.quiz).toBeNull()
    })

    it('should validate NewStudyMaterial with minimal fields', () => {
      const newMaterial: NewStudyMaterial = {
        documentId: 'doc-123',
      }

      expect(newMaterial.documentId).toBe('doc-123')
      expect(newMaterial.summary).toBeUndefined()
    })
  })

  describe('QuizProgress Types', () => {
    it('should validate QuizProgress structure', () => {
      const progress: QuizProgress = {
        id: 'progress-uuid',
        userId: 'user-uuid',
        studyMaterialId: 'material-uuid',
        score: 8,
        totalQuestions: 10,
        completedAt: new Date(),
      }

      expect(progress.score).toBe(8)
      expect(progress.totalQuestions).toBe(10)
      expect(progress.score).toBeLessThanOrEqual(progress.totalQuestions)
    })

    it('should validate NewQuizProgress', () => {
      const newProgress: NewQuizProgress = {
        userId: 'user-123',
        studyMaterialId: 'material-123',
        score: 5,
        totalQuestions: 10,
      }

      expect(newProgress.completedAt).toBeUndefined()
    })

    it('should calculate percentage correctly', () => {
      const progress: QuizProgress = {
        id: 'progress-uuid',
        userId: 'user-uuid',
        studyMaterialId: 'material-uuid',
        score: 7,
        totalQuestions: 10,
        completedAt: new Date(),
      }

      const percentage = Math.round((progress.score / progress.totalQuestions) * 100)
      expect(percentage).toBe(70)
    })
  })
})
