import React from 'react'

/**
 * LoadingSpinner Component
 * Small spinner for button loading states
 * 
 * @param {Object} props
 * @param {'sm'|'md'|'lg'} props.size - Size of the spinner (default: 'md')
 * @param {'white'|'primary'|'dark'} props.color - Color of the spinner (default: 'white')
 */
export const LoadingSpinner = ({ size = 'md', color = 'white' }) => {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-5 w-5 border-2',
        lg: 'h-6 w-6 border-2'
    }

    const colorClasses = {
        white: 'border-white border-t-transparent',
        primary: 'border-primary-dark border-t-transparent',
        dark: 'border-gray-900 border-t-transparent'
    }

    return (
        <div
            className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`}
            role="status"
            aria-label="Loading"
        />
    )
}
