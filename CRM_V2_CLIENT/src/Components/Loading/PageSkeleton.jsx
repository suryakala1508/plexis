import React from 'react'
import { Skeleton } from '../Skeleton'

/**
 * PageSkeleton Component
 * Full-page skeleton loader
 * 
 * @param {Object} props
 * @param {'default'|'form'|'dashboard'} props.variant - Page variant (default: 'default')
 */
export const PageSkeleton = ({ variant = 'default' }) => {
    if (variant === 'form') {
        return (
            <div className='flex items-center justify-center min-h-screen bg-gray-50 p-6'>
                <div className='w-full max-w-2xl bg-white rounded-xl border border-gray-200 p-8'>
                    {/* Header */}
                    <div className='text-center mb-8'>
                        <Skeleton className='h-12 w-12 rounded-full mx-auto mb-4' />
                        <Skeleton className='h-8 w-48 mx-auto mb-2' />
                        <Skeleton className='h-4 w-64 mx-auto' />
                    </div>

                    {/* Form fields */}
                    <div className='space-y-4'>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index}>
                                <Skeleton className='h-4 w-24 mb-2' />
                                <Skeleton className='h-10 w-full rounded-lg' />
                            </div>
                        ))}
                    </div>

                    {/* Button */}
                    <Skeleton className='h-12 w-full rounded-lg mt-6' />
                </div>
            </div>
        )
    }

    if (variant === 'dashboard') {
        return (
            <div className='p-6 bg-gray-50 min-h-screen'>
                <div className='max-w-[1800px] mx-auto space-y-6'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <Skeleton className='h-8 w-48 mb-2' />
                            <Skeleton className='h-4 w-64' />
                        </div>
                        <Skeleton className='h-10 w-32 rounded-lg' />
                    </div>

                    {/* Stats cards */}
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className='bg-white rounded-xl border border-gray-200 p-6'>
                                <Skeleton className='h-4 w-20 mb-2' />
                                <Skeleton className='h-8 w-24 mb-1' />
                                <Skeleton className='h-3 w-16' />
                            </div>
                        ))}
                    </div>

                    {/* Main content */}
                    <div className='bg-white rounded-xl border border-gray-200 p-6'>
                        <Skeleton className='h-6 w-32 mb-4' />
                        <div className='space-y-3'>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className='h-16 w-full rounded-lg' />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Default variant
    return (
        <div className='p-6'>
            <div className='max-w-[1600px] mx-auto'>
                {/* Header */}
                <div className='mb-6'>
                    <Skeleton className='h-8 w-48 mb-2' />
                    <Skeleton className='h-4 w-64' />
                </div>

                {/* Content */}
                <div className='bg-white border border-gray-200 p-8'>
                    <div className='space-y-4'>
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className='h-12 w-full rounded' />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
