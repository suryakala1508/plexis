import React, { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'

/**
 * ScreenshotUploader
 * Props:
 *   urls       – string[] current screenshot URLs (controlled)
 *   onChange   – (urls: string[]) => void
 *   onUpload   – async (files: File[]) => string[]   upload function, returns new URLs
 *   disabled   – boolean
 */
const ScreenshotUploader = ({ urls = [], onChange, onUpload, disabled }) => {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    const fileArr = Array.from(files)
    setError('')
    setUploading(true)
    try {
      const newUrls = await onUpload(fileArr)
      onChange([...urls, ...newUrls])
    } catch (e) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (disabled || uploading) return
    handleFiles(e.dataTransfer.files)
  }

  const removeUrl = (idx) => {
    onChange(urls.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Payment Screenshots
        <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
      </label>

      {/* Thumbnail grid */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {urls.map((url, idx) => (
            <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img src={url} alt={`screenshot ${idx + 1}`} className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeUrl(idx)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {!disabled && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-primary-dark hover:bg-gray-50 transition-colors select-none"
        >
          {uploading ? (
            <Loader2 size={16} className="text-primary-dark animate-spin flex-shrink-0" />
          ) : (
            <ImagePlus size={16} className="text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Click or drag images here'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default ScreenshotUploader
