import React, { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { PermissionGate } from '@/Pages/utils/permissions';

/**
 * InventorySidebar Component
 * Shows detailed information about selected inventory item
 * Includes editable notes field
 */

// Category color mapping
const getCategoryColor = (category) => {
  const colors = {
    Camera: 'bg-blue-100 text-blue-800',
    Lens: 'bg-purple-100 text-purple-800',
    Audio: 'bg-green-100 text-green-800',
    Light: 'bg-amber-100 text-amber-800',
    Storage: 'bg-orange-100 text-orange-800',
    Uncategorized: 'bg-gray-100 text-gray-800',
  };
  const normalizedCategory = category?.trim().charAt(0).toUpperCase() + category?.trim().slice(1).toLowerCase();
  return colors[normalizedCategory] || 'bg-gray-100 text-gray-800';
};

const formatDate = (dateString, useDashes = false) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  const separator = useDashes ? "-" : "/";
  return `${day}${separator}${month}${separator}${year}`;
};

export const InventorySidebar = ({ item, isOpen, onClose, onUpdateNotes }) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (item) {
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      await onUpdateNotes(item.id, notes);
      toast.success('Notes updated successfully! 📝');
      setIsEditingNotes(false);
      setTimeout(() => {
        setIsSaving(false);
        onClose(); // Close sidebar after successful save
      }, 500);
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to update notes. Please try again.');
      setIsSaving(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto animate-slideInRight ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-dark">Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-primary-dark mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Name
                </label>
                <p className="text-base text-gray-900">{item.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Category
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(item.category)}`}
                >
                  {item.category}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <p className="text-base text-gray-700">
                  {item.description || "No description provided"}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Quantity
                </label>
                <p className="text-base text-gray-900">{item.quantity}</p>
              </div>
            </div>
          </div>

          {/* Status & Assignment */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-primary-dark mb-4">
              Status & Assignment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Available Count
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${item.availableCount > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {item.availableCount} available
                  </span>
                  <span className="text-sm text-gray-500">
                    of {item.quantity} total
                  </span>
                </div>
              </div>

              {/* Assigned To section – mirror Crew "Assigned Projects" style */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Assigned To
                </label>
                {item.assignedProjects && item.assignedProjects.length > 0 ? (
                  <div className="space-y-3">
                    {item.assignedProjects.map((assignment) => (
                      <div
                        key={assignment.projectId}
                        className="bg-primary-light/10 border border-primary-light rounded-lg p-4 hover:bg-primary-light/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary-dark">
                              {assignment.projectTitle}
                            </h4>
                            {assignment.quantity != null && (
                              <p className="text-xs text-gray-700 mt-1">
                                {assignment.quantity} assigned
                              </p>
                            )}
                          </div>
                        </div>
                        {(assignment.assignedFrom || assignment.assignedTo) && (
                          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                            {assignment.assignedFrom && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">Start:</span>
                                <span>
                                  {formatDate(assignment.assignedFrom)}
                                </span>
                              </div>
                            )}
                            {assignment.assignedFrom &&
                              assignment.assignedTo && (
                                <span className="text-gray-400">→</span>
                              )}
                            {assignment.assignedTo && (
                              <div className="flex items-center gap-1.5">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">End:</span>
                                <span>
                                  {formatDate(assignment.assignedTo)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-gray-900">
                    Currently unassigned
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  Added Date
                </label>
          <p className="text-base text-gray-900">
  {item.addedDate
    ? new Date(item.addedDate).toLocaleDateString('en-GB')
    : "N/A"}
</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <PermissionGate page="8" component="8_1" action="edit">
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary-dark">
                  Notes
                </h3>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-dark hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleSaveNotes();
                        setIsEditingNotes(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-primary-dark hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNotes(item.notes || '');
                        setIsEditingNotes(false);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEditingNotes ? "Add notes about this item..." : "No notes added yet"}
                  rows={8}
                  readOnly={!isEditingNotes}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-lg outline-none transition-all resize-none text-sm text-gray-700 shadow-sm ${isEditingNotes
                    ? 'bg-white focus:ring-2 focus:ring-primary-dark focus:border-transparent'
                    : 'bg-gray-50 cursor-default'
                    }`}
                />
              </div>
            </div>
          </PermissionGate>
        </div>
      </div>
    </>
  );
};

