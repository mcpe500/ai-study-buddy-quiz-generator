import { describe, it, expect } from 'vitest'

// We need to re-export the internal functions for testing
// First, let's create a test for the JSON cleaning logic

/**
 * Clean AI response - strip markdown code blocks if present
 * (Copy of the function from ai-provider.ts for isolated testing)
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim()
  
  // Remove markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }
  
  // Try to extract JSON object if there's extra text around it
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }
  
  return cleaned
}

describe('cleanJsonResponse', () => {
  describe('markdown code block removal', () => {
    it('should remove ```json wrapper', () => {
      const input = '```json\n{"summary": "test"}\n```'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test"}')
    })

    it('should remove ``` wrapper without language specifier', () => {
      const input = '```\n{"summary": "test"}\n```'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test"}')
    })

    it('should handle code block with extra whitespace', () => {
      const input = '```json\n\n  {"summary": "test"}  \n\n```'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test"}')
    })

    it('should preserve valid JSON without code block', () => {
      const input = '{"summary": "test", "flashcards": []}'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test", "flashcards": []}')
    })
  })

  describe('JSON extraction from text', () => {
    it('should extract JSON from text with leading apology', () => {
      const input = 'I apologize for the confusion. Here is the correct format:\n{"summary": "test"}'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test"}')
    })

    it('should extract JSON from text with trailing explanation', () => {
      const input = '{"summary": "test"}\n\nI hope this helps!'
      const result = cleanJsonResponse(input)
      expect(result).toBe('{"summary": "test"}')
    })

    it('should handle complex nested JSON', () => {
      const input = `Here is the study material:
\`\`\`json
{
  "summary": "This is a test",
  "flashcards": [
    {"front": "Q1", "back": "A1"},
    {"front": "Q2", "back": "A2"}
  ],
  "quiz": [
    {
      "id": 1,
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswerIndex": 1,
      "explanation": "Basic math"
    }
  ]
}
\`\`\``
      const result = cleanJsonResponse(input)
      const parsed = JSON.parse(result)
      
      expect(parsed.summary).toBe('This is a test')
      expect(parsed.flashcards).toHaveLength(2)
      expect(parsed.quiz).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = cleanJsonResponse('')
      expect(result).toBe('')
    })

    it('should handle whitespace only', () => {
      const result = cleanJsonResponse('   \n\t  ')
      expect(result).toBe('')
    })

    it('should handle JSON with special characters', () => {
      const input = '{"summary": "Test with \\"quotes\\" and \\n newlines"}'
      const result = cleanJsonResponse(input)
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('should handle malformed JSON gracefully', () => {
      const input = '{summary: not valid json}'
      const result = cleanJsonResponse(input)
      // Should still extract the {} block, even if it's not valid JSON
      expect(result).toBe('{summary: not valid json}')
    })
  })
})

describe('parseAIResponse', () => {
  /**
   * Parse AI response with error handling
   * (Copy of the function from ai-provider.ts for isolated testing)
   */
  function parseAIResponse(text: string) {
    const cleaned = cleanJsonResponse(text)
    return JSON.parse(cleaned)
  }

  it('should parse valid JSON response', () => {
    const input = '{"summary": "Test", "flashcards": [], "quiz": []}'
    const result = parseAIResponse(input)
    
    expect(result.summary).toBe('Test')
    expect(result.flashcards).toEqual([])
    expect(result.quiz).toEqual([])
  })

  it('should parse markdown-wrapped JSON', () => {
    const input = '```json\n{"summary": "Test from markdown"}\n```'
    const result = parseAIResponse(input)
    
    expect(result.summary).toBe('Test from markdown')
  })

  it('should throw on completely invalid input', () => {
    const input = 'This is not JSON at all'
    expect(() => parseAIResponse(input)).toThrow()
  })

  it('should throw on AI apology without JSON', () => {
    const input = 'I apologize, but I cannot process this request.'
    expect(() => parseAIResponse(input)).toThrow()
  })

  it('should handle real-world AI response format', () => {
    const input = `{
  "summary": "This document explains the basics of photosynthesis, the process by which plants convert sunlight into energy.",
  "flashcards": [
    {"front": "What is photosynthesis?", "back": "The process by which plants convert light energy into chemical energy"},
    {"front": "What molecule captures light?", "back": "Chlorophyll"}
  ],
  "quiz": [
    {
      "id": 1,
      "question": "What is the primary pigment in photosynthesis?",
      "options": ["Hemoglobin", "Chlorophyll", "Melanin", "Carotene"],
      "correctAnswerIndex": 1,
      "explanation": "Chlorophyll is the green pigment that captures light energy"
    }
  ]
}`
    const result = parseAIResponse(input)
    
    expect(result.summary).toContain('photosynthesis')
    expect(result.flashcards).toHaveLength(2)
    expect(result.quiz[0].correctAnswerIndex).toBe(1)
  })
})
