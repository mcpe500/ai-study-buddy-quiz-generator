import { pgTable, text, timestamp, uuid, integer, jsonb } from 'drizzle-orm/pg-core'

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Documents table (uploaded files)
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileData: text('file_data').notNull(), // base64 encoded
  status: text('status').default('pending').notNull(), // pending, processing, completed, failed
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
})

// Study materials (generated from documents)
export const studyMaterials = pgTable('study_materials', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  summary: text('summary'),
  flashcards: jsonb('flashcards').$type<Array<{ front: string; back: string }>>(),
  quiz: jsonb('quiz').$type<Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
  }>>(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Quiz progress (user's quiz attempts)
export const quizProgress = pgTable('quiz_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  studyMaterialId: uuid('study_material_id').references(() => studyMaterials.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  completedAt: timestamp('completed_at').defaultNow(),
})

// Type exports for use in application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type StudyMaterial = typeof studyMaterials.$inferSelect
export type NewStudyMaterial = typeof studyMaterials.$inferInsert
export type QuizProgress = typeof quizProgress.$inferSelect
export type NewQuizProgress = typeof quizProgress.$inferInsert
