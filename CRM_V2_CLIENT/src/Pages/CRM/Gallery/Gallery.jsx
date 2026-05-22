import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { 
  Upload, 
  FolderPlus, 
  Folder, 
  Trash2, 
  Move, 
  Search, 
  CheckSquare, 
  Square,
  X,
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { getEventImages, uploadImages, batchUploadImages, searchImages } from '../../../services/galleryService'
import { Error } from '../../../Components/Error'
import { Success } from '../../../Components/Success'
import { Skeleton } from '../../../Components/Skeleton'
import { useFeatures } from '../../../hooks/useFeatures'

export const Gallery = () => {
  const { eventId } = useParams()
  const { isFeatureAvailable } = useFeatures()
  const fileInputRef = useRef(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [targetFolder, setTargetFolder] = useState('')
  const [errorMessage, setErrorMessage] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [currentFolder, setCurrentFolder] = useState('') // Current folder filter

  // Group images by folder
  const groupedImages = images.reduce((acc, img) => {
    const folder = img.folderName || 'Root'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(img)
    return acc
  }, {})

  const folders = Object.keys(groupedImages).sort()
  const displayedImages = currentFolder 
    ? (groupedImages[currentFolder] || [])
    : images

  useEffect(() => {
    loadImages()
  }, [eventId])

  const loadImages = async () => {
    try {
      setLoading(true)
      setErrorMessage(null)
      const data = await getEventImages(eventId)
      setImages(data || [])
    } catch (error) {
      setErrorMessage(`Failed to load images: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) {
      return
    }

    const imageFiles = selectedFiles.filter((file) => file?.type?.startsWith('image/'))
    const invalidFiles = selectedFiles.filter((file) => !file?.type?.startsWith('image/'))

    if (invalidFiles.length > 0) {
      const rejectedNames = invalidFiles
        .map((file) => file?.name || 'Unnamed file')
        .slice(0, 5)
        .join(', ')
      setErrorMessage(`Only image files are allowed. Rejected: ${rejectedNames}`)
    }

    if (imageFiles.length > 0) {
      handleUpload(imageFiles, invalidFiles.length)
    } else if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async (files, rejectedCount = 0) => {
    if (!files || files.length === 0) return

    try {
      if (!eventId) {
        throw new Error('Project/Event ID is missing. Reload the page and try again.')
      }

      setUploading(true)
      if (rejectedCount === 0) {
        setErrorMessage(null)
      }
      setShowUploadModal(false)

      const eventName = eventId || 'default'
      const eventDate = new Date().toISOString().split('T')[0]

      if (files.length > 20) {
        // Batch upload for large files
        const result = await batchUploadImages(
          files,
          eventName,
          eventDate,
          folderName,
          20,
          (current, total) => {
            setUploadProgress({ current, total })
          }
        )
        const skippedSuffix = rejectedCount > 0 ? ` ${rejectedCount} non-image file(s) were skipped.` : ''
        setSuccessMessage(`Uploaded ${result.totalUploaded} images successfully!${skippedSuffix}`)

        if (result.totalFailed > 0) {
          const firstChunkError = result.results.find((item) => !item.success)?.error
          setErrorMessage(
            `${result.totalFailed} image(s) failed to upload. ${firstChunkError || 'Please retry failed files.'}${skippedSuffix}`
          )
        }
      } else {
        // Regular upload
        await uploadImages(files, eventName, eventDate, folderName)
        const skippedSuffix = rejectedCount > 0 ? ` ${rejectedCount} non-image file(s) were skipped.` : ''
        setSuccessMessage(`Uploaded ${files.length} images successfully!${skippedSuffix}`)
      }

      setFolderName('')
      await loadImages()
    } catch (error) {
      setErrorMessage(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    if (!isFeatureAvailable('ai_features')) {
      setErrorMessage('Semantic search is available on Pro and Pro Max plans.')
      return
    }

    try {
      const results = await searchImages(eventId, searchQuery)
      setSearchResults(results)
    } catch (error) {
      setErrorMessage(`Search failed: ${error.message}`)
    }
  }

  const toggleSelect = (imageId) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedImages.size === displayedImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(displayedImages.map(img => img._id || img.id)))
    }
  }

  const handleMoveToFolder = async () => {
    if (selectedImages.size === 0 || !targetFolder.trim()) {
      setErrorMessage('Please select images and enter a folder name')
      return
    }

    try {
      // TODO: Implement move API endpoint in FastAPI
      setSuccessMessage(`Moving ${selectedImages.size} images to ${targetFolder}...`)
      setShowMoveModal(false)
      setTargetFolder('')
      setSelectedImages(new Set())
      await loadImages()
    } catch (error) {
      setErrorMessage(`Move failed: ${error.message}`)
    }
  }

  const handleDelete = async () => {
    if (selectedImages.size === 0) {
      setErrorMessage('Please select images to delete')
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedImages.size} image(s)?`)) {
      return
    }

    try {
      // TODO: Implement delete API endpoint in FastAPI
      setSuccessMessage(`Deleting ${selectedImages.size} images...`)
      setSelectedImages(new Set())
      await loadImages()
    } catch (error) {
      setErrorMessage(`Delete failed: ${error.message}`)
    }
  }

  const imagesToDisplay = searchResults.length > 0 ? searchResults : displayedImages

  if (loading) {
    return (
      <div className='p-6'>
        <Skeleton />
      </div>
    )
  }

  return (
    <div className='p-6 lg:pl-4 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>Event Gallery</h1>
        <p className='text-gray-600'>Event ID: {eventId}</p>
      </div>

      {/* Messages */}
      {successMessage && (
        <Success message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {errorMessage && (
        <Error message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {/* Toolbar */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
        <div className='flex flex-wrap items-center gap-3'>
          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            disabled={uploading}
            className='flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50'
          >
            <Upload size={18} />
            Upload Images
          </button>

          {/* Folder Operations */}
          {selectedImages.size > 0 && (
            <>
              <button
                onClick={() => setShowMoveModal(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Move size={18} />
                Move ({selectedImages.size})
              </button>
              <button
                onClick={handleDelete}
                className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
              >
                <Trash2 size={18} />
                Delete ({selectedImages.size})
              </button>
            </>
          )}

          {/* Search */}
          <div className='flex-1 flex items-center gap-2 max-w-md'>
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder='Search images by text...'
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark'
            />
            <button
              onClick={handleSearch}
              disabled={!isFeatureAvailable('ai_features')}
              className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors'
            >
              <Search size={18} />
            </button>
          </div>

          {/* View Mode */}
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-light text-primary-dark' : 'bg-gray-100'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-light text-primary-dark' : 'bg-gray-100'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Folder Navigation */}
        {folders.length > 0 && (
          <div className='mt-4 flex items-center gap-2 flex-wrap'>
            <button
              onClick={() => setCurrentFolder('')}
              className={`px-3 py-1 rounded-lg text-sm ${
                currentFolder === '' 
                  ? 'bg-primary-dark text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => setCurrentFolder(folder)}
                className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${
                  currentFolder === folder
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Folder size={14} />
                {folder}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress.total > 0 && (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium'>Uploading images...</span>
            <span className='text-sm text-gray-600'>
              {uploadProgress.current} / {uploadProgress.total}
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-primary-dark h-2 rounded-full transition-all'
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Images Grid/List */}
      {imagesToDisplay.length === 0 ? (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center'>
          <ImageIcon size={48} className='mx-auto text-gray-400 mb-4' />
          <p className='text-gray-600 mb-4'>No images found</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className='px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors'
          >
            Upload Images
          </button>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
          {/* Select All */}
          <div className='mb-4 flex items-center justify-between'>
            <button
              onClick={toggleSelectAll}
              className='flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900'
            >
              {selectedImages.size === displayedImages.length ? (
                <CheckSquare size={18} className='text-primary-dark' />
              ) : (
                <Square size={18} />
              )}
              {selectedImages.size > 0 
                ? `${selectedImages.size} selected`
                : 'Select All'}
            </button>
            <span className='text-sm text-gray-600'>
              {imagesToDisplay.length} image{imagesToDisplay.length !== 1 ? 's' : ''}
            </span>
          </div>

          {viewMode === 'grid' ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
              {imagesToDisplay.map((image) => {
                const isSelected = selectedImages.has(image._id || image.id)
                return (
                  <div
                    key={image._id || image.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary-dark ring-2 ring-primary-light' : 'border-gray-200'
                    }`}
                    onClick={() => toggleSelect(image._id || image.id)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.filename}
                      className='w-full h-48 object-cover'
                      loading='lazy'
                    />
                    <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center'>
                      {isSelected && (
                        <div className='absolute top-2 right-2 bg-primary-dark text-white rounded-full p-1'>
                          <CheckSquare size={20} />
                        </div>
                      )}
                    </div>
                    {image.folderName && (
                      <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate'>
                        {image.folderName}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className='space-y-2'>
              {imagesToDisplay.map((image) => {
                const isSelected = selectedImages.has(image._id || image.id)
                return (
                  <div
                    key={image._id || image.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-primary-dark bg-primary-light/10' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleSelect(image._id || image.id)}
                  >
                    <div className='relative'>
                      <img
                        src={image.image_url}
                        alt={image.filename}
                        className='w-24 h-24 object-cover rounded'
                        loading='lazy'
                      />
                      {isSelected && (
                        <div className='absolute top-1 right-1 bg-primary-dark text-white rounded-full p-0.5'>
                          <CheckSquare size={16} />
                        </div>
                      )}
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-gray-900'>{image.filename}</p>
                      {image.folderName && (
                        <p className='text-sm text-gray-600 flex items-center gap-1'>
                          <Folder size={12} />
                          {image.folderName}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold'>Upload Images</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Folder Name (optional)
                </label>
                <input
                  type='text'
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder='Enter folder name'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Images (supports 100+ images)
                </label>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={handleFileSelect}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg'
                />
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-bold'>Move to Folder</h2>
              <button
                onClick={() => setShowMoveModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={24} />
              </button>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Target Folder
                </label>
                <input
                  type='text'
                  value={targetFolder}
                  onChange={(e) => setTargetFolder(e.target.value)}
                  placeholder='Enter folder name'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark'
                />
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => setShowMoveModal(false)}
                  className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveToFolder}
                  className='flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary'
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

