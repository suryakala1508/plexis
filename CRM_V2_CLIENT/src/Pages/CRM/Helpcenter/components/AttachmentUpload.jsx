import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, FileText, Image, Lock } from "lucide-react"

export const AttachmentUpload = ({ hint, files, onFilesChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrag = e => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }

  const handleDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    onFilesChange([...files, ...droppedFiles])
  }

  const handleFileSelect = e => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      onFilesChange([...files, ...selectedFiles])
    }
  }

  const removeFile = index => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  const getFileIcon = file => {
    if (file.type.startsWith("image/")) {
      return <Image className="w-4 h-4 text-primary" />
    }
    return <FileText className="w-4 h-4 text-primary" />
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-900">Attachments</label>

      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          borderColor: isDragging
            ? "hsl(var(--primary))"
            : "hsl(var(--border))",
          backgroundColor: isDragging
            ? "hsl(var(--primary) / 0.05)"
            : "hsl(var(--background))"
        }}
        className="relative cursor-pointer rounded-lg border-2 border-dashed p-6 transition-all hover:border-primary hover:bg-gray-50"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.log"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
            <Upload className="w-6 h-6 text-primary-dark" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG, PDF, DOC up to 10MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* Helper text */}
      <motion.p
        key={hint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-slate-500 flex items-center gap-2"
      >
        <span className="inline-block w-1 h-1 rounded-full bg-primary-dark" />
        {hint}
      </motion.p>

      {/* Uploaded files */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-slate-200"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    removeFile(index)
                  }}
                  className="p-1 rounded-md hover:bg-destructive/10 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Lock className="w-3 h-3" />
        <span>
          Files are securely encrypted and visible only to support staff.
        </span>
      </div>
    </div>
  )
}
