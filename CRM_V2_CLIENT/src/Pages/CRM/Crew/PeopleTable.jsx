import React from 'react';
import { useState } from 'react';
import { PermissionGate } from '@/Pages/utils/permissions';
import { Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import { Toast } from '../../../Components/ui/toast';
/**
 * Toast Notification Component
 */


/**
 * Flexible table component for displaying Crew or Staff members
 * @param {Array} people - Array of people to display
 * @param {Function} onPersonClick - Handler for row click
 * @param {string} selectedPersonId - ID of currently selected person
 * @param {string} type - 'crew' or 'staff' to determine which columns to show
 */
export const PeopleTable = ({ people, onPersonClick, selectedPersonId, type = 'crew', onEdit, onDelete }) => {
  const isStaff = type === 'staff';

  const componentId = isStaff ? "7_2" : "7_1";

  // Toast state
  const [toast, setToast] = useState(null);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
  });

  // Get role meta (label + text color) for staff members using roleId
  const getRoleMeta = (roleId) => {
    const ROLE_MAP = {
      '2': { label: 'Editor', textColor: 'text-purple-700' },
      '3': { label: 'Sales', textColor: 'text-blue-700' },
      '4': { label: 'Operations', textColor: 'text-amber-700' },
      '5': { label: 'Photographers', textColor: 'text-green-700' },
    };

    return (
      ROLE_MAP[roleId] || {
        label: 'Unknown',
        textColor: 'text-gray-700',
      }
    );
  };

  /* ---------------- STATUS META ---------------- */
  const getStatusMeta = (status = 'pending') => {
    const MAP = {
      accepted: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };

    return MAP[status] || 'bg-gray-100 text-gray-600';
  };

  const getInviteStatus = (invite) => {
    if (!invite) return 'pending';

    if (invite.used === true) return 'accepted';
    const now = new Date();
    const expiry = new Date(invite.expiresAt);

    if (invite.used === false && expiry > now) return 'pending';
    if (invite.used === false && expiry <= now) return 'rejected';
  };

  const handleDelete = (person) => {
    showConfirm(
      "Delete member?",
      `${person.name} will be permanently removed from your ${isStaff ? 'staff' : 'crew'}.`,
      async () => {
        try {
          await onDelete(person);
        } catch (error) {
          // Show error toast
          setToast({
            message: error?.message || `Failed to delete ${person.name}. Please try again.`,
            type: 'error'
          });
        }
      }
    );
  };

  const handleUpdate = (person) => {
    showConfirm(
      "Edit member details?",
      `You are about to edit ${person.name}'s information.`,
      async () => {
        try {
          await onEdit(person);

          // Show success toast (the CrewModal will also show its own toast on save)
          // setToast({
          //   message: `Opening editor for ${person.name}...`,
          //   type: 'info'
          // });
        } catch (error) {
          // Show error toast
          setToast({
            message: error?.message || `Failed to open editor. Please try again.`,
            type: 'error'
          });
        }
      }
    );
  };

  const showConfirm = (title, description, onConfirm) => {
    setConfirmState({ open: true, title, description, onConfirm });
  };

  const handleConfirm = async () => {
    const cb = confirmState.onConfirm;
    setConfirmState(prev => ({ ...prev, open: false }));
    if (cb) {
      await cb();
    }
  };

  if (people.length === 0) {
    return (
      <div className='bg-white border-2 border-gray-200 rounded-xl shadow-sm p-12 text-center'>
        <div className='text-gray-400 mb-4'>
          <svg className='w-20 h-20 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
          </svg>
        </div>
        <p className='text-gray-700 font-bold text-lg mb-2'>
          No {isStaff ? 'staff' : 'crew'} members yet
        </p>
        <p className='text-sm text-gray-500'>
          Add your first {isStaff ? 'staff member' : 'crew member'} to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(v) => setConfirmState(prev => ({ ...prev, open: v }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={handleConfirm}
      />

      {/* Table & Cards Container */}
      <div id="crew-table" className='bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow'>

        {/* Desktop Table View */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full min-w-[800px]'>
            <thead>
              <tr className='bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200'>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Position
                </th>
                {isStaff && (
                  <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Role
                  </th>
                )}
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Email
                </th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Phone
                </th>
                <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                  Assigned To
                </th>
                {isStaff && (
                  <th className='px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Status
                  </th>
                )}
                <PermissionGate page="7" component={componentId} action="edit">
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody>
              {people.map((person, index) => {
                const isSelected = selectedPersonId === person.id;

                const rowBg = isSelected
                  ? 'bg-primary-light/40'
                  : index % 2 === 0
                    ? 'bg-white'
                    : 'bg-gray-50';

                return (
                  <tr
                    key={person.id}
                    onClick={() => onPersonClick(person)}
                    className={`${rowBg} border-b border-gray-100 hover:bg-primary-light/20 cursor-pointer transition-all hover:shadow-sm`}
                  >
                    {/* Name */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-3'>
                        <div className="flex flex-col">
                          <span className='font-semibold text-sm text-gray-900'>{person.name || 'N/A'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className='px-4 py-3'>
                      <span className='text-sm text-gray-700'>{person.position || 'N/A'}</span>
                    </td>

                    {/* Role (Staff only) */}
                    {isStaff && (
                      <td className='px-4 py-3'>
                        {person.role ? (() => {
                          const { label, textColor } = getRoleMeta(person.role);
                          return (
                            <span className={`text-sm font-bold ${textColor}`}>
                              {label}
                            </span>
                          );
                        })() : (
                          <span className='text-xs text-gray-400 italic'>No Role</span>
                        )}
                      </td>
                    )}

                    {/* Email */}
                    <td className='px-4 py-3'>
                      <span className='text-gray-600 text-sm'>{person.email || 'N/A'}</span>
                    </td>

                    {/* Phone */}
                    <td className='px-4 py-3'>
                      <span className='text-gray-600 text-sm'>{person.phone || '-'}</span>
                    </td>

                    {/* Assigned To */}
                    <td className='px-4 py-3'>
                      {person.assignedProjects?.length > 0 ? (
                        <div className='flex flex-col gap-1'>
                          <div className='flex items-center gap-2'>
                            <span className='px-2 py-0.5 bg-primary-dark text-white rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm'>
                              {person.assignedProjects.length} {person.assignedProjects.length === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className='text-xs text-gray-400 italic font-medium'>Available for assignment</span>
                      )}
                    </td>

                    {/* Status (Staff only) */}
                    {isStaff && (
                      <td className='px-4 py-3'>
                        {(() => {
                          const status = getInviteStatus(person.invite);
                          return (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold capitalize inline-block ${getStatusMeta(status)}`}
                            >
                              {status}
                            </span>
                          );
                        })()}
                      </td>
                    )}

                    {/* ACTIONS */}
                    <PermissionGate page="7" component={componentId} action="edit">
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-2">
                          {/* Edit Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdate(person);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg
                                text-blue-600 hover:bg-blue-50 border-2 border-transparent
                                hover:border-blue-200 active:scale-95 transition-all
                                disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Edit ${person.name}`}
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full mb-2
                              left-1/2 -translate-x-1/2 hidden group-hover:block
                              bg-gray-900 text-white text-xs font-medium
                              px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap
                              after:content-[''] after:absolute after:top-full
                              after:left-1/2 after:-translate-x-1/2
                              after:border-4 after:border-transparent
                              after:border-t-gray-900">
                              Edit {person.name}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(person);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg
                                text-red-600 hover:bg-red-50 border-2 border-transparent
                                hover:border-red-200 active:scale-95 transition-all
                                disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Delete ${person.name}`}
                            >
                              <Trash2 size={16} />
                            </button>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full mb-2
                              left-1/2 -translate-x-1/2 hidden group-hover:block
                              bg-gray-900 text-white text-xs font-medium
                              px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap
                              after:content-[''] after:absolute after:top-full
                              after:left-1/2 after:-translate-x-1/2
                              after:border-4 after:border-transparent
                              after:border-t-gray-900">
                              Delete {person.name}
                            </div>
                          </div>
                        </div>
                      </td>
                    </PermissionGate>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className='md:hidden'>
          <div className='divide-y divide-gray-200'>
            {people.map((person) => (
              <div
                key={person.id}
                onClick={() => onPersonClick(person)}
                className='p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <h3 className='font-bold text-gray-900'>{person.name || 'N/A'}</h3>
                    <p className='text-sm text-gray-600 font-medium'>{person.position || 'N/A'}</p>
                  </div>
                  {isStaff && person.role && (() => {
                    const { label, textColor } = getRoleMeta(person.role);
                    return (
                      <span className={`text-sm font-bold ${textColor}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                    </svg>
                    <span className='truncate'>{person.email || 'N/A'}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                    </svg>
                    <span>{person.phone || '-'}</span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-500'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    {person.assignedProjects?.length > 0 ? (
                      <span className='px-2 py-0.5 bg-primary-dark text-white rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm'>
                        {person.assignedProjects.length} {person.assignedProjects.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    ) : (
                      <span className='italic text-gray-400'>Available for assignment</span>
                    )}
                  </div>
                </div>

                {isStaff && (
                  <div className='flex items-center justify-between border-t border-gray-100 pt-3'>
                    {(() => {
                      const status = getInviteStatus(person.invite);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusMeta(status)}`}>
                          {status}
                        </span>
                      );
                    })()}
                  </div>
                )}

                <PermissionGate page="7" component={componentId} action="edit">
                  <div className={`flex items-center gap-2 pt-3 ${isStaff ? 'border-t-0' : 'border-t border-gray-100'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdate(person);
                      }}
                      className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors'
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(person);
                      }}
                      className='flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors'
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </PermissionGate>
              </div>
            ))}
          </div>
        </div>
      </div>

    </>
  );
};