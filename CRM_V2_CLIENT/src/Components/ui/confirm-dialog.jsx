import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from './dialog'
import { Button } from './button'
import { AlertTriangle, CheckCircle2, Info, AlertCircle, Loader2 } from 'lucide-react'

export const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm,
  variant = 'default', // 'default' | 'danger' | 'success' | 'warning' | 'info'
  loading = false 
}) => {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    if (isConfirming || loading) return
    
    setIsConfirming(true)
    try {
      if (onConfirm) {
        await onConfirm()
      }
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }

  // Variant configurations
  const variants = {
    default: {
      icon: Info,
      iconBg: 'bg-purple-100',
      iconColor: 'text-[#9916b1]',
      confirmButton: 'bg-[#9916b1] hover:bg-[#8014a0] focus:ring-[#9916b1] text-white',
    },
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    },
  }

  const config = variants[variant] || variants.default
  const Icon = config.icon
  const isProcessing = isConfirming || loading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw] rounded-2xl p-0 gap-0 overflow-hidden">

         {/* Icon Section */}
        <div className="flex justify-center pt-8 pb-4">
          {/* <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full ${config.iconBg} flex items-center justify-center shadow-lg ring-4 ring-white`}>
            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${config.iconColor}`} />
          </div> */}
        </div>

        {/* Content Section */}
        <div className="px-6 sm:px-8 pb-6">
          <DialogHeader className="text-center space-y-3">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <DialogFooter className="mt-8 flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="w-full sm:w-auto flex-1 h-12 sm:h-11 rounded-xl text-sm sm:text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </Button>

            {/* Confirm Button - Purple/Variant Theme */}
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className={`w-full sm:w-auto flex-1 h-12 sm:h-11 rounded-xl text-sm sm:text-base font-semibold ${config.confirmButton} shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </div>

        <DialogClose className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#9916b1] focus:ring-offset-2 disabled:pointer-events-none" />
      </DialogContent>
    </Dialog>
  )
}

ConfirmDialog.displayName = 'ConfirmDialog'

// Convenience variants for common use cases
export const DangerConfirmDialog = (props) => (
  <ConfirmDialog {...props} variant="danger" />
)

export const SuccessConfirmDialog = (props) => (
  <ConfirmDialog {...props} variant="success" />
)

export const WarningConfirmDialog = (props) => (
  <ConfirmDialog {...props} variant="warning" />
)

export const InfoConfirmDialog = (props) => (
  <ConfirmDialog {...props} variant="info" />
)