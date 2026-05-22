import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Calendar,
  User,
  Briefcase,
  StickyNote
} from 'lucide-react';
import { updateCrewNotes } from '../../../services/crewService';
import ReactDOM from "react-dom/client";
import { Success } from "../../../Components/Success";
import { Error } from "../../../Components/Error";

/**
 * Sidebar for displaying detailed information about a crew or staff member
 */
export const CrewSidebar = ({ person, isOpen, onClose, onEdit, onDelete, onNotesUpdate, openedFrom, crewEdit, staffEdit, isStaff = false }) => {
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const anyEdit = crewEdit || staffEdit;

  const canSeeNotes = anyEdit;

  const canSaveNotes =
    (openedFrom === 'crew' && crewEdit) ||
    (openedFrom === 'staff' && staffEdit);

  const canManageMember = anyEdit;




  useEffect(() => {
    if (person) {
      setNotes(person.notes || '');
      setIsEditingNotes(false);
    }
  }, [person]);

  const handleSaveNotes = async () => {
    if (!person) return;

    setIsSavingNotes(true);
    try {
      await updateCrewNotes(person.id, notes);
      setIsSavingNotes(false);
      setIsEditingNotes(false);

      // Show success toast
      const successDiv = document.createElement("div");
      document.body.appendChild(successDiv);
      const root = ReactDOM.createRoot(successDiv);
      root.render(
        <Success
          title="Notes Updated"
          autoClose={true}
          autoCloseDelay={3000}
          makeDarker={true}
          onClose={() => {
            root.unmount();
            document.body.removeChild(successDiv);
          }}
        >
          Notes for {person.name} have been updated.
        </Success>
      );

      // Refresh data in parent
      if (onNotesUpdate) onNotesUpdate(person.id, notes);

      // Close sidebar after successful edit as requested
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (err) {
      console.error('Error saving notes:', err);
      setIsSavingNotes(false);

      // Show error toast
      const errorDiv = document.createElement("div");
      document.body.appendChild(errorDiv);
      const root = ReactDOM.createRoot(errorDiv);
      root.render(
        <Error
          title="Update Failed"
          variant="error"
          makeDarker={true}
          onClose={() => {
            root.unmount();
            document.body.removeChild(errorDiv);
          }}
        >
          Failed to update notes. Please try again.
        </Error>
      );
    }
  };

  // Get role color
  const getRoleColor = (roleName) => {
    if (!roleName) return 'bg-gray-100 text-gray-700';

    const colors = {
      'manager': 'bg-purple-100 text-purple-700',
      'editor': 'bg-blue-100 text-blue-700',
      'photographer': 'bg-green-100 text-green-700',
      'videographer': 'bg-amber-100 text-amber-700',
      'designer': 'bg-pink-100 text-pink-700',
      'assistant': 'bg-indigo-100 text-indigo-700',
    };

    const roleLower = roleName.toLowerCase();
    return colors[roleLower] || 'bg-gray-100 text-gray-700';
  };

  const getInviteStatus = (invite) => {
    if (!invite) return 'pending';

    if (invite.used === true) return 'accepted';
    const now = new Date();
    const expiry = new Date(invite.expiresAt);

    if (invite.used === false && expiry > now) return 'pending';
    if (invite.used === false && expiry <= now) return 'rejected';
    return 'pending';
  };

  const getStatusMeta = (status = 'pending') => {
    const MAP = {
      accepted: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
    };

    return MAP[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {person && (
          <div className='h-full flex flex-col'>
            {/* Header */}
            <div className='sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10'>
              <div>
                <h2 className='text-xl font-bold text-primary-dark'>
                  {isStaff ? 'Staff Profile' : 'Crew Profile'}
                </h2>
                <div className='flex items-center gap-2 mt-1'>
                  {isStaff ? (
                    (() => {
                      const status = getInviteStatus(person.invite);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusMeta(status)}`}>
                          {status}
                        </span>
                      );
                    })()
                  ) : (
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700'>
                      Crew Member
                    </span>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-1'>
                {canManageMember && (
                  <>
                    <button
                      onClick={() => onEdit(person)}
                      className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600'
                      title='Edit Member'
                    >
                      <Edit2 size={18} />
                    </button>

                    <button
                      onClick={() => onDelete(person)}
                      className='p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500'
                      title='Delete Member'
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600'
                >
                  <X size={20} />
                </button>

              </div>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-y-auto p-6 space-y-8'>
              {/* Basic Info Section */}
              <div>
                <h3 className='text-lg font-semibold text-primary-dark mb-4'>
                  Basic Information
                </h3>
                <div className='flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100'>
                  {person.photo ? (
                    <img
                      src={person.photo}
                      alt={person.name}
                      className='w-14 h-14 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0'
                    />
                  ) : (
                    <div className='w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary-dark font-bold text-2xl shadow-sm border border-gray-100 shrink-0'>
                      {person.name?.charAt(0)}
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='text-lg font-bold text-gray-900 truncate'>{person.name}</h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <Briefcase size={12} className='text-gray-400' />
                      <span className='text-xs text-gray-500 font-medium'>{person.position}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div>
                <h3 className='text-lg font-semibold text-primary-dark mb-4'>
                  Contact Details
                </h3>
                <div className='grid grid-cols-1 gap-4'>
                  <div className='flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-light transition-colors'>
                    <div className='p-2 bg-blue-50 rounded-lg text-blue-600'>
                      <Mail size={18} />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>Email Address</p>
                      <p className='text-sm font-medium text-gray-700 truncate'>{person.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-light transition-colors'>
                    <div className='p-2 bg-green-50 rounded-lg text-green-600'>
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>Phone Number</p>
                      <p className='text-sm font-medium text-gray-700'>{person.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Information (Staff only) */}
              {isStaff && person.roleName && (
                <div>
                  <h3 className='text-lg font-semibold text-primary-dark mb-4'>Role & Permissions</h3>
                  <div>
                    <p className='text-sm text-gray-500 mb-2'>Assigned Role</p>
                    <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getRoleColor(person.roleName)}`}>
                      {person.roleName}
                    </span>
                  </div>
                  {person.permissions && person.permissions.length > 0 && (
                    <div className='mt-4'>
                      <p className='text-sm text-gray-500 mb-2'>Permissions</p>
                      <div className='flex flex-wrap gap-2'>
                        {person.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className='px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs'
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assignment Information - Only for Crew */}
              {!isStaff && (
                <div>
                  <h3 className='text-lg font-semibold text-primary-dark mb-4'>Assigned Projects</h3>
                  {person.assignedProjects && person.assignedProjects.length > 0 ? (
                    <div className='space-y-3'>
                      {person.assignedProjects.map((project) => (
                        <div
                          key={project.projectId}
                          className='bg-primary-light/10 border border-primary-light rounded-lg p-4 hover:bg-primary-light/20 transition-colors'
                        >
                          <div className='flex items-start justify-between mb-2'>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-primary-dark'>{project.projectTitle}</h4>
                              <p className='text-xs text-gray-600 mt-1'>{project.projectType}</p>
                            </div>
                          </div>
                          <div className='mt-3 flex items-center gap-4 text-xs text-gray-600'>
                            <div className='flex items-center gap-1.5'>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              <span className='font-medium'>Start:</span>
                              <span>{new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <span className='text-gray-400'>→</span>
                            <div className='flex items-center gap-1.5'>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                              </svg>
                              <span className='font-medium'>End:</span>
                              <span>{new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-500 italic'>Not currently assigned to any project</p>
                  )}
                </div>
              )}

              {/* Notes Section */}
              {/* Notes Section */}
              {canSeeNotes && (
                <div>
                  <h3 className='text-lg font-semibold text-primary-dark mb-4'>Notes</h3>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Add notes about this team member...'
                    rows={6}
                    readOnly={!canSaveNotes}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
        ${canSaveNotes
                        ? 'focus:ring-2 focus:ring-primary-dark focus:border-primary-dark'
                        : 'bg-gray-100 cursor-not-allowed text-gray-600'
                      }`}
                  />

                  {canSaveNotes && (
                    <button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className='mt-3 w-full bg-primary-dark text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2'
                    >
                      {isSavingNotes ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Notes'
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Added On Info */}
              {person.addedDate && (
                <div className='flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl'>
                  <Calendar size={18} className='text-gray-400' />
                  <div>
                    <p className='text-[10px] text-gray-400 font-bold uppercase tracking-wider'>Team Member Since</p>
                    <p className='text-sm font-semibold text-gray-900'>{person.addedDate}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
