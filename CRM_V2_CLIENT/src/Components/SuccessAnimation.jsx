import React, { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export const SuccessAnimation = ({ onComplete, message = 'Success!' }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        setTimeout(onComplete, 300) // Wait for fade out
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
      <div
        className={`bg-white rounded-2xl p-8 shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className='flex flex-col items-center gap-4'>
          <div className='relative'>
            <div className='w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse'>
              <CheckCircle2 className='w-12 h-12 text-emerald-600' strokeWidth={2.5} />
            </div>
            <div className='absolute inset-0 rounded-full bg-emerald-200 animate-ping opacity-20' />
          </div>
          <h3 className='text-xl font-semibold text-gray-900'>{message}</h3>
        </div>
      </div>
    </div>
  )
}
