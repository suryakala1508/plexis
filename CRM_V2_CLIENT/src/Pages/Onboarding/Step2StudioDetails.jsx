import React, { useState, useEffect } from 'react'
import { GetCountries, GetState, GetCity } from "react-country-state-city"
import { Plus } from 'lucide-react'

export const Step2StudioDetails = ({
  studioName,
  setStudioName,
  addressLine1,
  setAddressLine1,
  addressLine2,
  setAddressLine2,
  city,
  setCity,
  state,
  setState,
  country,
  setCountry,
  gstNumber,
  setGstNumber,
  branches,
  addBranch,
  removeBranch,
  updateBranch
}) => {
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [selectedStateId, setSelectedStateId] = useState(null)
  const [errors, setErrors] = useState({})
  const [branchStates, setBranchStates] = useState({}) // { branchIndex: states[] }
  const [branchCities, setBranchCities] = useState({}) // { branchIndex: cities[] }

  // Load countries on mount
  useEffect(() => {
    GetCountries().then((result) => {
      setCountries(result)
    })
  }, [])

  // Load states when country changes
  useEffect(() => {
    if (selectedCountryId) {
      GetState(selectedCountryId).then((result) => {
        setStates(result)
        setCities([]) // Reset cities when country changes
      })
    }
  }, [selectedCountryId])

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountryId && selectedStateId) {
      GetCity(selectedCountryId, selectedStateId).then((result) => {
        setCities(result)
      })
    }
  }, [selectedCountryId, selectedStateId])

  const handleCountryChange = (e) => {
    const countryId = parseInt(e.target.value)
    const selectedCountry = countries.find(c => c.id === countryId)
    if (selectedCountry) {
      setCountry(selectedCountry.name)
      setSelectedCountryId(countryId)
      setState('') // Reset state
      setCity('') // Reset city
      setSelectedStateId(null)
    }
  }

  const handleStateChange = (e) => {
    const stateId = parseInt(e.target.value)
    const selectedState = states.find(s => s.id === stateId)
    if (selectedState) {
      setState(selectedState.name)
      setSelectedStateId(stateId)
      setCity('') // Reset city
    }
  }

  const handleCityChange = (e) => {
    const cityId = parseInt(e.target.value)
    const selectedCity = cities.find(c => c.id === cityId)
    if (selectedCity) {
      setCity(selectedCity.name)
    }
  }

  // Branch handlers
  const handleBranchCountryChange = (index, e) => {
    const countryId = parseInt(e.target.value)
    const selectedCountry = countries.find(c => c.id === countryId)
    if (selectedCountry) {
      updateBranch(index, 'country', selectedCountry.name)
      updateBranch(index, 'selectedCountryId', countryId)
      updateBranch(index, 'state', '')
      updateBranch(index, 'city', '')
      updateBranch(index, 'selectedStateId', null)
      
      // Load states for this branch
      GetState(countryId).then((result) => {
        setBranchStates(prev => ({ ...prev, [index]: result }))
        setBranchCities(prev => ({ ...prev, [index]: [] }))
      })
    }
  }

  const handleBranchStateChange = (index, e) => {
    const stateId = parseInt(e.target.value)
    const branch = branches[index]
    if (branch.selectedCountryId && branchStates[index]) {
      const selectedState = branchStates[index].find(s => s.id === stateId)
      if (selectedState) {
        updateBranch(index, 'state', selectedState.name)
        updateBranch(index, 'selectedStateId', stateId)
        updateBranch(index, 'city', '')
        
        // Load cities for this branch
        GetCity(branch.selectedCountryId, stateId).then((result) => {
          setBranchCities(prev => ({ ...prev, [index]: result }))
        })
      }
    }
  }

  const handleBranchCityChange = (index, e) => {
    const cityId = parseInt(e.target.value)
    const branch = branches[index]
    if (branch.selectedCountryId && branch.selectedStateId && branchCities[index]) {
      const selectedCity = branchCities[index].find(c => c.id === cityId)
      if (selectedCity) {
        updateBranch(index, 'city', selectedCity.name)
      }
    }
  }

  // Load states when branch country changes
  useEffect(() => {
    branches.forEach((branch, index) => {
      if (branch.selectedCountryId && !branchStates[index]) {
        GetState(branch.selectedCountryId).then((result) => {
          setBranchStates(prev => ({ ...prev, [index]: result }))
        })
      }
    })

  }, [branches.map(b => b.selectedCountryId).join(',')])

  // Validation
  const validateStudioName = (value) => {
    return value.trim().length >= 3
  }

  const handleStudioNameChange = (e) => {
    const value = e.target.value
    setStudioName(value)
    if (value.length > 0 && !validateStudioName(value)) {
      setErrors({...errors, studioName: 'Studio name missed - must be at least 3 characters'})
    } else {
      const newErrors = {...errors}
      delete newErrors.studioName
      setErrors(newErrors)
    }
  }
  return (
    <div className='animate-fadeIn'>
      <form className='space-y-5 max-w-xl mx-auto w-full'>
        {/* Main Studio Details */}
        <div>
          <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
            Studio name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={studioName}
            onChange={handleStudioNameChange}
            placeholder='Creative Studios Inc.'
            className={`w-full px-3 py-2 text-sm rounded-lg border-2 ${
              errors.studioName ? 'border-red-500' : 'border-gray-200'
            } focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400`}
            required
            minLength={3}
          />
          {errors.studioName && (
            <p className='text-xs text-red-500 mt-1'>{errors.studioName}</p>
          )}
        </div>

        <div>
          <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
            Address Line 1 <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder='123 Main Street'
            className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400'
            required
            minLength={5}
          />
        </div>

        <div>
          <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
            Address Line 2
          </label>
          <input
            type='text'
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            placeholder='Suite 101, Building A'
            className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400'
          />
        </div>

        {/* Country Dropdown */}
        <div className='max-w-full'>
          <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
            Country <span className='text-red-500'>*</span>
          </label>
          <select
            value={selectedCountryId || ''}
            onChange={handleCountryChange}
            className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900'
            required
          >
            <option value=''>Select Country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* State and City */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
              State / Province <span className='text-red-500'>*</span>
            </label>
            <select
              value={selectedStateId || ''}
              onChange={handleStateChange}
              disabled={!selectedCountryId}
              className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed'
              required
            >
              <option value=''>Select State</option>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* City Text Input */}
          <div>
            <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
              City <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder='Enter city name'
              className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400'
              required
            />
          </div>
        </div>

        {/* GST Number - Optional */}
        <div>
          <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
            GST Number
          </label>
          <input
            type='text'
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder='27AAPFU0939F1Z5'
            maxLength={15}
            className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400'
          />
          <p className='text-xs text-gray-500 mt-1.5'>Optional. Indian GSTIN format (15 characters)</p>
        </div>

          {/* Additional Branches */}
          <div className='pt-5 border-t-2 border-gray-200'>
            <div className='mb-3 flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-semibold text-primary-dark mb-1'>Additional Branches</h3>
                <p className='text-xs text-text-muted'>Do you have multiple studio locations? Add them here.</p>
              </div>
              <button
                type='button'
                onClick={addBranch}
                className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-dark border border-primary-dark rounded-lg hover:bg-primary/10 transition-colors whitespace-nowrap'
              >
                <Plus size={14} />
                Add Branch
              </button>
            </div>

            {branches.length === 0 ? (
              <div className='text-center py-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50'>
                <p className='text-sm text-text-muted'>No additional branches added yet</p>
              </div>
            ) : (
              <>
                {branches.map((branch, index) => (
            <div 
              // Using a unique ID is safer than index if branches can be removed or reordered.
              key={branch.id || index}
              data-branch-id={branch.id || index}
              className='mb-6 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 relative'
            >
              <button
                type='button'
                onClick={() => removeBranch(index)}
                className='absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold'
              >
                ✕
              </button>
              <h4 className='text-sm font-semibold text-primary-dark mb-3'>Branch {index + 1}</h4>
              
                  <div className='space-y-3'>
                <input
                  type='text'
                  value={branch.addressLine1}
                  onChange={(e) => updateBranch(index, 'addressLine1', e.target.value)}
                  placeholder='Address Line 1'
                  className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none bg-white'
                />
                <input
                  type='text'
                  value={branch.addressLine2}
                  onChange={(e) => updateBranch(index, 'addressLine2', e.target.value)}
                  placeholder='Address Line 2 (optional)'
                  className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none bg-white'
                />
                {/* Branch Country Dropdown */}
                <div>
                  <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                    Country <span className='text-red-500'>*</span>
                  </label>
                  <select
                    value={branch.selectedCountryId || ''}
                    onChange={(e) => handleBranchCountryChange(index, e)}
                    className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900'
                  >
                    <option value=''>Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch State and City */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                      State / Province <span className='text-red-500'>*</span>
                    </label>
                    <select
                      value={branch.selectedStateId || ''}
                      onChange={(e) => handleBranchStateChange(index, e)}
                      disabled={!branch.selectedCountryId}
                      className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed'
                    >
                      <option value=''>Select State</option>
                      {branchStates[index]?.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                      City <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={branch.city || ''}
                      onChange={(e) => updateBranch(index, 'city', e.target.value)}
                      placeholder='Enter city name'
                      className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all bg-white text-gray-900 placeholder:text-gray-400'
                    />
                  </div>
                </div>
                
                {/* Branch Mobile Number */}
                <div>
                  <label className='block text-xs font-semibold text-primary-dark mb-1.5'>
                    Branch Phone <span className='text-red-500'>*</span>
                  </label>
                  <div className='flex gap-2 items-start'>
                    <select
                      value={branch.countryCode || '+91'}
                      onChange={(e) => updateBranch(index, 'countryCode', e.target.value)}
                      className='w-24 px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none bg-white h-[42px]'
                    >
                      <option value='+1'>+1</option>
                      <option value='+44'>+44</option>
                      <option value='+91'>+91</option>
                      <option value='+61'>+61</option>
                      <option value='+81'>+81</option>
                      <option value='+86'>+86</option>
                    </select>
                    <input
                      type='tel'
                      value={branch.phone || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                        updateBranch(index, 'phone', value)
                      }}
                      placeholder='9876543210'
                      maxLength={10}
                      className='flex-1 px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none bg-white placeholder:text-gray-400 h-[42px]'
                    />
                  </div>
                  <p className='text-xs text-text-muted mt-1'>Enter 10 digit mobile number for this branch</p>
                </div>
              </div>
            </div>
          ))}
            </>
            )}
        </div>
      </form>
    </div>
  )
}