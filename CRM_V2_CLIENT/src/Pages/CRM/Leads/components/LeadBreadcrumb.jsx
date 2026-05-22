import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export const LeadBreadcrumb = ({ leadId, leadName, currentPage }) => {
    const navigate = useNavigate()

    const handleLeadsClick = (e) => {
        e.preventDefault()
        navigate('/leads')
    }

    const handleLeadClick = (e) => {
        e.preventDefault()
        if (leadId) {
            // Pass state to indicate we're navigating back (to avoid showing skeleton)
            navigate(`/leads/${leadId}`)
        }
    }

    return (
        <nav className='flex items-center gap-2 text-sm' aria-label="Breadcrumb">
            <button
                onClick={handleLeadsClick}
                className='text-gray-600 hover:text-primary-dark transition-colors font-medium'
            >
                Leads
            </button>

            {leadId && (
                <>
                    <ChevronRight size={16} className='text-gray-400' />
                    {leadName ? (
                        currentPage ? (
                            <button
                                onClick={handleLeadClick}
                                className='text-gray-600 hover:text-primary-dark transition-colors font-medium'
                            >
                                {leadName}
                            </button>
                        ) : (
                            <span className='text-primary-dark font-semibold'>{leadName}</span>
                        )
                    ) : (
                        <span className='text-gray-400 italic'>Loading...</span>
                    )}
                </>
            )}

            {currentPage && (
                <>
                    <ChevronRight size={16} className='text-gray-400' />
                    <span className='text-primary-dark font-semibold'>{currentPage}</span>
                </>
            )}
        </nav>
    )
}
