import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import { PermissionGate } from '@/Pages/utils/permissions';
import { getClientFollowUps, deleteFollowUp } from '../../../services/followUpService';
import { LoadingSpinner } from '../../../Components/Loading/LoadingSpinner';
import { DeleteConfirmationModal } from '../../../Components/DeleteConfirmationModal';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatUtils';

export const ClientSidebar = ({
    client,
    isOpen,
    onClose,
    onEdit,
    onDelete,
    onUpdateNotes,
    onAddFollowUp
}) => {
    const [notes, setNotes] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [followUps, setFollowUps] = useState([]);
    const [followUpsLoading, setFollowUpsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [followUpToDelete, setFollowUpToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (client) {
            setNotes(client.notes || '');
            setIsEditingNotes(false);
            setFollowUps([]); // Clear old follow-ups immediately
            fetchFollowUps();
        } else {
            setFollowUps([]); // Clear if no client
        }
    }, [client]);

    const fetchFollowUps = async () => {
        if (!client?.id) return;
        setFollowUps([]); // Clear old data before loading new
        setFollowUpsLoading(true);
        try {
            const data = await getClientFollowUps(client.id);
            setFollowUps(data);
        } catch (error) {
            console.error("Error fetching client follow-ups:", error);
        } finally {
            setFollowUpsLoading(false);
        }
    };

    const handleDeleteClick = (fu) => {
        setFollowUpToDelete(fu);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!followUpToDelete) return;

        setIsDeleting(true);
        try {
            await deleteFollowUp(followUpToDelete._id);
            toast.success('Follow-up deleted');
            setFollowUps(prev => prev.filter(fu => fu._id !== followUpToDelete._id));
            setDeleteModalOpen(false);
            setFollowUpToDelete(null);
        } catch (err) {
            toast.error('Failed to delete follow-up');
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const handleRefreshFollowUps = () => {
            fetchFollowUps();
        };
        const handleUpdateFollowUpsData = (e) => {
            if (e.detail) {
                const { action, payload } = e.detail;
                if (action === 'add') {
                    setFollowUps(prev => [payload, ...prev]);
                } else if (action === 'update') {
                    setFollowUps(prev => prev.map(fu => fu._id === payload._id ? payload : fu));
                }
            }
        };

        window.addEventListener('refreshFollowUps', handleRefreshFollowUps);
        window.addEventListener('updateFollowUpsData', handleUpdateFollowUpsData);
        
        return () => {
            window.removeEventListener('refreshFollowUps', handleRefreshFollowUps);
            window.removeEventListener('updateFollowUpsData', handleUpdateFollowUpsData);
        };
    }, [client?.id]);

    if (!isOpen || !client) return null;

    const getStatusStyle = (status) => {
        const styles = {
            'Ongoing': 'bg-green-100 text-green-800',
            'Completed': 'bg-gray-100 text-gray-800',
            'On Hold': 'bg-yellow-100 text-yellow-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    const handleSaveNotes = () => {
        if (onUpdateNotes) {
            onUpdateNotes(client.id, notes);
        }
        setIsEditingNotes(false);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto animate-slideInRight ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary-dark">Client Details</h2>
                    <div className="flex items-center gap-2">
                        <PermissionGate page="4" component="4_1" action="edit">
                            <button
                                onClick={() => onEdit(client)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                                title="Edit Client"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(client.id)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                                title="Delete Client"
                            >
                                <Trash2 size={18} />
                            </button>
                        </PermissionGate>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                            aria-label="Close sidebar"
                        >
                            <X size={20} />
                        </button>
                    </div>
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
                                    Client Name
                                </label>
                                <p className="text-base text-gray-900">{client.name}</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Relation
                                </label>
                                <p className="text-base text-gray-900">{client.relation || '- -'}</p>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Status
                                </label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(client.status)}`}>
                                    {client.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-primary-dark mb-4">
                            Contact Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Email Address
                                </label>
                                <p className="text-base text-gray-900 break-words">{client.email || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Phone Number
                                </label>
                                <p className="text-base text-gray-900">{client.phone || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Project Status */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-primary-dark mb-4">
                            Project Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Associated Project
                                </label>
                                <p className="text-base text-gray-900 font-medium">
                                    {client.projectTitle || 'N/A'}
                                </p>
                                {client.projectType && (
                                    <p className="text-xs text-primary-dark font-semibold uppercase tracking-wider mt-1">
                                        {client.projectType}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Onboarded Date
                                </label>
                                <p className="text-base text-gray-900">{client.onboardedOn || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Follow-ups Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary-dark">
                                Follow Ups
                            </h3>
                            <PermissionGate page="4" component="4_1" action="edit">
                                <button
                                    onClick={onAddFollowUp}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-dark hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <Plus size={14} />
                                    Add Follow Up
                                </button>
                            </PermissionGate>
                        </div>

                        {followUpsLoading ? (
                            <div className="flex justify-center py-4">
                                <LoadingSpinner size={20} />
                            </div>
                        ) : followUps.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                {followUps.map((fu) => (
                                    <div key={fu._id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`w-2 h-2 rounded-full ${fu.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                                    <p className="text-sm font-semibold text-gray-900">{fu.reason}</p>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {formatDate(fu.date)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(fu.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                    </span>
                                                    <span className="capitalize">{fu.type}</span>
                                                </div>
                                                {fu.notes && <p className="text-xs text-gray-600 mt-2 italic">"{fu.notes}"</p>}
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <PermissionGate page="4" component="4_1" action="edit">
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.dispatchEvent(new CustomEvent('editFollowUp', { detail: fu }));
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Edit Follow-up"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(fu);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                            title="Delete Follow-up"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </PermissionGate>
                                                {fu.status === 'completed' && (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase mt-1">Done</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-xs text-gray-500">No follow-ups recorded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <PermissionGate page="4" component="4_1" action="edit">
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
                                            onClick={handleSaveNotes}
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-primary-dark hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                setNotes(client.notes || '');
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
                                    placeholder={isEditingNotes ? "Add notes about this client..." : "No notes added yet"}
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

            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Follow-up"
                message="Are you sure you want to delete this follow-up? This action cannot be undone."
                itemLabel={followUpToDelete?.reason}
                loading={isDeleting}
            />
        </>
    );
};
