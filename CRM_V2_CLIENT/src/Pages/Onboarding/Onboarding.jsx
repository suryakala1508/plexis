import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Building2, Images as ImagesIcon, UserCog, ArrowLeft, ArrowRight } from 'lucide-react'
import { LeftSidebar } from './LeftSidebar'
import { Step1PersonalInfo } from './Step1PersonalInfo'
import { Step2StudioDetails } from './Step2StudioDetails'
import { Step3Preferences } from './Step3Preferences'
import { BrandAssetsMedia } from './BrandAssetsMedia'
import { PageSkeleton } from '../../Components/Loading'
import { submitOnboarding, formatOnboardingData } from '../../services/onboardingService'
import { FormError } from '../../Components/FormError'
import { useUser } from '../../contexts/UserContext'
import { SuccessAnimation } from '../../Components/SuccessAnimation'

const stepTimeEstimates = {
  1: '~1 min',
  2: '~2 min',
  3: '~1 min',
  4: '~1 min'
}

export const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Creating your Plexis profile...')
  const [error, setError] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  // Form states - Step 1: User Details
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')

  // Pre-fill user data from UserContext
  useEffect(() => {
    if (!user) {
      // Not authenticated, redirect to login
      navigate('/')
      return
    }

    if (user?.isOnboared || user?.isOnboarded) {
      // Already onboarded, redirect to dashboard
      navigate('/dashboard', { replace: true })
      return
    }

    // Pre-fill form fields with user data
    setEmail(user.email || '')
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')

    // Parse phone if it includes country code
    const rawPhone = user.phone || ''
    if (rawPhone.startsWith('+91')) {
      setCountryCode('+91')
      setPhone(rawPhone.substring(3))
    } else if (rawPhone.startsWith('+1')) {
      setCountryCode('+1')
      setPhone(rawPhone.substring(2))
    } else if (rawPhone.startsWith('+')) {
      const match = rawPhone.match(/^(\+\d+)(.*)$/)
      if (match) {
        setCountryCode(match[1])
        setPhone(match[2])
      } else {
        setPhone(rawPhone)
      }
    } else {
      setPhone(rawPhone)
    }

    setInitialLoading(false)
  }, [user, navigate])

  // Form states - Step 2: Studio Details
  const [studioName, setStudioName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [gstNumber, setGstNumber] = useState('')
  const [branches, setBranches] = useState([])

  // Form states - Step 3: Business Type & Integrations
  const [businessType, setBusinessType] = useState('')
  const [integrations, setIntegrations] = useState({
    metaAds: false,
    googleAds: false,
    instagramAutomation: false,
    hubspot: false,
    other: false,
  })


  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [portfolioImages, setPortfolioImages] = useState([])

  // Save progress to localStorage
  useEffect(() => {
    const formData = {
      firstName,
      lastName,
      email,
      phone,
      countryCode,
      studioName,
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      gstNumber,
      businessType,
      integrations,
      currentStep
    }
    localStorage.setItem('onboarding_progress', JSON.stringify(formData))
  }, [firstName, lastName, email, phone, countryCode, studioName, addressLine1, addressLine2, city, state, country, gstNumber, businessType, integrations, currentStep])

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('onboarding_progress')
    if (saved) {
      try {
        const formData = JSON.parse(saved)
        if (formData.firstName) setFirstName(formData.firstName)
        if (formData.lastName) setLastName(formData.lastName)
        if (formData.phone) setPhone(formData.phone)
        if (formData.countryCode) setCountryCode(formData.countryCode)
        if (formData.studioName) setStudioName(formData.studioName)
        if (formData.addressLine1) setAddressLine1(formData.addressLine1)
        if (formData.addressLine2) setAddressLine2(formData.addressLine2)
        if (formData.city) setCity(formData.city)
        if (formData.state) setState(formData.state)
        if (formData.country) setCountry(formData.country)
        if (formData.gstNumber) setGstNumber(formData.gstNumber)
        if (formData.businessType) setBusinessType(formData.businessType)
        if (formData.integrations) setIntegrations(formData.integrations)
        if (formData.currentStep && formData.currentStep > 1) {
          setCurrentStep(formData.currentStep)
        }
      } catch (e) {
        console.error('Failed to load saved progress:', e)
      }
    }
  }, [])

  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      subtitle: 'Tell us about yourself',
      icon: User,
      purpleTitle: 'Welcome to Plexis!',
      purpleSubtitle: 'Thanks for registering. Please complete your profile to start using your toolkit.',
    },
    {
      id: 2,
      title: 'Studio Details',
      subtitle: 'Your studio & location info',
      icon: Building2,
      purpleTitle: 'Tell us about your studio',
      purpleSubtitle: 'Help us understand your workspace and business locations.',
    },
    {
      id: 3,
      title: 'Brand Assets',
      subtitle: 'Upload your logo and portfolio',
      icon: ImagesIcon,
      purpleTitle: 'Show off your work!',
      purpleSubtitle: 'Add your visual assets so we can build a great profile for you.',
    },
    {
      id: 4,
      title: 'Preferences & Integrations',
      subtitle: 'Customize your experience',
      icon: UserCog,
      purpleTitle: 'Almost there!',
      purpleSubtitle: 'Tell us about the tools you use so we can personalize your experience.',
    },
  ]

  const validateStep = () => {
    setError('')

    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please provide your first and last name to continue.')
        return false
      }
      if (!phone.trim() || phone.trim().length < 6) {
        setError('Please enter a valid phone number.')
        return false
      }
    }

    if (currentStep === 2) {
      const requiredFields = [studioName, addressLine1, city, state, country]
      const hasEmpty = requiredFields.some((value) => !String(value || '').trim())
      if (hasEmpty) {
        setError('Please fill out all required studio details before continuing.')
        return false
      }
    }

    if (currentStep === 3) {
      if (!logo) {
        setError('Please upload your studio logo before moving forward.')
        return false
      }
      if (portfolioImages.length === 0) {
        setError('Please add at least one portfolio image.')
        return false
      }
    }

    if (currentStep === 4) {
      if (!businessType) {
        setError('Select the type of business you operate to finish onboarding.')
        return false
      }
    }

    return true
  }

  const handleNext = async () => {
    if (!validateStep()) {
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding - submit to backend
      setLoading(true)
      setLoadingMessage('Creating your Plexis profile...')

      try {
        const onboardingData = {
          user: { firstName, lastName, email, phone: `${countryCode}${phone}` },
          studio: { studioName, addressLine1, addressLine2, city, state, country, gstNumber, branches },
          preferences: { businessType, integrations },
          logo,
          portfolioImages: portfolioImages.map((item) => item.file)
        }

        // Format and submit data
        const formattedData = formatOnboardingData(onboardingData)

        // Update message while uploading
        setLoadingMessage('Setting up your studio...')
        const response = await submitOnboarding(formattedData)

        // Update message while refreshing
        setLoadingMessage('Almost there...')
        // Refresh user data in context to get updated onboarding status
        await refreshUser()

        // Show success animation
        setShowSuccess(true)
      } catch (err) {
        setError(err.message || 'Failed to complete onboarding. Please try again.')
        console.error('Onboarding error:', err)
        setLoading(false)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleIntegrationToggle = (integration) => {
    setIntegrations(prev => ({
      ...prev,
      [integration]: !prev[integration]
    }))
  }

  const addBranch = () => {
    const newBranchId = Date.now()
    setBranches([...branches, {
      id: newBranchId,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      phone: '',
      countryCode: '+91',
      selectedCountryId: null,
      selectedStateId: null
    }])

    // Scroll to the newly added branch after a short delay
    setTimeout(() => {
      const branchElements = document.querySelectorAll('[data-branch-id]')
      const lastBranch = branchElements[branchElements.length - 1]
      if (lastBranch) {
        lastBranch.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const removeBranch = (idToRemove) => {
    setBranches(branches.filter((_, i) => i !== idToRemove))
  }

  const updateBranch = (index, field, value) => {
    const updatedBranches = [...branches]
    updatedBranches[index][field] = value
    setBranches(updatedBranches)
  }

  if (initialLoading) {
    return <PageSkeleton variant='form' />
  }

  return (
    <>
      {showSuccess && (
        <SuccessAnimation
          message='Onboarding completed successfully!'
          onComplete={() => {
            // Navigate to dashboard - backend will update isOnboared to true
            navigate('/dashboard')
          }}
        />
      )}
    <div className='w-full h-screen flex flex-col md:flex-row overflow-hidden bg-linear-to-br from-white to-mint-cream/20'>
      <LeftSidebar currentStep={currentStep} steps={steps} />

      {/* Right Side - Form Section */}
      <div className='w-full md:flex-1 flex flex-col px-6 sm:px-10 lg:px-16 py-8 bg-linear-to-br from-white to-mint-cream/30 overflow-y-auto'>
        <div className='max-w-3xl w-full mx-auto flex flex-col h-full'>

          {/* Step Indicator */}
          <div className='mb-6 shrink-0'>
            <div className='flex items-center justify-between mb-2'>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>
                  {steps[currentStep - 1].title}
                </h2>
                <p className='text-sm text-gray-600 mt-0.5'>
                  Step {currentStep} of {steps.length} • {stepTimeEstimates[currentStep] || '~1 min'}
                </p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className='w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-3'>
              <div 
                className='h-full bg-primary-dark rounded-full transition-all duration-500 ease-out'
                style={{ width: `${((currentStep - 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content Area (Scrollable) */}
          <div className='grow overflow-y-auto px-1 pt-6 onboarding-scroll'>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Step1PersonalInfo
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                email={email}
                phone={phone}
                setPhone={setPhone}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
              />
            )}

            {/* Step 2: Studio Details */}
            {currentStep === 2 && (
              <Step2StudioDetails
                studioName={studioName}
                setStudioName={setStudioName}
                addressLine1={addressLine1}
                setAddressLine1={setAddressLine1}
                addressLine2={addressLine2}
                setAddressLine2={setAddressLine2}
                city={city}
                setCity={setCity}
                state={state}
                setState={setState}
                country={country}
                setCountry={setCountry}
                gstNumber={gstNumber}
                setGstNumber={setGstNumber}
                branches={branches}
                addBranch={addBranch}
                removeBranch={removeBranch}
                updateBranch={updateBranch}
              />
            )}

            {/* Step 3: Brand Assets */}
            {currentStep === 3 && (
              <BrandAssetsMedia
                logo={logo}
                setLogo={setLogo}
                logoPreview={logoPreview}
                setLogoPreview={setLogoPreview}
                portfolioImages={portfolioImages}
                setPortfolioImages={setPortfolioImages}
              />
            )}

            {/* Step 4: Preferences & Integrations */}
            {currentStep === 4 && (
              <Step3Preferences
                businessType={businessType}
                setBusinessType={setBusinessType}
                integrations={integrations}
                handleIntegrationToggle={handleIntegrationToggle}
              />
            )}
          </div>

          {/* Navigation Buttons - Inline with form */}
          <div className='shrink-0 pt-6 border-t border-gray-200'>
            {/* Error Message */}
            {error && (
              <div className='mb-4'>
                <FormError message={error} />
              </div>
            )}

            {/* Inline Navigation Buttons */}
            <div className='flex items-center justify-between gap-4'>
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1 || loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  currentStep === 1 || loading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className='flex items-center gap-2 px-6 py-2.5 bg-primary-dark hover:bg-primary-dark/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 shadow-sm'
              >
                {loading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    {loadingMessage}
                  </>
                ) : (
                  <>
                    {currentStep === steps.length ? 'Complete' : 'Continue'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}