import React from 'react'
import { Skeleton } from '../Skeleton'

/**
 * CardSkeleton Component
 * Skeleton loader for card/grid layouts
 * 
 * @param {Object} props
 * @param {number} props.count - Number of skeleton cards (default: 3)
 * @param {'grid'|'list'} props.layout - Layout type (default: 'grid')
 */
export const CardSkeleton = ({ count = 3, layout = 'grid' }) => {
    const gridClass = layout === 'grid'
        ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
        : 'space-y-4'

    return (
        <div className={gridClass}>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className='bg-white rounded-xl border border-gray-200 p-6'
                >
                    {/* Icon/Image placeholder */}
                    <div className='flex items-center justify-between mb-4'>
                        <Skeleton className='h-12 w-12 rounded-lg' />
                        <Skeleton className='h-5 w-5 rounded' />
                    </div>

                    {/* Title */}
                    <Skeleton className='h-6 w-3/4 mb-2' />

                    {/* Description */}
                    <Skeleton className='h-4 w-full mb-1' />
                    <Skeleton className='h-4 w-2/3' />

                    {/* Stats or additional info */}
                    <div className='mt-4 flex gap-2'>
                        <Skeleton className='h-8 w-20 rounded-full' />
                        <Skeleton className='h-8 w-20 rounded-full' />
                    </div>
                </div>
            ))}
        </div>
    )
}
