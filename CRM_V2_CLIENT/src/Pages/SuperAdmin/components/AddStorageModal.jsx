import React, { useState } from 'react'
import { X, HardDrive, Calendar, Plus, Minus } from 'lucide-react'
import { updateUserSubscription } from '../../../services/superadminService'
import { Button } from '../../../Components/ui/button'
import { Input } from '../../../Components/ui/input'
import { Error } from '../../../Components/Error'

export const AddStorageModal = ({ open, onClose, onSuccess, studio }) => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [storageMode, setStorageMode] = useState('add') // 'add' or 'reduce'
  const [daysMode, setDaysMode] = useState('add') // 'add' or 'reduce'
  const [storageGB, setStorageGB] = useState('0')
  const [days, setDays] = useState('0')

  const handleSubmit = async (e) => {
    e.preventDefault()

    const storageValue = parseFloat(storageGB)
    const daysValue = parseInt(days)

    if ((isNaN(storageValue) || storageValue < 0) && (isNaN(daysValue) || daysValue < 0)) {
      setErrorMessage('Please enter valid values')
      return
    }

    if (!studio || !studio.refNo) {
      setErrorMessage('Studio reference number is missing')
      return
    }

    // Validation for storage reduction
    if (storageMode === 'reduce' && storageValue > 0) {
      const currentStorageGB = (studio.storage_data || 0) / (1024 * 1024 * 1024)
      const usedStorageGB = (studio.storageUsed || 0) / (1024 * 1024 * 1024)
      const newStorageGB = currentStorageGB - storageValue
      
      if (newStorageGB < usedStorageGB) {
        setErrorMessage(`Cannot reduce storage to ${newStorageGB.toFixed(2)} GB. Current usage is ${usedStorageGB.toFixed(2)} GB.`)
        return
      }
      
      if (newStorageGB < 0) {
        setErrorMessage(`Cannot reduce by ${storageValue} GB. Only ${currentStorageGB.toFixed(2)} GB available.`)
        return
      }
    }

    // Validation for days reduction
    if (daysMode === 'reduce' && daysValue > 0) {
      const currentValidUntil = new Date(studio.userValidUntil)
      const newValidUntil = new Date(currentValidUntil)
      newValidUntil.setDate(newValidUntil.getDate() - daysValue)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (newValidUntil < today) {
        setErrorMessage(`Cannot reduce validity by ${daysValue} days. This would set expiry to ${newValidUntil.toLocaleDateString()}, which is in the past.`)
        return
      }
    }

    try {
      setLoading(true)
      
      // Calculate bytes to add/reduce
      const storageMultiplier = storageMode === 'reduce' ? -1 : 1
      const bytesToAdd = storageValue > 0 ? Math.floor(storageValue * 1024 * 1024 * 1024) * storageMultiplier : 0
      
      // Calculate days to add/reduce
      const daysMultiplier = daysMode === 'reduce' ? -1 : 1
      const daysToAdd = daysValue > 0 ? daysValue * daysMultiplier : 0

      await updateUserSubscription({
        refNo: studio.refNo,
        additionalStorage: bytesToAdd,
        extendDays: daysToAdd
      })

      setStorageGB('0')
      setDays('0')
      onSuccess()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update subscription')
      console.error('Error updating subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open || !studio) return null

  const currentStorageBytes = studio.storage_data || 0
  const currentStorageGB = currentStorageBytes / (1024 * 1024 * 1024)
  const usedStorageBytes = studio.storageUsed || 0
  const usedStorageGB = usedStorageBytes / (1024 * 1024 * 1024)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manage Subscription</h2>
            <p className="text-sm text-gray-500 mt-1">{studio.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {errorMessage && (
          <div className="px-6 pt-4">
            <Error onClose={() => setErrorMessage(null)}>{errorMessage}</Error>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Storage Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <HardDrive size={16} className="text-primary" />
                  Storage Capacity
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setStorageMode('add')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      storageMode === 'add'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Plus size={12} className="inline mr-1" />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setStorageMode('reduce')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      storageMode === 'reduce'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Minus size={12} className="inline mr-1" />
                    Reduce
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Current: {currentStorageGB.toFixed(2)} GB</span>
                  <span>Used: {usedStorageGB.toFixed(2)} GB</span>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={storageGB}
                  onChange={(e) => setStorageGB(e.target.value)}
                  placeholder={`GB to ${storageMode}`}
                  className="bg-white border-gray-200 focus:ring-primary focus:border-primary font-medium"
                />
                {storageMode === 'reduce' && parseFloat(storageGB) > 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    New total: {(currentStorageGB - parseFloat(storageGB)).toFixed(2)} GB
                  </p>
                )}
                {storageMode === 'add' && parseFloat(storageGB) > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    New total: {(currentStorageGB + parseFloat(storageGB)).toFixed(2)} GB
                  </p>
                )}
              </div>
            </div>

            {/* Validity Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Calendar size={16} className="text-primary" />
                  Validity Period
                </div>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDaysMode('add')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      daysMode === 'add'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Plus size={12} className="inline mr-1" />
                    Extend
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysMode('reduce')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      daysMode === 'reduce'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Minus size={12} className="inline mr-1" />
                    Reduce
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-xs text-gray-500 mb-2">
                  Current expiry: {new Date(studio.userValidUntil).toLocaleDateString()}
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder={`Days to ${daysMode}`}
                    className="bg-white border-gray-200 focus:ring-primary focus:border-primary pr-12 font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                    DAYS
                  </div>
                </div>
                {parseInt(days) > 0 && (
                  <p className={`text-xs mt-2 ${daysMode === 'reduce' ? 'text-orange-600' : 'text-green-600'}`}>
                    New expiry: {(() => {
                      const newDate = new Date(studio.userValidUntil)
                      newDate.setDate(newDate.getDate() + (daysMode === 'reduce' ? -parseInt(days) : parseInt(days)))
                      return newDate.toLocaleDateString()
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
