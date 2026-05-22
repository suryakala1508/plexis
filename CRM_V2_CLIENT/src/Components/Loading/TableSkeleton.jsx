import React from 'react'
import { Skeleton } from '../Skeleton'

/**
 * TableSkeleton Component
 * Skeleton loader for table layouts
 * 
 * @param {Object} props
 * @param {number} props.rows - Number of skeleton rows (default: 5)
 * @param {number} props.columns - Number of skeleton columns (default: 5)
 * @param {boolean} props.showHeader - Show table header skeleton (default: true)
 */
export const TableSkeleton = ({ rows = 5, columns = 5, showHeader = true }) => {
    return (
        <div className='bg-white border border-gray-200 overflow-hidden'>
            <div className='overflow-x-auto'>
                <table className='w-full'>
                    {showHeader && (
                        <thead className='bg-gray-50 border-b border-gray-200'>
                            <tr>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <th key={colIndex} className='px-4 py-3'>
                                        <Skeleton className='h-4 w-20' />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody className='divide-y divide-gray-200'>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-primary-light/30'}
                            >
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className='px-4 py-3'>
                                        <Skeleton className={`h-4 ${colIndex === 0 ? 'w-32' : 'w-24'}`} />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
