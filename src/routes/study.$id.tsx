import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { BrainCircuit, ArrowLeft, BookOpen, GraduationCap, Layout, Loader2, AlertCircle } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import FlashcardDeck from '@/components/FlashcardDeck'
import QuizMode from '@/components/QuizMode'
import { ContentType } from '@/types/study'

export const Route = createFileRoute('/study/$id')({
  component: StudyPage,
})

function StudyPage() {
  const { id } = useParams({ from: '/study/$id' })
  const navigate = useNavigate()
  const trpc = useTRPC()
  
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ContentType>(ContentType.SUMMARY)
  
  useEffect(() => {
    const stored = localStorage.getItem('sessionId')
    if (stored) setSessionId(stored)
    else navigate({ to: '/' })
  }, [navigate])

  // Poll for document status
  const { data: statusData, isLoading: isCheckingStatus } = useQuery({
    ...trpc.study.status.queryOptions({ sessionId: sessionId || '', documentId: id }),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'pending' || status === 'processing') return 3000
      return false
    },
  })

  // Get study material
  const { data: materialData, isLoading: isLoadingMaterial } = useQuery({
    ...trpc.study.getMaterial.queryOptions({ sessionId: sessionId || '', documentId: id }),
    enabled: !!sessionId && statusData?.status === 'completed',
  })

  // Save quiz progress
  const saveProgressMutation = useMutation(
    trpc.study.saveProgress.mutationOptions()
  )

  const handleQuizComplete = (score: number, total: number) => {
    if (sessionId && materialData?.studyMaterial?.id) {
      saveProgressMutation.mutate({
        sessionId,
        studyMaterialId: materialData.studyMaterial.id,
        score,
        totalQuestions: total,
      })
    }
  }

  const isLoading = isCheckingStatus || isLoadingMaterial
  const isProcessing = statusData?.status === 'pending' || statusData?.status === 'processing'
  const hasFailed = statusData?.status === 'failed'
  const isReady = statusData?.status === 'completed' && materialData?.studyMaterial

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <BrainCircuit size={28} strokeWidth={2.5} />
            <span className="font-bold text-xl tracking-tight">AI Study Buddy</span>
          </div>
          <button
            onClick={() => navigate({ to: '/' })}
            className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <Loader2 className="animate-spin text-indigo-600" size={48} />
              <p className="text-slate-600">Loading study material...</p>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="p-6 bg-indigo-100 rounded-full">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Processing Your Document</h2>
              <p className="text-slate-600 text-center max-w-md">
                Our AI is analyzing your document and generating study materials. 
                This may take a few minutes depending on the size of your file.
              </p>
              <div className="w-64 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-600 h-2 rounded-full w-1/2 animate-pulse" />
              </div>
            </div>
          )}

          {hasFailed && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
              <div className="p-6 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Processing Failed</h2>
              <p className="text-red-600">{statusData.errorMessage || 'An unknown error occurred'}</p>
              <button
                onClick={() => navigate({ to: '/' })}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {isReady && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{materialData.document.fileName}</h2>
                <p className="text-slate-500">Study Session Active</p>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
                <button
                  onClick={() => setActiveTab(ContentType.SUMMARY)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${activeTab === ContentType.SUMMARY
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Layout size={18} /> Summary
                </button>
                <button
                  onClick={() => setActiveTab(ContentType.FLASHCARDS)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${activeTab === ContentType.FLASHCARDS
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <BookOpen size={18} /> Flashcards
                </button>
                <button
                  onClick={() => setActiveTab(ContentType.QUIZ)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                    ${activeTab === ContentType.QUIZ
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <GraduationCap size={18} /> Quiz
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === ContentType.SUMMARY && materialData.studyMaterial && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="bg-indigo-100 p-1 rounded text-indigo-600 text-xs uppercase tracking-wide">ELI12</span>
                      Simple Explanation
                    </h3>
                    <div className="prose prose-slate lg:prose-lg max-w-none text-slate-700 leading-relaxed">
                      {materialData.studyMaterial.summary?.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === ContentType.FLASHCARDS && materialData.studyMaterial?.flashcards && (
                  <FlashcardDeck cards={materialData.studyMaterial.flashcards} />
                )}

                {activeTab === ContentType.QUIZ && materialData.studyMaterial?.quiz && (
                  <QuizMode 
                    questions={materialData.studyMaterial.quiz} 
                    onComplete={handleQuizComplete}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} AI Study Buddy. Powered by AI.</p>
        </div>
      </footer>
    </div>
  )
}
