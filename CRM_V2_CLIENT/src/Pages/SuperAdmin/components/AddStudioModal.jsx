import React, { useState } from 'react'
import { X } from 'lucide-react'
import { createStudio } from '../../../services/superadminService'
import { Button } from '../../../Components/ui/button'
import { Input } from '../../../Components/ui/input'
import { Label } from '../../../Components/ui/label'
import { Error } from '../../../Components/Error'

export const AddStudioModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    studioName: '',
    email: '',
    phone: '',
    storageLimit: 10 // Default 10 GB
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'storageLimit' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.studioName) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await createStudio(formData)
      setFormData({
        name: '',
        studioName: '',
        email: '',
        phone: '',
        storageLimit: 10
      })
      onSuccess()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create studio')
      console.error('Error creating studio:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)}>{errorMessage}</Error>
      )}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Add New Studio</h2>
          <button
            onClick={onClose}
            className="text-gray-400 p-2 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Studio Owner Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="studioName">Studio Display Name *</Label>
              <Input
                id="studioName"
                name="studioName"
                type="text"
                value={formData.studioName}
                onChange={handleChange}
                placeholder="ABC Photography Studio"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="studio@example.com"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="storageLimit">Initial Storage Limit (GB) *</Label>
              <Input
                id="storageLimit"
                name="storageLimit"
                type="number"
                min="1"
                step="0.1"
                value={formData.storageLimit}
                onChange={handleChange}
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Default storage allocation for this studio</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-100 p-2 hover:bg-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary p-2 hover:bg-primary-dark text-white"
            >
              {loading ? 'Creating...' : 'Create Studio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

