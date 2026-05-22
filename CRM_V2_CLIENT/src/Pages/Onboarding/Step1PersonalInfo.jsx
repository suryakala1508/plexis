import React, { useState, useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'

export const Step1PersonalInfo = ({ 
  firstName, 
  setFirstName,
  lastName,
  setLastName,
  email,
  phone,
  setPhone,
  countryCode,
  setCountryCode
}) => {
  const [errors, setErrors] = useState({})
  const firstNameRef = useRef(null)

  // Auto-focus first name on mount
  useEffect(() => {
    if (firstNameRef.current) {
      firstNameRef.current.focus()
    }
  }, [])

  // Validation functions
  const validatePhone = (value) => {
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(value)
  }

  const validateName = (value) => {
    return value.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(value)
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only digits
    if (value.length <= 10) {
      setPhone(value)
      // Auto-advance: if 10 digits entered, blur the field
      if (value.length === 10 && validatePhone(value)) {
        e.target.blur()
      }
      if (value.length > 0 && !validatePhone(value)) {
        setErrors({...errors, phone: 'Phone number must be exactly 10 digits'})
      } else {
        const newErrors = {...errors}
        delete newErrors.phone
        setErrors(newErrors)
      }
    }
  }

  const handleFirstNameChange = (e) => {
    const value = e.target.value
    setFirstName(value)
    if (value.length > 0 && !validateName(value)) {
      setErrors({...errors, firstName: 'Name must be at least 2 characters and contain only letters'})
    } else {
      const newErrors = {...errors}
      delete newErrors.firstName
      setErrors(newErrors)
    }
  }

  const handleLastNameChange = (e) => {
    const value = e.target.value
    setLastName(value)
    if (value.length > 0 && !validateName(value)) {
      setErrors({...errors, lastName: 'Name must be at least 2 characters and contain only letters'})
    } else {
      const newErrors = {...errors}
      delete newErrors.lastName
      setErrors(newErrors)
    }
  }

  return (
    <div className='animate-fadeIn'>
      <form className='space-y-6 max-w-xl mx-auto w-full'>
        {/* Personal Details Section */}
        <div className='space-y-4'>
          <div className='pb-2 border-b border-gray-200'>
            <h3 className='text-sm font-semibold text-gray-700'>Personal details</h3>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                First name <span className='text-red-500'>*</span>
              </label>
              <input
                ref={firstNameRef}
                type='text'
                value={firstName}
                onChange={handleFirstNameChange}
                placeholder='John'
                className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                } focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400`}
                required
                minLength={2}
              />
              {errors.firstName && (
                <p className='text-xs text-red-500 mt-1'>{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Last name <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={lastName}
                onChange={handleLastNameChange}
                placeholder='Doe'
                className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                } focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400`}
                required
                minLength={2}
              />
              {errors.lastName && (
                <p className='text-xs text-red-500 mt-1'>{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className='space-y-4'>
          {/* Email - Locked */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Email <span className='text-red-500'>*</span>
            </label>
            <div className='relative'>
              <div className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                <Lock size={16} />
              </div>
              <input
                type='email'
                value={email}
                disabled
                className='w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
              />
            </div>
            <p className='text-xs text-gray-500 mt-1.5 flex items-center gap-1'>
              <Lock size={12} />
              This is linked to your account
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Mobile number <span className='text-red-500'>*</span>
            </label>
            <div className='flex gap-2 items-start'>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className='w-24 px-3 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 h-[42px]'
              >
                <option value='+1'>+1</option>
                <option value='+44'>+44</option>
                <option value='+91'>+91</option>
                <option value='+61'>+61</option>
                <option value='+81'>+81</option>
                <option value='+86'>+86</option>
                <option value='+49'>+49</option>
                <option value='+33'>+33</option>
                <option value='+39'>+39</option>
                <option value='+34'>+34</option>
              </select>
              <div className='flex-1'>
                <input
                  type='tel'
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder='9876543210'
                  maxLength={10}
                  className={`w-full px-3 py-2.5 text-sm rounded-lg border ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  } focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400 h-[42px]`}
                  required
                />
                {errors.phone ? (
                  <p className='text-xs text-red-500 mt-1'>{errors.phone}</p>
                ) : (
                  <p className='text-xs text-gray-500 mt-1.5'>Enter 10 digit mobile number</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}

