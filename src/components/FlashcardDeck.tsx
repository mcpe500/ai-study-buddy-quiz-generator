import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { Flashcard } from '@/types/study'

interface FlashcardDeckProps {
  cards: Flashcard[]
}

export default function FlashcardDeck({ cards }: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleNext = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length)
    }, 200)
  }

  const handlePrev = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }, 200)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const currentCard = cards[currentIndex]

  if (!currentCard) {
    return <div className="text-center text-slate-500">No flashcards available</div>
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4 text-slate-500 text-sm font-medium">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <button 
          onClick={() => { setCurrentIndex(0); setIsFlipped(false) }}
          className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div 
        className="group w-full h-80 cursor-pointer"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-full h-full transition-all duration-500"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div 
            className="absolute w-full h-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
             <span className="absolute top-4 left-4 text-xs font-bold text-indigo-500 uppercase tracking-wider">Concept</span>
             <p className="text-2xl font-semibold text-slate-800">{currentCard.front}</p>
             <p className="absolute bottom-4 text-xs text-slate-400">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full bg-indigo-600 rounded-2xl shadow-lg p-8 flex flex-col items-center justify-center text-center"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <span className="absolute top-4 left-4 text-xs font-bold text-indigo-200 uppercase tracking-wider">Explanation</span>
            <p className="text-xl font-medium text-white">{currentCard.back}</p>
            <p className="absolute bottom-4 text-xs text-indigo-200">Click to flip back</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button 
          onClick={handlePrev}
          className="p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={handleNext}
          className="p-3 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-600"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  )
}
