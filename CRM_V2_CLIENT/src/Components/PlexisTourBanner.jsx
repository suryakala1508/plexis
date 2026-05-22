import React, { useState } from 'react'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'


import { completeTour } from '../services/studioService'

export const PlexisTourBanner = () => {
  const { studio, refreshUser } = useUser()
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('plexis-tour-banner-dismissed') === 'true'
  })



  // Hide if tour fully completed in backend (studio.tourDone)
  if (studio?.tourDone) return null

  const handleDismiss = async () => {
    localStorage.setItem('plexis-tour-banner-dismissed', 'true')
    setDismissed(true)
    
    // Persist to backend and refresh user context
    await completeTour()
    if (refreshUser) refreshUser()
  }

  const handleStartTour = () => {
    // Dispatch event for Sidebar to handle the logic
    window.dispatchEvent(new CustomEvent('plexis-start-chain'))
  }

  if (dismissed) return null

  return (
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 mb-6 shadow-md text-white relative overflow-hidden animate-fade-in">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-2 -ml-2 w-16 h-16 bg-white opacity-10 rounded-full blur-lg"></div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-lg">New to Plexis?</h4>
            <p className="text-violet-100 text-sm opacity-90">
              Take a quick tour to discover all the powerful features available to you.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStartTour}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-violet-600 rounded-lg hover:bg-violet-50 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
          >
            Start Tour
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
            title="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
