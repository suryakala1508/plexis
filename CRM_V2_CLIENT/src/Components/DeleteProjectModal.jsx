import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * DeleteProjectModal
 * Requires the user to type the project title exactly before the delete button activates.
 *
 * Props:
 *   open        – boolean
 *   projectTitle – string  (the name the user must type)
 *   onCancel    – () => void
 *   onConfirm   – () => Promise<void>  (called when confirmed; should handle errors internally)
 *   isDeleting  – boolean  (show spinner while in-flight)
 */
const DeleteProjectModal = ({ open, projectTitle, onCancel, onConfirm, isDeleting }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // Reset input every time modal opens
  useEffect(() => {
    if (open) {
      setInputValue('');
      // Small delay so the element is mounted
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  const confirmed = inputValue.trim() === (projectTitle || '').trim();

  const handleConfirm = () => {
    if (!confirmed || isDeleting) return;
    onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Red accent header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Delete Project</h2>
              <p className="text-xs text-red-600 font-medium mt-0.5">This action is permanent and cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Warning notice */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <p className="text-sm text-red-700 font-medium mb-1.5">All of the following will be permanently deleted:</p>
            <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
              <li>All project files, galleries & media</li>
              <li>Client info, timeline & progress data</li>
              <li>Payment schedules, expenses & budgets</li>
              <li>Crew assignments & inventory records</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <label className="block mb-1.5">
            <span className="text-sm font-medium text-gray-700">
              Type the project name to confirm:{' '}
              <span className="font-semibold text-gray-900 select-all">{projectTitle}</span>
            </span>
          </label>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isDeleting}
            placeholder="Enter project name exactly"
            className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors
              ${inputValue.length > 0
                ? confirmed
                  ? 'border-red-400 ring-2 ring-red-100'
                  : 'border-gray-300 ring-2 ring-gray-100'
                : 'border-gray-300'
              }
              disabled:bg-gray-50 disabled:cursor-not-allowed`}
            autoComplete="off"
            spellCheck={false}
          />
          {inputValue.length > 0 && !confirmed && (
            <p className="text-xs text-gray-400 mt-1.5">Name doesn't match — please type it exactly.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed || isDeleting}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${confirmed && !isDeleting
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200'
                : 'bg-red-200 text-red-400 cursor-not-allowed'
              }`}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={15} />
                Delete Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProjectModal;
