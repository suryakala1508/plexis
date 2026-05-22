import React, { useState, useEffect, useRef } from 'react'
import { Plus, CheckCircle2, Circle, Calendar, Edit2, Loader2, X, Trash2 } from 'lucide-react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { formatDate } from "../../../../utils/formatUtils";
import { PermissionGate } from '@/Pages/utils/permissions';


export default function ProgressTimeline({
  timeline = [],
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  projectClientEmail
}) {
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [editEntry, setEditEntry] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const timelineRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    completedAt: dayjs().format('YYYY-MM-DD'),
    status: '',
    customStatus: '',
    sendToClient: false
  })

  const PROJECT_STATUSES = [
    'Planning',
    'In Progress',
    'Review',
    'Completed',
    'On Hold',
    'Cancelled'
  ]

  // Sort timeline by date (oldest first) - newest will be on the right
  const sortedTimeline = [...timeline].sort(
    (a, b) =>
      new Date(a.completedAt || a.date) - new Date(b.completedAt || b.date)
  )

  useEffect(() => {
    if (timelineRef.current) {
      // Scroll to the right (newest items) when timeline updates
      // scrollWidth - clientWidth gives us the rightmost position
      const scrollToRight = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
      timelineRef.current.scrollTo({
        left: scrollToRight,
        behavior: 'smooth'
      })
    }
  }, [sortedTimeline.length])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)

    const finalStatus = form.status === 'custom' ? form.customStatus : form.status

    const payload = {
      title: form.title,
      description: form.description,
      completedAt: form.completedAt, // Send as string, backend will convert
      status: finalStatus,
      sendToClient: Boolean(form.sendToClient) // Explicitly convert to boolean
    }

    try {
      if (editMode) {
        await onUpdateEntry(editIndex, payload)
      } else {
        await onAddEntry(payload)
      }
      setOpen(false)
      setEditMode(false)
      setEditIndex(null)
      setEditEntry(null)
      setForm({
        title: '',
        description: '',
        completedAt: dayjs().format('YYYY-MM-DD'),
        status: '',
        customStatus: '',
        sendToClient: false
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (index) => {
    const entry = sortedTimeline[index]
    // Check if status is custom (not in predefined list)
    const isCustomStatus = entry.status && !PROJECT_STATUSES.includes(entry.status)
    setForm({
      title: entry.title || entry.step,
      description: entry.description || '',
      completedAt: dayjs(entry.completedAt || entry.date).format('YYYY-MM-DD'),
      status: isCustomStatus ? 'custom' : (entry.status || ''),
      customStatus: isCustomStatus ? entry.status : '',
      sendToClient: false
    })
    setEditMode(true)
    setEditIndex(index)
    setEditEntry(entry) // Store the original entry for deletion
    setOpen(true)
  }


  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={16} className="text-primary-dark" />
            Project <span className="text-primary-dark">Timeline</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Key milestones and progress
          </p>
        </div>

        <PermissionGate page="4" component="4_1" action="edit">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 bg-primary-dark hover:bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Plus size={14} /> Add Step
          </button>
        </PermissionGate>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="relative overflow-x-auto overflow-y-hidden no-scrollbar flex-1 min-h-0 flex items-center"
      >
        {sortedTimeline.length === 0 ? (
          <div className="w-full text-center py-6 text-gray-500 italic text-sm">
            No progress recorded yet
          </div>
        ) : (
          <div className="relative min-w-max px-8 py-4">
            {/* Timeline line - aligned to circle centers */}
            <div className="absolute top-[38px] left-[70px] right-[70px] h-[2px] bg-gray-200 z-0" />

            <div className="flex gap-4">
              {sortedTimeline.map((entry, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 w-[140px] flex flex-col items-center text-center"
                >
                  {/* Circle on Top */}
                  <div className="relative z-10 mb-4 h-11 flex items-center justify-center">
                    <div
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center
                        border-2 border-white shadow-sm ring-4 ring-transparent
                        ${entry.completedAt ? 'bg-primary-dark ring-primary-dark/10' : 'bg-gray-300 ring-gray-100'}
                      `}
                    >
                      {entry.completedAt ? (
                        <CheckCircle2 size={16} className="text-white" />
                      ) : (
                        <Circle size={14} className="text-gray-500" />
                      )}
                    </div>

                    {/* Edit Button */}
                    <PermissionGate page="4" component="4_1" action="edit">
                      <button
                        onClick={() => handleEdit(index)}
                        className="absolute -top-1 -right-1 bg-white text-primary-dark p-1 rounded-full shadow-md border border-gray-100 hover:scale-110 transition-all z-20"
                        title="Edit milestone"
                      >
                        <Edit2 size={10} />
                      </button>
                    </PermissionGate>
                  </div>

                  {/* Labels Below Circle */}
                  <div className="mb-3 w-full">
                    {entry.status ? (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary-dark mb-1">
                        {entry.status}
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        MILESTONE
                      </div>
                    )}

                    <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1">
                      {entry.title || entry.step}
                    </h4>

                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500">
                      <Calendar size={10} />
                      {formatDate(entry.completedAt || entry.date)}
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-[10px] text-gray-600 leading-relaxed w-full min-h-[44px] flex items-center justify-center shadow-sm">
                    {entry.description || 'No description added'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setOpen(false)
              setEditMode(false)
              setEditIndex(null)
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-primary-dark">
                  {editMode ? 'Edit Milestone' : 'Add Milestone'}
                </h2>
                <button
                  onClick={() => {
                    setOpen(false)
                    setEditMode(false)
                    setEditIndex(null)
                    setEditEntry(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    required
                    placeholder="Enter milestone title"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter milestone description (max 200 characters)"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm resize-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                    value={form.description}
                    maxLength={200}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.description.length}/200 characters
                  </p>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <DatePicker
                    value={form.completedAt ? dayjs(form.completedAt) : null}
                    onChange={(d) =>
                      setForm({
                        ...form,
                        completedAt: d ? d.format('YYYY-MM-DD') : ''
                      })
                    }
                    className="w-full"
                    format="DD/MM/YYYY"
                    minDate={dayjs()}
                  />
                </div>

                {/* Project Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Status *
                  </label>
                  <select
                    required
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value, customStatus: '' })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    {PROJECT_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                    <option value="custom">Custom Status</option>
                  </select>
                </div>

                {/* Custom Status Field */}
                {form.status === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Status *
                    </label>
                    <input
                      required={form.status === 'custom'}
                      placeholder="Enter custom status"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                      value={form.customStatus}
                      onChange={(e) =>
                        setForm({ ...form, customStatus: e.target.value })
                      }
                    />
                  </div>
                )}

                {/* Send to Client Checkbox */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendToClient"
                      checked={form.sendToClient}
                      onChange={(e) =>
                        setForm({ ...form, sendToClient: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-dark focus:ring-primary-dark border-gray-300 rounded"
                      disabled={!projectClientEmail}
                    />
                    <label htmlFor="sendToClient" className={`text-sm ${projectClientEmail ? 'text-gray-700' : 'text-gray-400'}`}>
                      Send update to client via email
                    </label>
                  </div>
                  {!projectClientEmail && (
                    <p className="text-xs text-amber-600 ml-6">
                      ⚠️ No client email found for this project. Please add a client email in project settings.
                    </p>
                  )}
                  {projectClientEmail && form.sendToClient && (
                    <p className="text-xs text-green-600 ml-6">
                      ✓ Email will be sent to: {projectClientEmail}
                    </p>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                  {editMode && onDeleteEntry && editEntry && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      setEditMode(false)
                      setEditIndex(null)
                      setEditEntry(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {editMode ? 'Update Milestone' : 'Add Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Delete Milestone</h2>
                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the milestone <strong>"{editEntry?.title || 'this milestone'}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This will permanently remove this milestone from the project timeline. This action cannot be reversed.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true)
                    try {
                      await onDeleteEntry(editEntry)
                      setShowDeleteConfirm(false)
                      setOpen(false)
                      setEditMode(false)
                      setEditIndex(null)
                      setEditEntry(null)
                      setForm({
                        title: '',
                        description: '',
                        completedAt: dayjs().format('YYYY-MM-DD'),
                        status: '',
                        customStatus: '',
                        sendToClient: false
                      })
                    } catch (error) {
                      // Error handled
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting && <Loader2 size={16} className="animate-spin" />}
                  {isDeleting ? 'Deleting...' : 'Delete Milestone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
