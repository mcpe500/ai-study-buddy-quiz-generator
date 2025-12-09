import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractTextFromBase64 } from '../src/lib/ai-provider'

// Mock pdf-parse module
vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({
    numpages: 3,
    text: 'This is the extracted text from the PDF document. It contains sample educational content for testing purposes.',
  }),
}))

describe('extractTextFromBase64', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PDF extraction', () => {
    it('should extract text from a PDF base64 string', async () => {
      // Create a simple base64 string (this would be a real PDF in production)
      const base64Data = Buffer.from('dummy pdf content').toString('base64')
      const mimeType = 'application/pdf'

      const result = await extractTextFromBase64(base64Data, mimeType)

      expect(result).toBe('This is the extracted text from the PDF document. It contains sample educational content for testing purposes.')
    })

    it('should handle PDF mime type with charset', async () => {
      const base64Data = Buffer.from('dummy pdf content').toString('base64')
      const mimeType = 'application/pdf; charset=utf-8'

      const result = await extractTextFromBase64(base64Data, mimeType)

      expect(result).toContain('extracted text')
    })

    it('should truncate very long PDF text', async () => {
      // Mock a very long text response
      const longText = 'A'.repeat(60000)
      const pdfParse = (await import('pdf-parse')).default as unknown as ReturnType<typeof vi.fn>
      pdfParse.mockResolvedValueOnce({
        numpages: 100,
        text: longText,
      })

      const base64Data = Buffer.from('dummy pdf content').toString('base64')
      const mimeType = 'application/pdf'

      const result = await extractTextFromBase64(base64Data, mimeType)

      expect(result.length).toBeLessThanOrEqual(50100) // 50000 + truncation message
      expect(result).toContain('[Content truncated due to length...]')
    })

    it('should throw error when PDF parsing fails', async () => {
      const pdfParse = (await import('pdf-parse')).default as unknown as ReturnType<typeof vi.fn>
      pdfParse.mockRejectedValueOnce(new Error('Invalid PDF structure'))

      const base64Data = Buffer.from('invalid pdf').toString('base64')
      const mimeType = 'application/pdf'

      await expect(extractTextFromBase64(base64Data, mimeType)).rejects.toThrow('Failed to parse PDF')
    })
  })

  describe('Text file extraction', () => {
    it('should decode base64 text files', async () => {
      const originalText = 'Hello, this is a plain text document!'
      const base64Data = Buffer.from(originalText).toString('base64')
      const mimeType = 'text/plain'

      const result = await extractTextFromBase64(base64Data, mimeType)

      expect(result).toBe(originalText)
    })

    it('should handle text/html mime type', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>'
      const base64Data = Buffer.from(htmlContent).toString('base64')
      const mimeType = 'text/html'

      const result = await extractTextFromBase64(base64Data, mimeType)

      expect(result).toBe(htmlContent)
    })
  })

  describe('Image file handling', () => {
    it('should throw error for image files (no OCR support)', async () => {
      const base64Data = Buffer.from('fake image data').toString('base64')
      const mimeType = 'image/png'

      await expect(extractTextFromBase64(base64Data, mimeType)).rejects.toThrow('Image documents require OCR')
    })

    it('should throw error for JPEG images', async () => {
      const base64Data = Buffer.from('fake jpeg data').toString('base64')
      const mimeType = 'image/jpeg'

      await expect(extractTextFromBase64(base64Data, mimeType)).rejects.toThrow('Image documents require OCR')
    })
  })
})
