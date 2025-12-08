import Groq from 'groq-sdk'
import Cerebras from '@cerebras/cerebras_cloud_sdk'
import OpenAI from 'openai'
import type { GeneratedStudyMaterial, AIProvider } from '@/types/study'

// Get AI configuration from environment
function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || 'groq') as AIProvider
  const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile'
  
  return { provider, model }
}

// System prompt for study material generation
const SYSTEM_PROMPT = `You are an expert tutor. Your goal is to help students understand material 100% and ace their exams.

When given document content, you must:
1. Create a clear, simple summary ("Explain like I'm 12")
2. Create a comprehensive set of flashcards for key terms and concepts (at least 10)
3. Create a challenging multiple-choice quiz that tests deep understanding (at least 15-20 questions)

The user needs a LOT of practice questions to pass their exam. Be thorough.

You MUST respond with valid JSON in this exact format:
{
  "summary": "string - your ELI12 summary",
  "flashcards": [{"front": "concept", "back": "explanation"}, ...],
  "quiz": [{"id": 1, "question": "question text", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "why this is correct"}, ...]
}

Do not include any text outside the JSON object.`

// Create Groq client
function createGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

// Create Cerebras client
function createCerebrasClient() {
  return new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
  })
}

// Create OpenRouter client (uses OpenAI SDK with different base URL)
function createOpenRouterClient() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })
}

// Generate study material using Groq
async function generateWithGroq(content: string, model: string): Promise<GeneratedStudyMaterial> {
  const client = createGroqClient()
  
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
    temperature: 0.3,
    max_completion_tokens: 8000,
  })
  
  const text = completion.choices[0]?.message?.content || '{}'
  return JSON.parse(text) as GeneratedStudyMaterial
}

// Generate study material using Cerebras
async function generateWithCerebras(content: string, model: string): Promise<GeneratedStudyMaterial> {
  const client = createCerebrasClient()
  
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
  })
  
  const text = completion.choices[0]?.message?.content || '{}'
  return JSON.parse(text) as GeneratedStudyMaterial
}

// Generate study material using OpenRouter
async function generateWithOpenRouter(content: string, model: string): Promise<GeneratedStudyMaterial> {
  const client = createOpenRouterClient()
  
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
    temperature: 0.3,
    max_tokens: 8000,
  })
  
  const text = completion.choices[0]?.message?.content || '{}'
  return JSON.parse(text) as GeneratedStudyMaterial
}

// Main function to generate study material
export async function generateStudyMaterial(content: string): Promise<GeneratedStudyMaterial> {
  const { provider, model } = getAIConfig()
  
  console.log(`[AI] Using provider: ${provider}, model: ${model}`)
  
  switch (provider) {
    case 'groq':
      return generateWithGroq(content, model)
    case 'cerebras':
      return generateWithCerebras(content, model)
    case 'openrouter':
      return generateWithOpenRouter(content, model)
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

// Extract text from base64 document (simplified - in production use proper PDF parsing)
export function extractTextFromBase64(base64Data: string, mimeType: string): string {
  // For now, we'll send the raw content description
  // In production, you'd use pdf-parse or similar for PDFs
  if (mimeType.includes('pdf')) {
    return `[PDF Document - Base64 Length: ${base64Data.length}]\n\nPlease extract and analyze the content from this PDF document.`
  }
  
  if (mimeType.includes('image')) {
    return `[Image Document - Base64 Length: ${base64Data.length}]\n\nPlease analyze this image and extract any text or educational content.`
  }
  
  // For text-based documents, try to decode
  try {
    return atob(base64Data)
  } catch {
    return base64Data
  }
}
