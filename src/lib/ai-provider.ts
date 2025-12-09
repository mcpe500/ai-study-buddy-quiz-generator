import Groq from 'groq-sdk'
import Cerebras from '@cerebras/cerebras_cloud_sdk'
import OpenAI from 'openai'
import type { GeneratedStudyMaterial, AIProvider } from '@/types/study'

// Logging prefix
const LOG_PREFIX = '[AI Provider]'

// Get AI configuration from environment
function getAIConfig() {
  const provider = (process.env.AI_PROVIDER || 'groq') as AIProvider
  const model = process.env.AI_MODEL || 'llama-3.3-70b-versatile'
  
  console.log(`${LOG_PREFIX} Config loaded - Provider: ${provider}, Model: ${model}`)
  return { provider, model }
}

// System prompt for study material generation
const SYSTEM_PROMPT = `You are an expert tutor. Your goal is to help students understand material 100% and ace their exams.

When given document content, you must:
1. Create a clear, simple summary ("Explain like I'm 12")
2. Create a comprehensive set of flashcards for key terms and concepts (at least 10)
3. Create a challenging multiple-choice quiz that tests deep understanding (at least 15-20 questions)

The user needs a LOT of practice questions to pass their exam. Be thorough.

CRITICAL: You MUST respond with ONLY valid JSON - no markdown, no code blocks, no extra text.
Response format:
{
  "summary": "string - your ELI12 summary",
  "flashcards": [{"front": "concept", "back": "explanation"}, ...],
  "quiz": [{"id": 1, "question": "question text", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 0, "explanation": "why this is correct"}, ...]
}

Do NOT wrap your response in \`\`\`json or any markdown. Return ONLY the raw JSON object.`

// Clean AI response - strip markdown code blocks if present
function cleanJsonResponse(text: string): string {
  console.log(`${LOG_PREFIX} Cleaning response, original length: ${text.length}`)
  
  let cleaned = text.trim()
  
  // Remove markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
    console.log(`${LOG_PREFIX} Stripped markdown code block wrapper`)
  }
  
  // Try to extract JSON object if there's extra text around it
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
    console.log(`${LOG_PREFIX} Extracted JSON object from response`)
  }
  
  console.log(`${LOG_PREFIX} Cleaned response length: ${cleaned.length}`)
  console.log(`${LOG_PREFIX} First 200 chars: ${cleaned.substring(0, 200)}...`)
  
  return cleaned
}

// Parse AI response with error handling
function parseAIResponse(text: string): GeneratedStudyMaterial {
  const cleaned = cleanJsonResponse(text)
  
  try {
    const parsed = JSON.parse(cleaned) as GeneratedStudyMaterial
    console.log(`${LOG_PREFIX} Successfully parsed JSON response`)
    console.log(`${LOG_PREFIX} Summary length: ${parsed.summary?.length || 0}`)
    console.log(`${LOG_PREFIX} Flashcards count: ${parsed.flashcards?.length || 0}`)
    console.log(`${LOG_PREFIX} Quiz questions count: ${parsed.quiz?.length || 0}`)
    return parsed
  } catch (error) {
    console.error(`${LOG_PREFIX} JSON parse error:`, error)
    console.error(`${LOG_PREFIX} Failed to parse text (first 500 chars):`, cleaned.substring(0, 500))
    throw new Error(`Failed to parse AI response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Create Groq client
function createGroqClient() {
  console.log(`${LOG_PREFIX} Creating Groq client`)
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })
}

// Create Cerebras client
function createCerebrasClient() {
  console.log(`${LOG_PREFIX} Creating Cerebras client`)
  return new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
  })
}

// Create OpenRouter client (uses OpenAI SDK with different base URL)
function createOpenRouterClient() {
  console.log(`${LOG_PREFIX} Creating OpenRouter client`)
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  })
}

// Generate study material using Groq
async function generateWithGroq(content: string, model: string): Promise<GeneratedStudyMaterial> {
  console.log(`${LOG_PREFIX} [Groq] Starting generation with model: ${model}`)
  console.log(`${LOG_PREFIX} [Groq] Content length: ${content.length} chars`)
  
  const client = createGroqClient()
  
  console.log(`${LOG_PREFIX} [Groq] Sending request to API...`)
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
    temperature: 0.3,
    max_completion_tokens: 8000,
  })
  
  console.log(`${LOG_PREFIX} [Groq] Received response`)
  console.log(`${LOG_PREFIX} [Groq] Finish reason: ${completion.choices[0]?.finish_reason}`)
  
  const text = completion.choices[0]?.message?.content || '{}'
  return parseAIResponse(text)
}

// Generate study material using Cerebras
async function generateWithCerebras(content: string, model: string): Promise<GeneratedStudyMaterial> {
  console.log(`${LOG_PREFIX} [Cerebras] Starting generation with model: ${model}`)
  console.log(`${LOG_PREFIX} [Cerebras] Content length: ${content.length} chars`)
  
  const client = createCerebrasClient()
  
  console.log(`${LOG_PREFIX} [Cerebras] Sending request to API...`)
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
  })
  
  console.log(`${LOG_PREFIX} [Cerebras] Received response`)
  
  const choices = completion.choices as Array<{ message?: { content?: string } }>
  const text = choices[0]?.message?.content || '{}'
  return parseAIResponse(text)
}

// Generate study material using OpenRouter
async function generateWithOpenRouter(content: string, model: string): Promise<GeneratedStudyMaterial> {
  console.log(`${LOG_PREFIX} [OpenRouter] Starting generation with model: ${model}`)
  console.log(`${LOG_PREFIX} [OpenRouter] Content length: ${content.length} chars`)
  
  const client = createOpenRouterClient()
  
  console.log(`${LOG_PREFIX} [OpenRouter] Sending request to API...`)
  const completion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Please analyze this document and generate study material:\n\n${content}` },
    ],
    model,
    temperature: 0.3,
    max_tokens: 8000,
  })
  
  console.log(`${LOG_PREFIX} [OpenRouter] Received response`)
  console.log(`${LOG_PREFIX} [OpenRouter] Finish reason: ${completion.choices[0]?.finish_reason}`)
  
  const text = completion.choices[0]?.message?.content || '{}'
  return parseAIResponse(text)
}

// Main function to generate study material
export async function generateStudyMaterial(content: string): Promise<GeneratedStudyMaterial> {
  const { provider, model } = getAIConfig()
  
  console.log(`${LOG_PREFIX} ========================================`)
  console.log(`${LOG_PREFIX} Starting study material generation`)
  console.log(`${LOG_PREFIX} Provider: ${provider}, Model: ${model}`)
  console.log(`${LOG_PREFIX} Input content length: ${content.length} chars`)
  console.log(`${LOG_PREFIX} ========================================`)
  
  try {
    let result: GeneratedStudyMaterial
    
    switch (provider) {
      case 'groq':
        result = await generateWithGroq(content, model)
        break
      case 'cerebras':
        result = await generateWithCerebras(content, model)
        break
      case 'openrouter':
        result = await generateWithOpenRouter(content, model)
        break
      default:
        throw new Error(`Unknown AI provider: ${provider}`)
    }
    
    console.log(`${LOG_PREFIX} ========================================`)
    console.log(`${LOG_PREFIX} Generation completed successfully!`)
    console.log(`${LOG_PREFIX} ========================================`)
    
    return result
  } catch (error) {
    console.error(`${LOG_PREFIX} ========================================`)
    console.error(`${LOG_PREFIX} Generation FAILED!`)
    console.error(`${LOG_PREFIX} Error:`, error)
    console.error(`${LOG_PREFIX} ========================================`)
    throw error
  }
}

// Extract text from base64 document - NOW ACTUALLY PARSES PDFs!
export async function extractTextFromBase64(base64Data: string, mimeType: string): Promise<string> {
  console.log(`${LOG_PREFIX} Extracting text from base64 data`)
  console.log(`${LOG_PREFIX} MimeType: ${mimeType}, Base64 length: ${base64Data.length}`)
  
  if (mimeType.includes('pdf')) {
    console.log(`${LOG_PREFIX} Detected PDF document, parsing with pdf-parse...`)
    
    try {
      // Dynamic import pdf-parse and handle module format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule = await import('pdf-parse') as any
      const pdfParse = pdfParseModule.default ?? pdfParseModule
      
      // Convert base64 to Buffer
      const pdfBuffer = Buffer.from(base64Data, 'base64')
      console.log(`${LOG_PREFIX} Converted to buffer, size: ${pdfBuffer.length} bytes`)
      
      // Parse the PDF
      const pdfData = await pdfParse(pdfBuffer)
      
      console.log(`${LOG_PREFIX} PDF parsed successfully!`)
      console.log(`${LOG_PREFIX} Pages: ${pdfData.numpages}`)
      console.log(`${LOG_PREFIX} Extracted text length: ${pdfData.text.length} chars`)
      console.log(`${LOG_PREFIX} First 500 chars: ${pdfData.text.substring(0, 500)}...`)
      
      // Return the extracted text, limit to prevent token overflow
      const maxChars = 50000 // ~12k tokens, leaving room for response
      if (pdfData.text.length > maxChars) {
        console.log(`${LOG_PREFIX} Text too long, truncating to ${maxChars} chars`)
        return pdfData.text.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
      }
      
      return pdfData.text
    } catch (error) {
      console.error(`${LOG_PREFIX} PDF parsing failed:`, error)
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  if (mimeType.includes('image')) {
    console.log(`${LOG_PREFIX} Detected image document`)
    // For images, we'd need OCR - for now return an error
    throw new Error('Image documents require OCR which is not yet implemented. Please upload a PDF or text file.')
  }
  
  // For text-based documents, try to decode
  try {
    const decoded = Buffer.from(base64Data, 'base64').toString('utf-8')
    console.log(`${LOG_PREFIX} Decoded text document, length: ${decoded.length}`)
    return decoded
  } catch {
    console.log(`${LOG_PREFIX} Failed to decode base64, using raw data`)
    return base64Data
  }
}
