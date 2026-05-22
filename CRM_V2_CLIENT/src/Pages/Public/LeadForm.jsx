import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PreviewCanvas } from '../../Components/PreviewCanvas'
import { PageSkeleton } from '../../Components/Loading'
import { getStudioConfig } from '../../services/studioService'
import { DEFAULT_STUDIO_CONFIG } from '../../types/StudioConfig.js'
import { getLeadForm, submitLeadForm as submitLead } from '../../services/leadService'
import { CheckCircle } from 'lucide-react'
import { Error } from '../../Components/Error'

export const LeadForm = () => {
  const { studioName } = useParams()
  const [config, setConfig] = useState(DEFAULT_STUDIO_CONFIG)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [studioId, setStudioId] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  // Load studio config
  useEffect(() => {
    const loadConfig = async () => {
      if (!studioName) {
        setError('Studio not found')
        setLoading(false)
        return
      }

      try {
        const studioConfig = await getStudioConfig(studioName)
        setConfig({
          ...studioConfig,
          studioName: studioConfig.name || studioConfig.studioName,
          logo: studioConfig.logo || studioConfig.logo,
          accentColor: studioConfig.accentColor || studioConfig.accentColor,
          bannerImage: studioConfig.bannerImage || studioConfig.bannerImage,
          portfolioImages: studioConfig.portfolioImages || studioConfig.portfolioImages,
          youtubeLinks: studioConfig.youtubeLinks || [],
          coverImage: studioConfig.coverImage || studioConfig.coverImage,
        })
        setStudioId(studioConfig._id)
      } catch (err) {
        setError('Studio not found or form not configured')
        console.error('Error loading studio config:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [studioName])

  // Inject Meta Pixel only on this lead form page
  useEffect(() => {
    const pixelId = config?.form?.metaPixelId
    if (!pixelId) return

    if (document.getElementById('meta-pixel-script')) return

    const script = document.createElement('script')
    script.id = 'meta-pixel-script'
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `
    document.head.appendChild(script)

    const noscript = document.createElement('noscript')
    noscript.id = 'meta-pixel-noscript'
    const img = document.createElement('img')
    img.height = 1
    img.width = 1
    img.style.display = 'none'
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`
    noscript.appendChild(img)
    document.head.appendChild(noscript)

    return () => {
      document.getElementById('meta-pixel-script')?.remove()
      document.getElementById('meta-pixel-noscript')?.remove()
    }
  }, [config?.form?.metaPixelId])

  const handleSubmit = async (formData) => {
    setSubmitting(true)

    try {
      // Map form fields to backend model fields
      const leadData = {
        name: formData.name || '',
        email: formData.email || '',
        contactNumber: formData.contactNumber || '',
        whatsappNumber: formData.whatsappNumber || '',
        EnquiryType: formData.enquiryType || formData.EnquiryType || '',
        EventType: formData.eventType || formData.EventType || '',
        EventDate: formData.eventDates ? new Date(formData.eventDates) : (formData.EventDate ? new Date(formData.EventDate) : null),
        Location: formData.location || formData.Location || '',
        Relation: formData.relation || formData.Relation || '',
        source: formData.source || 'Website',
        remarks: formData.remarks || formData.notes || '',
        additionalfields: formData.additionalfields || {},
        userRef : config.createdBy || config._id
      }

      // Remove empty strings and convert to null for optional fields
      Object.keys(leadData).forEach(key => {
        if (leadData[key] === '' && key !== 'name' && key !== 'email') {
          leadData[key] = undefined
        }
      })

      await submitLead(leadData)
      setSubmitted(true)

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrorMessage(`Failed to submit: ${err.message}`)
      console.error('Error submitting form:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // Loading State
  if (loading) {
    return <PageSkeleton variant='form' />
  }

  // Error State
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4'>
        <div className='max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-3xl'>⚠️</span>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>Form Not Found</h2>
          <p className='text-gray-600'>{error}</p>
        </div>
      </div>
    )
  }

  // Success State
  if (submitted) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4'>
        <div className='max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <CheckCircle size={32} className='text-green-600' />
          </div>
          <h2
            className='text-2xl font-bold text-gray-900 mb-2'
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Thank You!
          </h2>
          <p
            className='text-gray-600 mb-6'
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Your enquiry has been submitted successfully. We'll get back to you soon!
          </p>
          <button
            onClick={() => window.location.reload()}
            className='px-6 py-3 rounded-lg text-white font-semibold transition-all hover:shadow-lg'
            style={{ backgroundColor: config.accentColor }}
          >
            Submit Another Enquiry
          </button>
        </div>
      </div>
    )
  }

  // Main Form View
  return (
    <>
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}
      {/* Add Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <PreviewCanvas
        config={config}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        publicMode={true}
      />
    </>
  )
}

