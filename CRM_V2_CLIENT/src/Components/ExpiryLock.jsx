import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { AlertCircle } from 'lucide-react'

/**
 * ExpiryLock Component
 * Wraps UI elements and prevents interaction when account is expired
 * Shows a modal overlay with upgrade prompt
 * 
 * @param {React.ReactNode} children - The content to wrap
 * @param {boolean} allowWhenExpired - If true, allows interaction even when expired
 */
export const ExpiryLock = ({ children, allowWhenExpired = false }) => {
  const { isExpired } = useUser()
  const navigate = useNavigate()
  const [showModal, setShowModal] = React.useState(false)
  
  if (isExpired && !allowWhenExpired) {
    return (
      <>
        <div 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setShowModal(true)
          }}
          className="cursor-not-allowed"
        >
          {children}
        </div>
        
        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-2xl border border-gray-200 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Subscription Expired
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your subscription has expired. Please upgrade to continue using this feature.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowModal(false)
                    navigate('/studio/profile')
                  }}
                  className="px-6 py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
  
  return <>{children}</>
}
