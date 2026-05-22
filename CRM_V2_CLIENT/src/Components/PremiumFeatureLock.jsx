import React from 'react'
import { Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { useSubscription } from '../contexts/SubscriptionContext'

export const PremiumFeatureLock = ({
  featureKey,
  children,
  tooltipText = 'Upgrade to unlock premium options',
  ctaPath = '/studio/profile',
}) => {
  const { canAccess } = useSubscription()
  const navigate = useNavigate()
  const [openModal, setOpenModal] = React.useState(false)

  const hasAccess = canAccess(featureKey)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <>
      <TooltipProvider delayDuration={120}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="relative cursor-not-allowed opacity-70"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setOpenModal(true)
              }}
            >
              {children}
              <span className="absolute -top-2 -right-2 rounded-full bg-orange-500 p-1 text-white">
                <Lock size={12} />
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpenModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">Premium Feature</h3>
            <p className="mt-2 text-sm text-gray-600">{tooltipText}</p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
                onClick={() => setOpenModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary-dark px-4 py-2 text-sm font-semibold text-white"
                onClick={() => {
                  setOpenModal(false)
                  navigate(ctaPath)
                }}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
