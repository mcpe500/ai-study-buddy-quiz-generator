import { useState } from 'react'
import { CheckCircle, XCircle, HelpCircle, ArrowRight, Award } from 'lucide-react'
import type { QuizQuestion } from '@/types/study'

interface QuizModeProps {
  questions: QuizQuestion[]
  onComplete?: (score: number, total: number) => void
}

export default function QuizMode({ questions, onComplete }: QuizModeProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [showResults, setShowResults] = useState(false)

  const question = questions[currentQuestionIdx]

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return
    setSelectedOption(index)
    setIsAnswered(true)
    if (index === question.correctAnswerIndex) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    } else {
      setShowResults(true)
      onComplete?.(score + (selectedOption === question.correctAnswerIndex ? 1 : 0), questions.length)
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIdx(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setScore(0)
    setShowResults(false)
  }

  if (!question) {
    return <div className="text-center text-slate-500">No quiz questions available</div>
  }

  if (showResults) {
    const finalScore = score + (selectedOption === question?.correctAnswerIndex ? 1 : 0)
    const percentage = Math.round((finalScore / questions.length) * 100)
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-100 p-8 text-center">
        <div className="mb-6 inline-flex p-4 rounded-full bg-yellow-100 text-yellow-600">
          <Award size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Quiz Complete!</h2>
        <p className="text-slate-600 mb-8">You scored {finalScore} out of {questions.length}</p>
        
        <div className="mb-8">
           <div className="text-6xl font-black text-indigo-600 mb-2">{percentage}%</div>
           <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Understanding Level</p>
        </div>

        <button 
          onClick={handleRestart} 
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
          <span>Question {currentQuestionIdx + 1}</span>
          <span>{questions.length} Total</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-semibold text-slate-800 mb-6 leading-relaxed">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group "
              
              if (isAnswered) {
                if (idx === question.correctAnswerIndex) {
                  btnClass += "border-green-500 bg-green-50 text-green-900"
                } else if (idx === selectedOption) {
                  btnClass += "border-red-500 bg-red-50 text-red-900"
                } else {
                  btnClass += "border-slate-100 opacity-50"
                }
              } else {
                btnClass += "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
              }

              return (
                <button 
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={btnClass}
                  disabled={isAnswered}
                >
                  <span className="font-medium">{option}</span>
                  {isAnswered && idx === question.correctAnswerIndex && <CheckCircle size={20} className="text-green-600" />}
                  {isAnswered && idx === selectedOption && idx !== question.correctAnswerIndex && <XCircle size={20} className="text-red-600" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Explanation Section */}
        {isAnswered && (
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-100">
            <div className="flex gap-3 mb-2">
              <HelpCircle className="text-indigo-600 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-bold text-indigo-900">Explanation</h4>
                <p className="text-indigo-800 mt-1 leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                {currentQuestionIdx === questions.length - 1 ? "Finish Quiz" : "Next Question"}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
