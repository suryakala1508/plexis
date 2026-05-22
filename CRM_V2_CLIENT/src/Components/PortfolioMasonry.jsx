import React, { useState } from 'react'
import { Skeleton } from './Skeleton'
import { normalizeUrl } from '../utils/formatUtils'

export const PortfolioMasonry = ({ images = [] }) => {
  const [loadedImages, setLoadedImages] = useState({})

  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }))
  }

  // Normalize URLs

  // Distribute images into 3 columns for masonry effect
  const columns = [[], [], []]
  images.forEach((img, index) => {
    columns[index % 3].push({ img, index })
  })

  return (
    <div className='grid grid-cols-3 gap-2 sm:gap-3 md:gap-4'>
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className='flex flex-col gap-2 sm:gap-3 md:gap-4'>
          {column.map(({ img, index }) => (
            <div
              key={index}
              className='relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer group'
            >
              {!loadedImages[index] && (
                <Skeleton className='absolute inset-0 w-full h-48 sm:h-56 md:h-64' />
              )}
              <img
                src={normalizeUrl(img)}
                alt={`Portfolio ${index + 1}`}
                className={`w-full h-auto object-cover transition-opacity duration-300 ${loadedImages[index] ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => handleImageLoad(index)}
                loading='lazy'
              />
              {/* Hover overlay */}
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300' />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
