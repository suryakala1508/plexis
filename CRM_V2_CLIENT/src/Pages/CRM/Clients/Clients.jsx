import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, useLocation } from 'react-router-dom'
import { ClientTable } from './ClientTable'
import { ClientFilters } from './ClientFilters'
import { ClientSidebar } from './ClientSidebar'
import { ClientModal } from './ClientModal'
import { Plus, Download, AlertTriangle } from 'lucide-react'
import { getAllClients, createClient, updateClient, deleteClient } from '../../../services/clientService'
import { LoadingSpinner } from '../../../Components/Loading/LoadingSpinner'
import { Error } from '../../../Components/Error'
import { Success } from '../../../Components/Success'
import { formatDate } from '../../../utils/formatUtils'
import { PageGuard, PermissionGate } from '@/Pages/utils/permissions'
import { ExpiryLock } from '../../../Components/ExpiryLock'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'

import { clientsTourSteps } from '../../../Components/TourGuide/steps/clientsTourSteps'
import { FollowUpModal } from '../../../Components/FollowUpModal'

export const Clients = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const startTourRef = React.useRef(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false)
  const [editingFollowUp, setEditingFollowUp] = useState(null)
  const [editingClient, setEditingClient] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'All'
  })

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Handle client selection from navigation state (e.g., from Calendar)
  useEffect(() => {
    if (location.state?.selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === location.state.selectedClientId)
      if (client) {
        setSelectedClient(client)
        setSidebarOpen(true)

        // Clear state to prevent re-opening if user navigates back/forth
        // we use window.history.replaceState to modify the current history entry
        const state = { ...location.state };
        delete state.selectedClientId;
        navigate(location.pathname, { replace: true, state });
      }
    }
  }, [location.state, clients, navigate, location.pathname])

  useEffect(() => {
    const handleEditFollowUp = (e) => {
      setEditingFollowUp(e.detail)
      setFollowUpModalOpen(true)
    }

    window.addEventListener('editFollowUp', handleEditFollowUp)
    return () => {
      window.removeEventListener('editFollowUp', handleEditFollowUp)
    }
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const clientsData = await getAllClients()

      // Map backend data to frontend format
      const mappedClients = clientsData.map(client => ({
        id: client._id,
        name: client.clientName,
        relation: client.relation,
        email: client.email,
        phone: client.phone || '',
        onboardedOn: formatDate(client.createdAt),
        status: client.status,
        notes: client.notes || '',
        projectTitle: client.projectId?.projectTitle || client.projectId?.projectType || 'Untitled Project',
        projectType: client.projectId?.projectType || '',
        projectStatus: client.projectId?.projectStatus || '',
        hasProject: !!client.projectId,
        rawProjectId: client.projectId // Added for debugging
      }))
      setClients(mappedClients)
    } catch (err) {
      setError(err.message || 'Failed to fetch clients')
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch =
      !filters.search ||
      client.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      client.relation?.toLowerCase().includes(filters.search.toLowerCase()) ||
      client.email?.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus =
      filters.status === 'All' ||
      client.status === filters.status

    return matchesSearch && matchesStatus
  })

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
  }

  const handleAddClient = async (clientData) => {
    try {
      setError(null)
      const newClient = await createClient(clientData)
      // Map backend response to frontend format
      const mappedClient = {
        id: newClient._id,
        name: newClient.clientName,
        relation: newClient.relation,
        email: newClient.email,
        phone: newClient.phone || '',
        onboardedOn: formatDate(newClient.createdAt),
        status: newClient.status,
        notes: newClient.notes || ''
      }
      setClients(prev => [mappedClient, ...prev])
      toast.success('Client added successfully! 🎉')
      window.dispatchEvent(new CustomEvent('refreshRecentActivity'))
      // navigate('/dashboard') - Removed to keep user on Clients page
    } catch (err) {
      // Check for duplicate email error (409 Conflict)
      if (err.response?.status === 409 || err.message?.includes('already exists')) {
        const errorMsg = 'A client with this email already exists'
        toast.error(errorMsg)
        setErrorMessage(errorMsg)
      } else {
        const errorMsg = err.message || 'Failed to add client'
        toast.error(errorMsg)
        setErrorMessage(errorMsg)
      }
      console.error('Error adding client:', err)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleUpdateClient = async (clientData) => {
    try {
      setError(null)
      const updatedClient = await updateClient(clientData.id, clientData)
      // Map backend response to frontend format
      const mappedClient = {
        id: updatedClient._id,
        name: updatedClient.clientName,
        relation: updatedClient.relation,
        email: updatedClient.email,
        phone: updatedClient.phone || '',
        onboardedOn: formatDate(updatedClient.createdAt),
        status: updatedClient.status,
        notes: updatedClient.notes || ''
      }
      setClients(prev => prev.map(client =>
        client.id === clientData.id ? mappedClient : client
      ))
    } catch (err) {
      const errorMsg = err.message || 'Failed to update client'
      setErrorMessage(errorMsg)
      console.error('Error updating client:', err)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleDeleteClient = (clientId) => {
    const client = clients.find(c => c.id === clientId)
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      setError(null)
      await deleteClient(clientToDelete.id)
      setClients(prev => prev.filter(client => client.id !== clientToDelete.id))
      toast.success(`Successfully deleted ${clientToDelete.name}! 🎉`)
      setDeleteDialogOpen(false)
      setClientToDelete(null)
      // Close sidebar if the deleted client was selected
      if (selectedClient?.id === clientToDelete.id) {
        setSidebarOpen(false)
        setSelectedClient(null)
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete client'
      toast.error(errorMsg)
      setErrorMessage(errorMsg)
      console.error('Error deleting client:', err)
    }
  }

  const handleSaveClient = async (clientData) => {
    try {
      if (editingClient) {
        await handleUpdateClient({ ...clientData, id: editingClient.id })
      } else {
        await handleAddClient(clientData)
      }
      setModalOpen(false)
      setEditingClient(null)
      // Close sidebar if it was open (editing from sidebar)
      setSidebarOpen(false)
      setSelectedClient(null)
    } catch (err) {
      // Error is already handled in the individual functions
      // Modal will show error if needed
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
    setModalOpen(true)
  }

  const handleClientClick = (client) => {
    setSelectedClient(client)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setTimeout(() => setSelectedClient(null), 300)
  }

  const handleUpdateNotes = async (clientId, notes) => {
    try {
      // Find the client to get its other data (needed for updateClient if it requires full object)
      const clientToUpdate = clients.find(c => c.id === clientId)
      if (!clientToUpdate) return

      // API call to update client
      await updateClient(clientId, {
        ...clientToUpdate,
        notes: notes
      })

      // Update local state
      setClients(prev => prev.map(c =>
        c.id === clientId ? { ...c, notes } : c
      ))

      // Update selected client if it's the one we're editing
      if (selectedClient?.id === clientId) {
        setSelectedClient(prev => ({ ...prev, notes }))
      }

      toast.success('Notes updated successfully! 📝')
    } catch (err) {
      console.error('Error updating notes:', err)
      toast.error('Failed to update notes')
    }
  }

  const handleExport = () => {
    const csvContent = [
      ['Client Name', 'Relation', 'Email', 'Phone', 'Onboarded On', 'Project Name', 'Status', 'Notes'],
      ...filteredClients.map(client => [
        client.name,
        client.relation,
        client.email,
        client.phone,
        client.onboardedOn,
        client.projectTitle || 'N/A',
        client.status,
        client.notes || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <PageGuard page="5">
      <div className='p-6 lg:pl-4 bg-gray-50 min-h-screen'>
        <TourGuide
          steps={clientsTourSteps}
          tourKey="clients-tour"
          autoStart={false}
          onStartTour={(startFn) => { startTourRef.current = startFn; }}
          onComplete={() => console.log("Clients tour completed")}
        />
        <div className='max-w-[1600px] mx-auto'>
          {/* Header */}
          <div
            id="clients-header"
            className='mb-4 flex items-center justify-between'
          >
            <div>
              <h1 id="clients-header" className='text-3xl font-bold text-primary-dark mb-1'>
                Clients
              </h1>
              <p className='text-sm text-gray-600'>
                Manage your client relationships and track project status
              </p>
            </div>
            <PermissionGate page="4" component="4_1" action="edit">

              <ExpiryLock>
                <button
                  id="clients-add-btn"
                  onClick={() => setModalOpen(true)}
                  disabled={loading}
                  className='flex items-center gap-2 px-5 py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Plus size={18} />
                  Add Client
                </button>
              </ExpiryLock>
            </PermissionGate>
          </div>

          {/* Error Display */}
          {error && (
            <div className='mb-4'>
              <Error message={error} onRetry={fetchClients} />
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className='flex justify-center items-center py-12'>
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Filters */}
              <ClientFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                totalCount={clients.length}
                filteredCount={filteredClients.length}
                onExport={handleExport}
              />

              {/* Table */}
              <div id="clients-list">
                <ClientTable
                  clients={filteredClients}
                  onClientClick={handleClientClick}
                  selectedClientId={selectedClient?.id}
                  onAddFollowUp={(client) => {
                    setSelectedClient(client)
                    setFollowUpModalOpen(true)
                  }}
                />
              </div>

              <ClientSidebar
                client={selectedClient}
                isOpen={sidebarOpen}
                onClose={handleCloseSidebar}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                onUpdateNotes={handleUpdateNotes}
                onAddFollowUp={() => setFollowUpModalOpen(true)}
              />
            </>
          )}

          {/* Follow-up Modal */}
          <FollowUpModal
            isOpen={followUpModalOpen}
            onClose={() => {
              setFollowUpModalOpen(false)
              setEditingFollowUp(null)
            }}
            clientId={selectedClient?.id}
            initialData={editingFollowUp}
            onSuccess={(msg, followUpData, action) => {
              toast.success(msg)
              if (action && followUpData) {
                  // Update follow-ups list directly in sidebar
                  window.dispatchEvent(new CustomEvent('updateFollowUpsData', {
                      detail: { action, payload: followUpData }
                  }))
              } else {
                  // Fallback to fetch all
                  window.dispatchEvent(new CustomEvent('refreshFollowUps'))
              }
            }}
            onError={(msg) => {
              toast.error(msg)
            }}
          />

          {/* Add/Edit Modal */}
          <ExpiryLock>
            <ClientModal
              isOpen={modalOpen}
              onClose={() => {
                setModalOpen(false)
                setEditingClient(null)
              }}
              onSave={handleSaveClient}
              editClient={editingClient}
            />
          </ExpiryLock>

          {/* Delete Confirmation Dialog */}
          {deleteDialogOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-50"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setClientToDelete(null)
                }}
              />

              {/* Modal */}
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 pointer-events-auto animate-fadeIn">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>

                  {/* Content */}
                  <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Client</h2>
                  <p className="text-center text-gray-600 mb-6">
                    Are you sure you want to delete <strong className="text-gray-900">{clientToDelete?.name}</strong>? This action cannot be undone.
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setDeleteDialogOpen(false)
                        setClientToDelete(null)
                      }}
                      className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteClient}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageGuard>
  )
}
