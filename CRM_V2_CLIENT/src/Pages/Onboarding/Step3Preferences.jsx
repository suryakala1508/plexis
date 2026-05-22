import React, { useState } from 'react'

export const Step3Preferences = ({
  businessType,
  setBusinessType,
  integrations,
  handleIntegrationToggle
}) => {
  const [otherTool, setOtherTool] = useState('')
  return (
    <div className='animate-fadeIn'>
      <form className='space-y-6 max-w-xl mx-auto w-full'>
        {/* Business Type */}
        <div>
          <label className='block text-xs font-semibold text-primary-dark mb-2'>
            What type of business are you? <span className='text-red-500'>*</span>
          </label>
          <div className='space-y-3'>
            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-all'>
              <input
                type='radio'
                name='businessType'
                value='single-owner'
                checked={businessType === 'single-owner'}
                onChange={(e) => setBusinessType(e.target.value)}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary'
              />
              <div className='ml-3'>
                <p className='font-medium text-primary-dark text-sm'>Single Owner Studio</p>
                <p className='text-xs text-text-muted'>I run my studio independently</p>
              </div>
            </label>
            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary transition-all'>
              <input
                type='radio'
                name='businessType'
                value='creative-agency'
                checked={businessType === 'creative-agency'}
                onChange={(e) => setBusinessType(e.target.value)}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary'
              />
              <div className='ml-3'>
                <p className='font-medium text-primary-dark text-sm'>Large Creative Agency with Teams</p>
                <p className='text-xs text-text-muted'>Multiple team members and departments</p>
              </div>
            </label>
          </div>
        </div>

        {/* Marketing & Lead Tools */}
        <div className='pt-3 border-t-2 border-gray-200'>
          <label className='block text-xs font-semibold text-primary-dark mb-2'>
            Which other tools do you currently use for leads or marketing? (Select all that apply)
          </label>
          <p className='text-xs text-text-muted mb-3'>
            This helps us offer you better integrations in the future.
          </p>

          <div className='space-y-2'>
            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all'>
              <input
                type='checkbox'
                checked={integrations.metaAds}
                onChange={() => handleIntegrationToggle('metaAds')}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary rounded'
              />
              <div className='ml-3'>
                <p className='font-medium text-primary-dark text-sm'>Meta Ads</p>
                <p className='text-xs text-text-muted'>Facebook & Instagram advertising</p>
              </div>
            </label>

            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all'>
              <input
                type='checkbox'
                checked={integrations.googleAds}
                onChange={() => handleIntegrationToggle('googleAds')}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary rounded'
              />
              <div className='ml-3'>
                <p className='font-medium text-primary-dark text-sm'>Google Ads</p>
                <p className='text-xs text-text-muted'>Search & display advertising</p>
              </div>
            </label>

            
            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all'>
              <input
                type='checkbox'
                checked={integrations.hubspot}
                onChange={() => handleIntegrationToggle('hubspot')}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary rounded'
              />
              <div className='ml-3'>
                <p className='font-medium text-primary-dark text-sm'>HubSpot</p>
                <p className='text-xs text-text-muted'>CRM & marketing automation</p>
              </div>
            </label>

            <label className='flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-all'>
              <input
                type='checkbox'
                checked={integrations.other}
                onChange={() => handleIntegrationToggle('other')}
                className='w-5 h-5 text-primary focus:ring-primary accent-primary rounded'
              />
              <div className='ml-3 flex-1'>
                <p className='font-medium text-primary-dark text-sm mb-2'>Other</p>
                {integrations.other && (
                  <input
                    type='text'
                    value={otherTool}
                    onChange={(e) => setOtherTool(e.target.value)}
                    placeholder='Enter tool name here'
                    className='w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:border-primary-dark focus:outline-none bg-white'
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  )
}

