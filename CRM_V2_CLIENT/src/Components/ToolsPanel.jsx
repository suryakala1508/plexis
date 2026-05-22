import React, { useState } from 'react'
import {
  Palette, Upload, Type,
  Layout as LayoutIcon, Settings, Save, Eye, EyeOff, Share2, Check,
  Link, Plus, Trash2, Info
} from 'lucide-react'
import { LoadingSpinner } from './Loading'
import { BANNER_HEIGHT_OPTIONS } from '../types/StudioConfig.js'
import { ImageSelector } from './ImageSelector'
import { Success } from './Success'
import { Error as ErrorMessage } from './Error'
import { normalizeUrl } from '../utils/formatUtils'

export const ToolsPanel = ({
  config,
  onUpdate,
  onSave,
  isSaving = false,
  publicUrl,
  onCopyUrl,
  copied = false
}) => {
  const [activeTab, setActiveTab] = useState('branding')
  const [uploading, setUploading] = useState({ logo: false, banner: false, background: false })
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [newCustomField, setNewCustomField] = useState({ name: '', type: 'text', isMandatory: true })
  const [showAddCustom, setShowAddCustom] = useState(false)

  const togglePortfolioImage = (url) => {
    const allImages = (config.portfolio || config.portfolioImages || [])
    const allUrls = allImages.map(img => img.url || img.src || img)
    const current = config.portfolioSelected || allUrls
    const isSelected = current.includes(url)
    const next = isSelected ? current.filter(u => u !== url) : [...current, url]
    onUpdate({ portfolioSelected: next.length === allUrls.length ? null : next })
  }

  const toggleField = (fieldName) => {
    onUpdate({
      form: {
        ...config.form,
        fields: {
          ...config.form.fields,
          [fieldName]: !config.form.fields[fieldName]
        }
      }
    })
  }

  const BUILT_IN_FIELDS = [
    'contactNumber',
    'whatsappNumber',
    'enquiryType',
    'event',
    'eventType',
    'eventDates',
    'location',
    'relation',
    'budget'
  ]

  const toggleMandatoryField = (fieldName) => {
    const currentEnabled = config?.form?.fields?.[fieldName] !== false
    // If field is disabled, don’t allow mandatory toggling (it won’t show anyway).
    if (!currentEnabled) return

    const currentMandatory =
      (config?.form?.mandatory && typeof config.form.mandatory === 'object')
        ? config.form.mandatory[fieldName]
        : undefined

    // Legacy fallback: if mandatory isn’t stored yet, treat enabled fields as mandatory.
    const nextMandatory = !(currentMandatory ?? true)

    onUpdate({
      form: {
        ...config.form,
        mandatory: {
          ...(config.form.mandatory || {}),
          [fieldName]: nextMandatory
        }
      }
    })
  }

  const updateCustomFieldMandatory = (index, nextValue) => {
    const currentCustom = [...(config.form.customFields || [])]
    if (!currentCustom[index]) return
    currentCustom[index] = { ...currentCustom[index], isMandatory: nextValue }
    onUpdate({
      form: {
        ...config.form,
        customFields: currentCustom
      }
    })
  }

  const addCustomField = () => {
    if (!newCustomField.name.trim()) return
    const currentCustom = config.form.customFields || []
    onUpdate({
      form: {
        ...config.form,
        customFields: [
          ...currentCustom,
          {
            ...newCustomField,
            name: newCustomField.name.trim(),
            isMandatory: newCustomField.isMandatory !== false
          }
        ]
      }
    })
    setNewCustomField({ name: '', type: 'text', isMandatory: true })
    setShowAddCustom(false)
  }

  const removeCustomField = (index) => {
    const currentCustom = [...(config.form.customFields || [])]
    currentCustom.splice(index, 1)
    onUpdate({
      form: {
        ...config.form,
        customFields: currentCustom
      }
    })
  }


  return (
    <>
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true} makeDarker={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <ErrorMessage onClose={() => setErrorMessage(null)} autoClose={true} makeDarker={true}>
          {errorMessage}
        </ErrorMessage>
      )}

      <div id="tools-panel-container" className='bg-white  border border-gray-200 h-full flex flex-col'>
        {/* Header */}
        <div className='border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0'>
          <h2 className='text-base font-bold text-gray-900'>Customize Form</h2>
          <div className='flex items-center gap-2'>
            {publicUrl && onCopyUrl && (
              <button
                type='button'
                onClick={onCopyUrl}
                className='flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors'
                title={publicUrl}
              >
                {copied ? (
                  <>
                    <Check size={14} className='text-green-600' />
                    Copied
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    Share
                  </>
                )}
              </button>
            )}
            <button
              id="tools-panel-save-btn"
              onClick={onSave}
              disabled={isSaving}
              className='flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg text-sm font-medium hover:bg-primary-dark/90 disabled:opacity-50 transition-all'
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size='sm' />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200 px-3 bg-white shrink-0'>
          <div className='flex gap-2'>
            {[
              { id: 'branding', label: 'Branding', icon: Type },
              { id: 'design', label: 'Design', icon: Palette },
              { id: 'links', label: 'Links', icon: Link },
              { id: 'fields', label: 'Fields', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                id={`tools-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-primary-dark text-primary-dark'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <div className='flex items-center gap-1.5'>
                  <tab.icon size={14} />
                  {tab.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className='overflow-y-auto flex-1 p-4'>
          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <div className='space-y-4'>
              {/* Studio Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Studio Name
                </label>
                <input
                  type='text'
                  value={config.studioName}
                  disabled
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed opacity-60'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Studio name cannot be changed here
                </p>
              </div>

              {/* Tagline */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tagline
                </label>
                <input
                  type='text'
                  value={config.tagline || ''}
                  onChange={(e) => onUpdate({ tagline: e.target.value })}
                  placeholder='Capturing moments that last forever'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark'
                />
              </div>

              {/* Logo */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Studio Logo
                </label>

                {/* Logo Preview */}
                {config.logo ? (
                  <div className='mb-3 flex justify-center'>
                    <div className='relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 shadow-sm'>
                      <img
                        src={normalizeUrl(config.logo)}
                        alt='Logo preview'
                        className='w-full h-full object-cover opacity-60'
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='mb-3 flex justify-center'>
                    <div className='w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center'>
                      <span className='text-xs text-gray-400'>No logo</span>
                    </div>
                  </div>
                )}


              </div>


              {/* About Us */}
              <div className='pt-3 border-t border-gray-100'>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>About Us Section</p>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Title
                    </label>
                    <input
                      type='text'
                      value={config.aboutUs?.title || ''}
                      onChange={(e) => onUpdate({ aboutUs: { ...config.aboutUs, title: e.target.value } })}
                      placeholder='Our Story'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <textarea
                      value={config.aboutUs?.description || ''}
                      onChange={(e) => onUpdate({ aboutUs: { ...config.aboutUs, description: e.target.value } })}
                      placeholder="We are a passionate photography studio dedicated to capturing life's most precious moments..."
                      rows={4}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark resize-none'
                    />
                  </div>
                </div>
              </div>

              {/* Form Title */}
              <div className='pt-3 border-t border-gray-100'>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Contact Form</p>
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Form Title
                    </label>
                    <input
                      type='text'
                      value={config.form.title}
                      onChange={(e) => onUpdate({ form: { ...config.form, title: e.target.value } })}
                      placeholder='Send Enquiry'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Form Description
                    </label>
                    <textarea
                      value={config.form.description || ''}
                      onChange={(e) => onUpdate({ form: { ...config.form, description: e.target.value } })}
                      placeholder="We'd love to hear about your event"
                      rows={2}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark resize-none'
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DESIGN TAB */}
          {activeTab === 'design' && (
            <div className='space-y-4'>
              {/* Accent Color */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Accent Color
                </label>
                <div className='flex items-center gap-3'>
                  <input
                    type='color'
                    value={config.accentColor}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    className='w-16 h-10 rounded-lg cursor-pointer'
                  />
                  <input
                    type='text'
                    value={config.accentColor}
                    onChange={(e) => onUpdate({ accentColor: e.target.value })}
                    placeholder='#D4AF37'
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark'
                  />
                </div>
                <div className='mt-2 grid grid-cols-7 gap-2'>
                  {['#8B00FF', '#9563B9', '#7171E3', '#62C362', '#F1F154', '#FFA500', '#E66363'].map(color => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ accentColor: color })}
                      className={`w-full h-8 rounded-lg border-2 transition-all ${config.accentColor === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                        }`}
                      style={{ backgroundColor: color }}
                      title={color === '#8B00FF' ? 'Violet' : color === '#9563B9' ? 'Indigo' : color === '#7171E3' ? 'Blue' : color === '#62C362' ? 'Green' : color === '#F1F154' ? 'Yellow' : color === '#FFA500' ? 'Orange' : 'Red'}
                    />
                  ))}
                </div>
              </div>

              {/* Banner Image */}
              <div>
                <div className='flex items-center justify-between mb-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Header Banner
                  </label>
                  <button
                    onClick={() => onUpdate({
                      banner: { ...config.banner, show: !config.banner?.show }
                    })}
                    className='flex items-center gap-1 text-xs text-gray-600 hover:text-primary-dark transition-colors'
                  >
                    {config.banner?.show !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                    {config.banner?.show !== false ? 'Hide' : 'Show'}
                  </button>
                </div>

                {config.banner?.show !== false && (
                  <ImageSelector
                    imageType="header"
                    selectedImage={config.bannerImage}
                    selectedImageMobile={config.bannerImageMobile}
                    onSelect={(url, deviceType = 'desktop') => {
                      if (deviceType === 'mobile') onUpdate({ bannerImageMobile: url });
                      else onUpdate({ bannerImage: url });
                    }}
                  />
                )}
              </div>

              {/* Banner Customization */}
              {config.bannerImage && config.banner?.show !== false && (
                <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4'>
                  <h3 className='text-sm font-semibold text-gray-800 flex items-center gap-2'>
                    <LayoutIcon size={16} />
                    Banner Settings
                  </h3>

                  {/* Banner Height */}
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                      Height
                    </label>
                    <div className='grid grid-cols-3 gap-2'>
                      {BANNER_HEIGHT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => onUpdate({
                            banner: { ...config.banner, height: option.value }
                          })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${config.banner?.height === option.value
                            ? 'bg-primary-dark text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-dark'
                            }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Overlay */}
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                      Overlay Darkness: {config.banner?.overlay || 30}%
                    </label>
                    <input
                      type='range'
                      min='0'
                      max='80'
                      value={config.banner?.overlay || 30}
                      onChange={(e) => onUpdate({
                        banner: { ...config.banner, overlay: parseInt(e.target.value) }
                      })}
                      className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-dark'
                    />
                    <div className='flex justify-between text-[10px] text-gray-500 mt-1'>
                      <span>Light</span>
                      <span>Dark</span>
                    </div>
                  </div>

                  {/* Image Position */}
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-2'>
                      Image Position
                    </label>
                    <div className='grid grid-cols-3 gap-2'>
                      {[{ value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' }].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => onUpdate({ banner: { ...config.banner, objectPosition: opt.value } })}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${(config.banner?.objectPosition || 'center') === opt.value
                            ? 'bg-primary-dark text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-dark'
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Show Gradient */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <label className='text-xs font-medium text-gray-700'>
                        Bottom Gradient
                      </label>
                      <p className='text-[10px] text-gray-500'>Fade effect</p>
                    </div>
                    <button
                      onClick={() => onUpdate({
                        banner: { ...config.banner, showGradient: !config.banner?.showGradient }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.banner?.showGradient ? 'bg-primary-dark' : 'bg-gray-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.banner?.showGradient ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Page Background Image */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Page Background Image
                </label>
                <ImageSelector
                  imageType="background"
                  selectedImage={config.backgroundImage}
                  onSelect={(url) => onUpdate({ backgroundImage: url })}
                />
                <p className='text-[10px] text-gray-500 mt-2'>
                  Optional: Adds a subtle background pattern behind all content
                </p>
              </div>

              {/* Portfolio Images */}
              <div className='pt-3 border-t border-gray-100'>
                <div className='flex items-center justify-between mb-1'>
                  <label className='text-sm font-medium text-gray-700'>Portfolio Images</label>
                  {config.portfolioSelected && (
                    <button
                      onClick={() => onUpdate({ portfolioSelected: null })}
                      className='text-xs text-primary-dark hover:underline font-medium'
                    >
                      Select All
                    </button>
                  )}
                </div>
                <p className='text-[10px] text-gray-500 mb-3'>Select which images appear on your lead form</p>

                {(config.portfolio || config.portfolioImages || []).length === 0 ? (
                  <div className='text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-xs'>
                    No portfolio images uploaded yet
                  </div>
                ) : (
                  <>
                    <div className='grid grid-cols-3 gap-2'>
                      {(config.portfolio || config.portfolioImages || []).map((img, i) => {
                        const url = img.url || img.src || img
                        const allUrls = (config.portfolio || config.portfolioImages || []).map(m => m.url || m.src || m)
                        const isSelected = !config.portfolioSelected || config.portfolioSelected.includes(url)
                        return (
                          <div
                            key={i}
                            onClick={() => togglePortfolioImage(url)}
                            className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? 'border-primary-dark' : 'border-gray-200 opacity-40'}`}
                          >
                            <img src={normalizeUrl(url)} alt={`portfolio ${i + 1}`} className='w-full h-full object-cover' />
                            {isSelected && (
                              <div className='absolute top-1 left-1 bg-primary-dark rounded-full w-4 h-4 flex items-center justify-center'>
                                <Check size={10} className='text-white' />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {config.portfolioSelected && (
                      <p className='text-[10px] text-gray-400 text-center mt-2'>
                        {config.portfolioSelected.length} of {(config.portfolio || config.portfolioImages || []).length} selected
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* LINKS TAB */}
          {activeTab === 'links' && (
            <div className='space-y-4'>
              <div className='flex justify-between items-center mb-2'>
              <label className='block text-sm font-medium text-gray-700 flex items-center gap-1.5'>
                YouTube Links
                <span
                  title='1–2 cinematic films work best here'
                  className='text-gray-400 hover:text-gray-600 cursor-default transition-colors'
                >
                  <Info size={13} />
                </span>
              </label>
                <button
                  onClick={() => onUpdate({ youtubeLinks: [...(config.youtubeLinks || []), { id: Date.now().toString(), url: '', title: '', subtitle: '' }] })}
                  className='text-xs flex items-center gap-1 text-primary-dark hover:underline font-medium'
                >
                  <Plus size={14} /> Add Link
                </button>
              </div>

              {(config.youtubeLinks || []).map((link, index) => (
                <div key={link.id} className='bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3 relative'>
                  <button
                    onClick={() => {
                      const newLinks = [...(config.youtubeLinks || [])];
                      newLinks.splice(index, 1);
                      onUpdate({ youtubeLinks: newLinks });
                    }}
                    className='absolute top-3 right-3 text-red-500 hover:text-red-700'
                  >
                    <Trash2 size={16} />
                  </button>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>YouTube URL</label>
                    <input
                      type='text'
                      value={link.url}
                      onChange={(e) => {
                         const newLinks = [...(config.youtubeLinks || [])];
                         newLinks[index].url = e.target.value;
                         onUpdate({ youtubeLinks: newLinks });
                      }}
                      placeholder='https://youtube.com/watch?v=...'
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark outline-none'
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>Title</label>
                      <input
                        type='text'
                        value={link.title}
                        onChange={(e) => {
                          const newLinks = [...(config.youtubeLinks || [])];
                          newLinks[index].title = e.target.value;
                          onUpdate({ youtubeLinks: newLinks });
                        }}
                        placeholder='Video Title'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark outline-none'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>Subtitle</label>
                      <input
                        type='text'
                        value={link.subtitle}
                        onChange={(e) => {
                          const newLinks = [...(config.youtubeLinks || [])];
                          newLinks[index].subtitle = e.target.value;
                          onUpdate({ youtubeLinks: newLinks });
                        }}
                        placeholder='Subtitle / Role'
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark outline-none'
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!config.youtubeLinks || config.youtubeLinks.length === 0) && (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
                  No YouTube links added yet.
                </div>
              )}
            </div>
          )}

          {/* FIELDS TAB */}
          {activeTab === 'fields' && (
            <div className='space-y-3'>
              <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4'>
                <p className='text-xs text-blue-900'>
                  <strong>Note:</strong> Toggle fields on/off (eye). Use the new toggle to mark a field as mandatory/optional.
                </p>
              </div>

              {BUILT_IN_FIELDS.map((fieldName) => {
                const isEnabled = config?.form?.fields?.[fieldName] !== false
                const isMandatory =
                  (config?.form?.mandatory && typeof config.form.mandatory === 'object')
                    ? (config.form.mandatory[fieldName] ?? true)
                    : true

                return (
                  <div
                    key={fieldName}
                    className='flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div>
                        <div className='text-sm font-medium text-gray-900 capitalize'>
                          {fieldName.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {fieldName === 'whatsappNumber' && 'Includes "Same as contact" checkbox'}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center gap-2'>
                      {/* Mandatory toggle (before eye icon) */}
                      <button
                        type='button'
                        onClick={() => toggleMandatoryField(fieldName)}
                        disabled={!isEnabled}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          !isEnabled
                            ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                            : isMandatory
                              ? 'bg-primary-dark'
                              : 'bg-gray-300'
                        }`}
                        title={isEnabled ? (isMandatory ? 'Mandatory' : 'Optional') : 'Enable the field to change mandatory'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            isMandatory ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>

                      {/* Eye icon is the visibility toggle */}
                      <button
                        type='button'
                        onClick={() => toggleField(fieldName)}
                        className='text-gray-900 hover:text-gray-700 transition-colors'
                        title={isEnabled ? 'Hide field' : 'Show field'}
                      >
                        {isEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Custom Fields Section */}
              <div className='pt-4 mt-2 border-t border-gray-100'>
                <div className='flex items-center justify-between mb-3'>
                  <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Custom Fields</h3>
                  <button
                    onClick={() => setShowAddCustom(!showAddCustom)}
                    className='text-xs flex items-center gap-1 text-primary-dark hover:underline font-medium'
                  >
                    <Plus size={14} /> Add Custom Field
                  </button>
                </div>

                <div className='space-y-2'>
                  {(config.form.customFields || []).map((field, index) => (
                    <div key={index} className='flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                      <div className='flex items-center gap-3'>
                         <Settings size={14} className='text-gray-400' />
                         <div>
                           <div className='text-sm font-medium text-gray-900'>
                             {field.name}
                           </div>
                           <div className='text-[10px] text-gray-500 uppercase'>{field.type} Field</div>
                         </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {/* Mandatory toggle (before delete) */}
                        <button
                          type='button'
                          onClick={() => updateCustomFieldMandatory(index, !(field.isMandatory ?? true))}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (field.isMandatory ?? true) ? 'bg-primary-dark' : 'bg-gray-300'
                          }`}
                          title={(field.isMandatory ?? true) ? 'Mandatory' : 'Optional'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              (field.isMandatory ?? true) ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => removeCustomField(index)}
                          className='text-red-500 hover:text-red-700 transition-colors'
                          title='Remove field'
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {showAddCustom && (
                    <div className='p-3 border-2 border-dashed border-primary-dark/30 rounded-lg bg-primary-dark/5 space-y-3'>
                      <div>
                        <label className='block text-[10px] font-bold text-gray-500 uppercase mb-1'>Field Name</label>
                        <input
                          type='text'
                          value={newCustomField.name}
                          onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                          placeholder='e.g. Wedding Date'
                          className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-dark focus:border-primary-dark outline-none'
                        />
                      </div>
                      <div>
                      <label className='block text-[10px] font-bold text-gray-500 uppercase mb-1'>Field Type</label>
                      <select
                        value={newCustomField.type}
                        onChange={(e) => setNewCustomField({ ...newCustomField, type: e.target.value })}
                        className='w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-dark focus:border-primary-dark outline-none bg-white text-gray-700'
                      >
                        <option value='text'>Text</option>
                        <option value='number'>Number</option>
                      </select>
                    </div>

                      <div className='flex items-center justify-between pt-1'>
                        <div>
                          <label className='text-[10px] font-bold text-gray-500 uppercase'>Mandatory</label>
                          <p className='text-[10px] text-gray-500'>If off, it will be optional on the form</p>
                        </div>
                        <button
                          type='button'
                          onClick={() => setNewCustomField({ ...newCustomField, isMandatory: !(newCustomField.isMandatory ?? true) })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            (newCustomField.isMandatory ?? true) ? 'bg-primary-dark' : 'bg-gray-300'
                          }`}
                          title={(newCustomField.isMandatory ?? true) ? 'Mandatory' : 'Optional'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              (newCustomField.isMandatory ?? true) ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className='flex gap-2 pt-1'>
                        <button
                          onClick={addCustomField}
                          className='flex-1 py-1.5 bg-primary-dark text-white text-xs font-medium rounded hover:bg-primary-dark/90 transition-colors'
                        >
                          Add Field
                        </button>
                        <button
                          onClick={() => setShowAddCustom(false)}
                          className='flex-1 py-1.5 bg-white text-gray-600 text-xs font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {(!config.form.customFields || config.form.customFields.length === 0) && !showAddCustom && (
                    <p className='text-center py-4 text-xs text-gray-400 italic'>No custom fields added yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

