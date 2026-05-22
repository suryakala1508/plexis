import React from 'react'
import { AlertCircle } from 'lucide-react'

export const FormError = ({ message }) => {
  if (!message) return null

  return (
    <div className='flex items-start gap-2 p-3 bg-red-50  border-red-500 rounded-lg mb-4'>
      <AlertCircle className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
      <p className='text-sm text-red-700 font-medium'>{message}</p>
    </div>
  )
}

