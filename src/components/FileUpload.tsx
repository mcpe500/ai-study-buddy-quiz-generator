import { useState, useCallback } from 'react'
import { Upload, FileText, Image as ImageIcon, AlertCircle, FileType } from 'lucide-react'

interface FileUploadProps {
  onFileUpload: (base64: string, mimeType: string, fileName: string) => void
  isLoading: boolean
}

export default function FileUpload({ onFileUpload, isLoading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF, DOCX, or Image (JPEG, PNG, WEBP).")
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("File size too large. Please upload a file smaller than 100MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      onFileUpload(base64, file.type, file.name)
    }
    reader.onerror = () => {
      setError("Error reading file.")
    }
    reader.readAsDataURL(file)
  }, [onFileUpload])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
          ${dragActive ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : "border-slate-300 bg-white"}
          ${isLoading ? "opacity-50 pointer-events-none" : "hover:border-indigo-400 hover:bg-slate-50"}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <div className="mb-4 p-4 bg-indigo-100 rounded-full text-indigo-600">
            <Upload size={32} />
          </div>
          <p className="mb-2 text-lg font-semibold text-slate-700">
            <span className="text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-slate-500 mb-6">
            PDF, DOCX, PNG, JPG (Max 100MB)
          </p>
          <div className="flex gap-4 text-xs text-slate-400 flex-wrap justify-center">
             <span className="flex items-center gap-1"><FileText size={14}/> PDFs</span>
             <span className="flex items-center gap-1"><FileType size={14}/> DOCX</span>
             <span className="flex items-center gap-1"><ImageIcon size={14}/> Screenshots</span>
          </div>
        </div>
        <input 
          type="file" 
          className="absolute w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept="application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-pulse">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isLoading && (
         <div className="mt-8 text-center space-y-3">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full w-2/3 animate-pulse"></div>
            </div>
            <p className="text-indigo-600 font-medium animate-pulse">Processing file & generating study material...</p>
         </div>
      )}
    </div>
  )
}
