import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BrainCircuit, LogOut, FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useTRPC } from '@/integrations/trpc/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import AuthForms from '@/components/AuthForms'
import FileUpload from '@/components/FileUpload'

export const Route = createFileRoute('/')({
  component: HomePage,
})

// Session management
function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  useEffect(() => {
    const stored = localStorage.getItem('sessionId')
    if (stored) setSessionId(stored)
  }, [])
  
  const saveSession = (id: string) => {
    localStorage.setItem('sessionId', id)
    setSessionId(id)
  }
  
  const clearSession = () => {
    localStorage.removeItem('sessionId')
    setSessionId(null)
  }
  
  return { sessionId, saveSession, clearSession }
}

function HomePage() {
  const trpc = useTRPC()
  const navigate = useNavigate()
  const { sessionId, saveSession, clearSession } = useSession()
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authError, setAuthError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Check if user is logged in
  const { data: userData, isLoading: isCheckingAuth } = useQuery(
    trpc.auth.me.queryOptions({ sessionId: sessionId || undefined })
  )

  // Get document history
  const { data: documents, refetch: refetchDocs } = useQuery({
    ...trpc.study.history.queryOptions({ sessionId: sessionId || '' }),
    enabled: !!sessionId && !!userData?.user,
  })

  // Auth mutations
  const loginMutation = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: (data) => {
        saveSession(data.sessionId)
        setAuthError(null)
      },
      onError: (error) => {
        setAuthError(error.message)
      },
    })
  )

  const registerMutation = useMutation(
    trpc.auth.register.mutationOptions({
      onSuccess: (data) => {
        saveSession(data.sessionId)
        setAuthError(null)
      },
      onError: (error) => {
        setAuthError(error.message)
      },
    })
  )

  const logoutMutation = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: () => {
        clearSession()
      },
    })
  )

  // Upload mutation
  const uploadMutation = useMutation(
    trpc.study.upload.mutationOptions({
      onSuccess: (data) => {
        setIsUploading(false)
        refetchDocs()
        // Navigate to study page
        navigate({ to: '/study/$id', params: { id: data.documentId } })
      },
      onError: () => {
        setIsUploading(false)
      },
    })
  )

  const handleAuth = async (email: string, password: string) => {
    setAuthError(null)
    if (authMode === 'login') {
      await loginMutation.mutateAsync({ email, password })
    } else {
      await registerMutation.mutateAsync({ email, password })
    }
  }

  const handleLogout = () => {
    if (sessionId) {
      logoutMutation.mutate({ sessionId })
    }
  }

  const handleFileUpload = (base64: string, mimeType: string, fileName: string) => {
    if (!sessionId) return
    setIsUploading(true)
    uploadMutation.mutate({ sessionId, fileName, mimeType, fileData: base64 })
  }

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    )
  }

  const isLoggedIn = !!userData?.user

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <BrainCircuit size={28} strokeWidth={2.5} />
            <span className="font-bold text-xl tracking-tight">AI Study Buddy</span>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{userData.user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {!isLoggedIn ? (
            // Auth View
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
              <div className="text-center space-y-4 max-w-lg">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  Master any subject <br />
                  <span className="text-indigo-600">in seconds.</span>
                </h1>
                <p className="text-lg text-slate-600">
                  Upload your notes or PDFs. We'll generate a summary, flashcards, and a quiz.
                </p>
              </div>
              
              <AuthForms
                mode={authMode}
                onSubmit={handleAuth}
                onToggleMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                error={authError}
                isLoading={loginMutation.isPending || registerMutation.isPending}
              />
            </div>
          ) : (
            // Dashboard View
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-slate-500">Upload a new document or continue studying</p>
              </div>

              {/* Upload Section */}
              <FileUpload onFileUpload={handleFileUpload} isLoading={isUploading} />

              {/* Document History */}
              {documents && documents.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Documents</h3>
                  <div className="grid gap-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => doc.status === 'completed' && navigate({ to: '/study/$id', params: { id: doc.id } })}
                        className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 ${
                          doc.status === 'completed' ? 'cursor-pointer hover:border-indigo-300' : ''
                        }`}
                      >
                        <div className="p-3 bg-slate-100 rounded-lg">
                          <FileText size={24} className="text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{doc.fileName}</p>
                          <p className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <div>
                          {doc.status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle size={16} /> Ready
                            </span>
                          )}
                          {doc.status === 'processing' && (
                            <span className="flex items-center gap-1 text-indigo-600 text-sm font-medium">
                              <Loader2 size={16} className="animate-spin" /> Processing
                            </span>
                          )}
                          {doc.status === 'failed' && (
                            <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                              <AlertCircle size={16} /> Failed
                            </span>
                          )}
                          {doc.status === 'pending' && (
                            <span className="flex items-center gap-1 text-slate-500 text-sm font-medium">
                              <Clock size={16} /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
