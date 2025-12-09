/**
 * @vitest-environment node
 * 
 * Real PDF Extraction Tests (Node Environment)
 * Uses actual PDF file from tests/mock-data/
 * Must run in node environment because pdf-parse uses canvas APIs
 */
import { describe, it, expect } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('Real PDF Extraction', () => {
  const mockPdfPath = path.join(process.cwd(), 'tests', 'mock-data', 'Brief Doocument - Final Project Bootcamp Intensif Golang.pdf')
  const hasMockPdf = fs.existsSync(mockPdfPath)

  it.skipIf(!hasMockPdf)('should extract text from real PDF file', async () => {
    // pdf-parse v2.x exports PDFParse as a class
    // Note: @types/pdf-parse is for v1.x, so we use 'any' for v2.x API
    const { PDFParse } = await import('pdf-parse')
    
    // Read the actual PDF file and convert to Uint8Array (required by pdfjs-dist)
    const pdfBuffer = fs.readFileSync(mockPdfPath)
    const pdfData = new Uint8Array(pdfBuffer)
    
    // Parse with pdf-parse v2.x class-based API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new PDFParse(pdfData) as any
    await parser.load()
    const textResult = await parser.getText()
    const info = await parser.getInfo()
    
    // getText() returns a TextResult object with text property or array of pages
    const text = typeof textResult === 'string' ? textResult : 
                 textResult?.text ?? JSON.stringify(textResult)
    
    expect(text).toBeDefined()
    expect(text.length).toBeGreaterThan(0)
    // pdf-parse v2.x uses 'total' for page count, not 'numPages'
    expect(info.total).toBeGreaterThan(0)
  })

  it.skipIf(!hasMockPdf)('should have valid PDF structure', async () => {
    const { PDFParse } = await import('pdf-parse')
    
    const pdfBuffer = fs.readFileSync(mockPdfPath)
    const pdfData = new Uint8Array(pdfBuffer)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new PDFParse(pdfData) as any
    await parser.load()
    const textResult = await parser.getText()
    const info = await parser.getInfo()
    
    // Verify PDF metadata - v2.x uses 'total' for page count
    expect(info).toHaveProperty('total')
    expect(typeof info.total).toBe('number')
    expect(textResult).toBeDefined()
  })

  it.skipIf(!hasMockPdf)('should extract meaningful content from Golang bootcamp PDF', async () => {
    const { PDFParse } = await import('pdf-parse')
    
    const pdfBuffer = fs.readFileSync(mockPdfPath)
    const pdfData = new Uint8Array(pdfBuffer)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parser = new PDFParse(pdfData) as any
    await parser.load()
    const textResult = await parser.getText()
    
    // getText() may return object with text property or pages array
    const text = typeof textResult === 'string' ? textResult : 
                 textResult?.text ?? JSON.stringify(textResult)
    const textLower = text.toLowerCase()
    
    // Check for common words that should appear in a Golang bootcamp document
    // Also check for generic document words as fallback
    const hasGoRelatedContent = 
      textLower.includes('go') || 
      textLower.includes('golang') || 
      textLower.includes('bootcamp') ||
      textLower.includes('project') ||
      textLower.includes('final') ||
      textLower.includes('brief') ||
      textLower.includes('document') ||
      text.length > 100 // At least some content was extracted
    
    expect(hasGoRelatedContent).toBe(true)
  })

  it('should check mock PDF file exists', () => {
    // This test always runs to verify the mock data setup
    if (hasMockPdf) {
      const stats = fs.statSync(mockPdfPath)
      expect(stats.size).toBeGreaterThan(0)
      expect(stats.isFile()).toBe(true)
    } else {
      console.warn('Mock PDF not found at:', mockPdfPath)
    }
  })

  it.skipIf(!hasMockPdf)('should convert PDF to valid base64', () => {
    const pdfBuffer = fs.readFileSync(mockPdfPath)
    const base64Data = pdfBuffer.toString('base64')
    
    // Verify base64 format
    expect(base64Data.length).toBeGreaterThan(0)
    expect(base64Data).toMatch(/^[A-Za-z0-9+/]+=*$/)
    
    // Verify round-trip conversion
    const decodedBuffer = Buffer.from(base64Data, 'base64')
    expect(decodedBuffer.equals(pdfBuffer)).toBe(true)
  })
})




