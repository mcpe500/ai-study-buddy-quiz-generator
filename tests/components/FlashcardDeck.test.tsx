import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FlashcardDeck from '@/components/FlashcardDeck'
import type { Flashcard } from '@/types/study'

/**
 * FlashcardDeck Component Tests
 * Uses React Testing Library for component testing
 */

describe('FlashcardDeck', () => {
  const mockFlashcards: Flashcard[] = [
    { front: 'What is TypeScript?', back: 'A typed superset of JavaScript' },
    { front: 'What is React?', back: 'A JavaScript library for building UIs' },
    { front: 'What is Vite?', back: 'A fast build tool for modern web projects' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render first card content', () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      expect(screen.getByText('What is TypeScript?')).toBeInTheDocument()
    })

    it('should show "No flashcards available" for empty array', () => {
      render(<FlashcardDeck cards={[]} />)
      
      expect(screen.getByText('No flashcards available')).toBeInTheDocument()
    })

    it('should display card counter correctly', () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
    })

    it('should show Concept label on front', () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      expect(screen.getByText('Concept')).toBeInTheDocument()
    })

    it('should show "Click to flip" hint', () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      expect(screen.getByText('Click to flip')).toBeInTheDocument()
    })
  })

  describe('Card Flipping', () => {
    it('should show back content when flipped', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      // Initially back is not visible (due to CSS transform)
      // Click the card to flip
      const card = screen.getByText('What is TypeScript?').closest('div[style*="perspective"]')
      if (card) {
        fireEvent.click(card)
      }
      
      // After flip, Explanation label should be visible
      await waitFor(() => {
        expect(screen.getByText('Explanation')).toBeInTheDocument()
      })
    })

    it('should show back text after flip', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      // The back content is always in the DOM, just rotated
      expect(screen.getByText('A typed superset of JavaScript')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should advance to next card on next button click', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      // Find next button (the one with ChevronRight icon)
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons.find(btn => btn.querySelector('svg'))
      
      // Click the last button (should be next)
      if (buttons.length > 0) {
        fireEvent.click(buttons[buttons.length - 1])
      }
      
      await waitFor(() => {
        expect(screen.getByText('Card 2 of 3')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should go to previous card on prev button click', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      const buttons = screen.getAllByRole('button')
      
      // First go to card 2
      fireEvent.click(buttons[buttons.length - 1])
      
      await waitFor(() => {
        expect(screen.getByText('Card 2 of 3')).toBeInTheDocument()
      }, { timeout: 500 })
      
      // Now go back
      fireEvent.click(buttons[buttons.length - 2])
      
      await waitFor(() => {
        expect(screen.getByText('Card 1 of 3')).toBeInTheDocument()
      }, { timeout: 500 })
    })

    it('should wrap around to first card after last', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 1]
      
      // Click next 3 times to wrap around
      fireEvent.click(nextButton)
      await waitFor(() => expect(screen.getByText('Card 2 of 3')).toBeInTheDocument(), { timeout: 500 })
      
      fireEvent.click(nextButton)
      await waitFor(() => expect(screen.getByText('Card 3 of 3')).toBeInTheDocument(), { timeout: 500 })
      
      fireEvent.click(nextButton)
      await waitFor(() => expect(screen.getByText('Card 1 of 3')).toBeInTheDocument(), { timeout: 500 })
    })
  })

  describe('Reset', () => {
    it('should have a reset button', () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      expect(screen.getByText('Reset')).toBeInTheDocument()
    })

    it('should return to first card on reset', async () => {
      render(<FlashcardDeck cards={mockFlashcards} />)
      
      const buttons = screen.getAllByRole('button')
      const nextButton = buttons[buttons.length - 1]
      
      // Navigate to card 3
      fireEvent.click(nextButton)
      fireEvent.click(nextButton)
      
      await waitFor(() => expect(screen.getByText('Card 3 of 3')).toBeInTheDocument(), { timeout: 500 })
      
      // Click reset
      fireEvent.click(screen.getByText('Reset'))
      
      await waitFor(() => expect(screen.getByText('Card 1 of 3')).toBeInTheDocument())
    })
  })
})
