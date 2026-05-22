import React, { useState, useRef } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'

export const BrandAssetsMedia = ({
  logo,
  setLogo,
  logoPreview,
  setLogoPreview,
  portfolioImages,
  setPortfolioImages,
  maxPortfolioImages = 10,
}) => {
  const [logoError, setLogoError] = useState('')
  const [portfolioError, setPortfolioError] = useState('')
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [isDraggingPortfolio, setIsDraggingPortfolio] = useState(false)
  const logoInputRef = useRef(null)
  const portfolioInputRef = useRef(null)

  const processLogoFile = (file) => {
    if (!file) return

    setLogoError('')

    if (!file.type.startsWith('image/')) {
      setLogoError('Please upload an image file')
      return
    }

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setLogo(file)
    setLogoPreview(previewUrl)
  }

  const handleLogoUpload = (event) => {
    const files = event.target.files
    if (files && files.length > 1) {
      setLogoError('Only one logo file is allowed. Please select a single image.')
      return
    }
    const file = files?.[0]
    processLogoFile(file)
    // Reset input so same file can be selected again
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleLogoDrop = (e) => {
    e.preventDefault()
    setIsDraggingLogo(false)
    const files = e.dataTransfer.files
    if (files && files.length > 1) {
      setLogoError('Only one logo file is allowed. Please drop a single image.')
      return
    }
    const file = files?.[0]
    processLogoFile(file)
  }

  const handleLogoDragOver = (e) => {
    e.preventDefault()
    setIsDraggingLogo(true)
  }

  const handleLogoDragLeave = (e) => {
    e.preventDefault()
    setIsDraggingLogo(false)
  }

  const removeLogo = () => {
    setLogo(null)
    setLogoError('')
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
      setLogoPreview(null)
    }
  }

  const processPortfolioFiles = (files) => {
    if (!files.length) return

    setPortfolioError('')

    const remainingSlots = maxPortfolioImages - portfolioImages.length
    const filesToAdd = Array.from(files).slice(0, remainingSlots)

    if (files.length > remainingSlots) {
      setPortfolioError(`You can only upload ${maxPortfolioImages} portfolio images in total. ${files.length - remainingSlots} file(s) were not added.`)
    }

    const validFiles = []
    const invalidFiles = []

    filesToAdd.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(file.name)
        return
      }

      const preview = URL.createObjectURL(file)
      validFiles.push({ id: `${file.name}-${Date.now()}`, file, preview })
    })

    if (invalidFiles.length > 0) {
      setPortfolioError(`${invalidFiles.length} file(s) were not image files: ${invalidFiles.join(', ')}`)
    }

    if (validFiles.length) {
      setPortfolioImages((prev) => [...prev, ...validFiles])
    }
  }

  const handlePortfolioUpload = (event) => {
    const files = event.target.files
    processPortfolioFiles(files)
  }

  const handlePortfolioDrop = (e) => {
    e.preventDefault()
    setIsDraggingPortfolio(false)
    const files = e.dataTransfer.files
    processPortfolioFiles(files)
  }

  const handlePortfolioDragOver = (e) => {
    e.preventDefault()
    setIsDraggingPortfolio(true)
  }

  const handlePortfolioDragLeave = (e) => {
    e.preventDefault()
    setIsDraggingPortfolio(false)
  }

  const removePortfolioImage = (id) => {
    setPortfolioImages((prev) => {
      const updated = prev.filter((item) => {
        if (item.id === id && item.preview) {
          URL.revokeObjectURL(item.preview)
        }
        return item.id !== id
      })
      return updated
    })
  }

  return (
    <div className='space-y-6 max-w-2xl mx-auto w-full'>
      <section className='pb-6 border-b-2 border-gray-200'>
        <h3 className='text-sm font-semibold text-primary-dark mb-2'>Studio Logo</h3>
        <p className='text-xs text-text-muted mb-4'>Upload your primary studio logo (PNG, JPG, SVG).</p>

        <div className='space-y-4'>
          {logoPreview && (
          <div className='relative w-full h-32 border-2 border-gray-200 rounded-lg bg-white flex items-center justify-center'>
            <img src={logoPreview} alt='Studio logo' className='max-w-full max-h-full object-contain p-3' />
            <button
              type='button'
              onClick={removeLogo}
              className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        )}

          {!logoPreview ? (
            <div
              onDrop={handleLogoDrop}
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
              onClick={() => logoInputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDraggingLogo
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input
                ref={logoInputRef}
                type='file'
                className='hidden'
                accept='image/*'
                onChange={handleLogoUpload}
              />
              <Upload className='w-8 h-8 text-gray-400 mb-1' />
              <p className='text-xs text-gray-600'>
                Click or drag to upload logo
              </p>
            </div>
          ) : null}

          {logoError && (
            <div className='flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              <span>{logoError}</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className='flex items-center justify-between mb-2'>
          <div>
            <h3 className='text-sm font-semibold text-primary-dark'>Portfolio Gallery</h3>
            <p className='text-xs text-text-muted'>Add up to {maxPortfolioImages} photos to showcase your best work.</p>
          </div>
          <span className='text-xs text-gray-500'>
            {portfolioImages.length}/{maxPortfolioImages} uploaded
          </span>
        </div>

        <div className='space-y-4'>
          {portfolioImages.length > 0 && (
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            {portfolioImages.map((item) => (
              <div key={item.id} className='relative h-32 border border-gray-200 rounded-lg overflow-hidden group'>
                <img src={item.preview} alt='Portfolio' className='w-full h-full object-cover' />
                <button
                  type='button'
                  onClick={() => removePortfolioImage(item.id)}
                  className='absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                  aria-label='Remove image'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
            ))}
          </div>
        )}

          {portfolioImages.length === 0 ? (
            <div
              onDrop={handlePortfolioDrop}
              onDragOver={handlePortfolioDragOver}
              onDragLeave={handlePortfolioDragLeave}
              onClick={() => portfolioInputRef.current?.click()}
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                isDraggingPortfolio
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }`}
            >
              <input
                ref={portfolioInputRef}
                type='file'
                className='hidden'
                accept='image/*'
                multiple
                onChange={handlePortfolioUpload}
              />
              <Upload className='w-8 h-8 text-gray-400 mb-1' />
              <p className='text-xs text-gray-600'>
                Click or drag to add photos
              </p>
              <p className='text-[10px] text-gray-400 mt-1'>JPEG, PNG</p>
            </div>
          ) : portfolioImages.length < maxPortfolioImages && (
            <div className='flex items-center justify-end'>
              <button
                type='button'
                onClick={() => portfolioInputRef.current?.click()}
                className='px-4 py-2 text-xs font-medium bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors'
              >
                Upload More
              </button>
              <input
                ref={portfolioInputRef}
                type='file'
                className='hidden'
                accept='image/*'
                multiple
                onChange={handlePortfolioUpload}
              />
            </div>
          )}

          {portfolioError && (
            <div className='flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2'>
              <AlertCircle className='w-4 h-4 shrink-0' />
              <span>{portfolioError}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}


