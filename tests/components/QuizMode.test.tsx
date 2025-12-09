import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QuizMode from '@/components/QuizMode'
import type { QuizQuestion } from '@/types/study'

/**
 * QuizMode Component Tests
 * Uses React Testing Library for component testing
 */

describe('QuizMode', () => {
  const mockQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswerIndex: 1,
      explanation: '2 + 2 equals 4 in basic arithmetic',
    },
    {
      id: 2,
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswerIndex: 2,
      explanation: 'Paris is the capital of France',
    },
    {
      id: 3,
      question: 'Which language is TypeScript based on?',
      options: ['Python', 'Java', 'JavaScript', 'C++'],
      correctAnswerIndex: 2,
      explanation: 'TypeScript is a typed superset of JavaScript',
    },
  ]

  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render question text', () => {
      render(<QuizMode questions={mockQuestions} />)
      
      expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
    })

    it('should render all options', () => {
      render(<QuizMode questions={mockQuestions} />)
      
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('should show "No quiz questions available" for empty array', () => {
      render(<QuizMode questions={[]} />)
      
      expect(screen.getByText('No quiz questions available')).toBeInTheDocument()
    })

    it('should display progress indicator', () => {
      render(<QuizMode questions={mockQuestions} />)
      
      expect(screen.getByText('Question 1')).toBeInTheDocument()
      expect(screen.getByText('3 Total')).toBeInTheDocument()
    })
  })

  describe('Answer Selection', () => {
    it('should show explanation after selecting an answer', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Click on an option
      fireEvent.click(screen.getByText('4'))
      
      await waitFor(() => {
        expect(screen.getByText('Explanation')).toBeInTheDocument()
        expect(screen.getByText('2 + 2 equals 4 in basic arithmetic')).toBeInTheDocument()
      })
    })

    it('should disable options after answering', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      fireEvent.click(screen.getByText('4'))
      
      await waitFor(() => {
        const optionButtons = screen.getAllByRole('button').filter(btn => 
          btn.textContent === '3' || 
          btn.textContent === '4' || 
          btn.textContent === '5' || 
          btn.textContent === '6'
        )
        
        optionButtons.forEach(btn => {
          expect(btn).toBeDisabled()
        })
      })
    })

    it('should show Next Question button after answering', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      fireEvent.click(screen.getByText('4'))
      
      await waitFor(() => {
        expect(screen.getByText('Next Question')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should advance to next question', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Answer first question
      fireEvent.click(screen.getByText('4'))
      
      await waitFor(() => {
        expect(screen.getByText('Next Question')).toBeInTheDocument()
      })
      
      // Click next
      fireEvent.click(screen.getByText('Next Question'))
      
      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
        expect(screen.getByText('Question 2')).toBeInTheDocument()
      })
    })

    it('should show Finish Quiz on last question', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Answer Q1
      fireEvent.click(screen.getByText('4'))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      // Answer Q2
      await waitFor(() => fireEvent.click(screen.getByText('Paris')))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      // Answer Q3
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript')))
      
      await waitFor(() => {
        expect(screen.getByText('Finish Quiz')).toBeInTheDocument()
      })
    })
  })

  describe('Completion', () => {
    it('should show results screen after finishing', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Answer all questions correctly
      fireEvent.click(screen.getByText('4'))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('Paris')))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript')))
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(screen.getByText('Quiz Complete!')).toBeInTheDocument()
      })
    })

    it('should display final score', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Answer all correctly (3/3)
      fireEvent.click(screen.getByText('4'))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('Paris')))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript')))
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(screen.getByText(/You scored 3 out of 3/)).toBeInTheDocument()
        expect(screen.getByText('100%')).toBeInTheDocument()
      })
    })

    it('should call onComplete callback with score', async () => {
      render(<QuizMode questions={mockQuestions} onComplete={mockOnComplete} />)
      
      // Answer 2 correctly, 1 wrong
      fireEvent.click(screen.getByText('4')) // Correct
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('London'))) // Wrong
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript'))) // Correct
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(2, 3)
      })
    })
  })

  describe('Restart', () => {
    it('should show Try Again button on results screen', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Complete the quiz
      fireEvent.click(screen.getByText('4'))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('Paris')))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript')))
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
    })

    it('should restart quiz when Try Again is clicked', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Complete the quiz
      fireEvent.click(screen.getByText('4'))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('Paris')))
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('JavaScript')))
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('Try Again'))
      
      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
        expect(screen.getByText('Question 1')).toBeInTheDocument()
      })
    })
  })

  describe('Scoring', () => {
    it('should calculate 0% for all wrong answers', async () => {
      render(<QuizMode questions={mockQuestions} />)
      
      // Answer all wrong
      fireEvent.click(screen.getByText('3')) // Wrong
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('London'))) // Wrong
      await waitFor(() => fireEvent.click(screen.getByText('Next Question')))
      
      await waitFor(() => fireEvent.click(screen.getByText('Python'))) // Wrong
      await waitFor(() => fireEvent.click(screen.getByText('Finish Quiz')))
      
      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument()
      })
    })
  })
})
