import React from 'react'
import { LoadingSpinner } from '../../Components/Loading'

export const NavigationButtons = ({ currentStep, totalSteps, handleNext, loading = false }) => {
  return (
    <div className='flex justify-end items-center mt-10'>
      <button
        onClick={handleNext}
        disabled={loading}
        className='px-8 py-3 bg-black hover:bg-primary-dark disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:hover:scale-100 flex items-center gap-2'
      >
        {loading && <LoadingSpinner size='md' />}
        {loading ? 'Processing...' : currentStep === totalSteps ? 'Complete' : 'Next'}
      </button>
    </div>
  )
}

