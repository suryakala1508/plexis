import React, { useState, useEffect } from 'react'
import { useUser } from '../../../../contexts/UserContext'
import { PreviewCanvas } from '../../../../Components/PreviewCanvas'
import { ToolsPanel } from '../../../../Components/ToolsPanel'
import { PageSkeleton } from '../../../../Components/Loading'
import { DEFAULT_STUDIO_CONFIG } from '../../../../types/StudioConfig.js'
import { getStudioConfig, updateLeadForm } from '../../../../services/studioService'
import { Share2, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { Success } from '../../../../Components/Success'
import { Error } from '../../../../Components/Error'
import { TourGuide } from '../../../../Components/TourGuide/TourGuide'
import { leadFormTourSteps } from '../../../../Components/TourGuide/steps/leadFormTourSteps'
import { PermissionGate } from '@/Pages/utils/permissions'

export const StudioEditor = () => {
  const { user, studio } = useUser()
  const [zoom, setZoom] = useState(100)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const startTourRef = React.useRef(null)

  // Initialize with studio data from /user endpoint
  const [config, setConfig] = useState({
    ...DEFAULT_STUDIO_CONFIG,
    studioName: studio?.name || DEFAULT_STUDIO_CONFIG.studioName,
    logo: studio?.logo || null,
    bannerImage: studio?.bannerImage || null,
    portfolio: studio?.portfolioImages || []
  })

  const studioSlug = (studio?.name || "yourstudio")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const publicUrl = `${window.location.origin}/${studioSlug}/leadform`;

  // Load studio config and merge with user data
useEffect(() => {
  const loadConfig = async () => {
    if (!studio) {
      setLoading(false)
      return
    }

    // Start with studio data from /user endpoint
    const baseConfig = {
      ...DEFAULT_STUDIO_CONFIG,
      studioName: studio.name || DEFAULT_STUDIO_CONFIG.studioName,
      tagline: studio.tagline || "", // ✅ ADD THIS
      logo: studio.logo || null,
      bannerImage: studio.bannerImage || null,
      backgroundImage: studio.backgroundImage || null, // ✅ ADD THIS
      portfolio: studio.portfolioImages || [],
      youtubeLinks: studio.youtubeLinks || [], // ✅ ADD THIS
      banner: studio.banner || DEFAULT_STUDIO_CONFIG.banner, // ✅ ADD THIS
      form: studio.form || DEFAULT_STUDIO_CONFIG.form // ✅ ADD THIS
    }

    if (user._id) {
      try {
        // Try to load saved form config from API
       
        const savedConfig = await getStudioConfig(user._id)
        // Merge saved config with studio data
        setConfig({
          ...DEFAULT_STUDIO_CONFIG,
          studioName: savedConfig.name || studio.name,
          tagline: savedConfig.tagline !== undefined ? savedConfig.tagline : (studio.tagline || ""),
          logo: savedConfig.logo !== undefined ? savedConfig.logo : studio.logo,
          bannerImage: savedConfig.bannerImage !== undefined ? savedConfig.bannerImage : studio.bannerImage,
          bannerImageMobile: savedConfig.bannerImageMobile !== undefined ? savedConfig.bannerImageMobile : (studio.bannerImageMobile || null),
          backgroundImage: savedConfig.backgroundImage !== undefined ? savedConfig.backgroundImage : studio.backgroundImage,
          portfolioSelected: savedConfig.portfolioSelected || null,
          portfolio: savedConfig.portfolioImages || studio.portfolioImages || [],
          youtubeLinks: savedConfig.youtubeLinks || studio.youtubeLinks || [],
          banner: savedConfig.banner || studio.banner || DEFAULT_STUDIO_CONFIG.banner,
          form: savedConfig.form || studio.form || DEFAULT_STUDIO_CONFIG.form,
          accentColor: savedConfig.accentColor || DEFAULT_STUDIO_CONFIG.accentColor
        })
      } catch (error) {
       
        setConfig(baseConfig)
      }
    } else {
      setConfig(baseConfig)
    }

    setLoading(false)
  }

  loadConfig()
}, [studio])

  const handleUpdate = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleSave = async () => {
    if (!studio?._id) {
      setErrorMessage('Studio ID not found. Cannot save.')
      return
    }

    setSaving(true)
    try {
      const dataToUpdate = {
        personalInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
     studioInfo: {
        ...config,
        tagline: config.tagline || "", 
      },
      }
      await updateLeadForm(studio._id, dataToUpdate)
      setSuccessMessage('Lead configuration saved successfully!')
    } catch (error) {
      setErrorMessage(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMockSubmit = (formData) => {
    setErrorMessage('This is preview mode. Form submissions are disabled.')
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50))
  }

  const handleZoomReset = () => {
    setZoom(100)
  }

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cmd/Ctrl + Plus/Equals for zoom in
      if ((e.metaKey || e.ctrlKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        handleZoomIn()
      }
      // Cmd/Ctrl + Minus for zoom out
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      }
      // Cmd/Ctrl + 0 for reset zoom
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        handleZoomReset()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (loading) {
    return <PageSkeleton variant='form' />
  }

  return (
    <>
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true} makeDarker={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true} makeDarker={true}>
          {errorMessage}
        </Error>
      )}
      <TourGuide 
        steps={leadFormTourSteps} 
        tourKey="forms-tour" 
        autoStart={false}
        onStartTour={(startFn) => { startTourRef.current = startFn; }}
      />
      <div id="studio-editor-container" className='h-screen bg-gray-50'>
        <div className='max-w-[1920px] mx-auto h-full flex flex-row gap-0 overflow-hidden'>
          {/* Tools Panel on the left */}
          <PermissionGate page="3" component="3_1" action="edit">
          <div className='w-full lg:w-96 xl:w-[420px] shrink-0 h-full border-r border-gray-200 bg-white'>
            
            <ToolsPanel
              config={config}
              onUpdate={handleUpdate}
              onSave={handleSave}
              isSaving={saving}
              publicUrl={publicUrl}
              onCopyUrl={handleCopyUrl}
              copied={copied}
            />
          </div>
          </PermissionGate>

          {/* Preview on the right - full height */}
          <div id="preview-canvas-container" className='flex-1 h-full overflow-auto'>
            <div className='relative h-full'>
              <div className='absolute top-3 right-3 z-20 flex items-center gap-1 bg-gray-100/95 rounded-lg p-0.5 shadow-sm'>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className='px-2 py-1 rounded text-xs font-medium transition-all text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed'
                  title='Zoom Out (Cmd/Ctrl + -)'
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={handleZoomReset}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-all min-w-[50px] ${zoom !== 100
                    ? 'text-primary-dark hover:bg-white hover:shadow-sm'
                    : 'text-gray-600'
                    }`}
                  title='Reset Zoom (Cmd/Ctrl + 0)'
                >
                  {zoom}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className='px-2 py-1 rounded text-xs font-medium transition-all text-gray-600 hover:text-gray-900 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed'
                  title='Zoom In (Cmd/Ctrl + +)'
                >
                  <ZoomIn size={14} />
                </button>
              </div>

              <div
                className='origin-top-left transition-transform duration-300'
                style={
                  zoom !== 100
                    ? {
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      minHeight: zoom < 100 ? '100%' : 'auto'
                    }
                    : {}
                }
              >
                <PreviewCanvas
                  config={config}
                  onSubmit={handleMockSubmit}
                  publicMode={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


