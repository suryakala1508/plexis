import React, { useState } from 'react';
import { X, Info } from 'lucide-react';
import { DatePicker, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { addFollowUp, addClientFollowUp, updateFollowUp } from '../services/followUpService';
import { PermissionGate } from '../Pages/utils/permissions';
import { LoadingSpinner } from './Loading/LoadingSpinner';

export const FollowUpModal = ({
    isOpen,
    onClose,
    leadId,
    clientId,
    initialData,
    onSuccess,
    onError
}) => {
    const [loading, setLoading] = useState(false);
    const [newFollowUp, setNewFollowUp] = useState({
        reason: "",
        date: new Date().toISOString().split("T")[0],
        time: "09:00",
        notes: "",
        type: "call",
    });

    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNewFollowUp({
                    reason: initialData.reason || "",
                    date: initialData.date ? dayjs(initialData.date).format("YYYY-MM-DD") : new Date().toISOString().split("T")[0],
                    time: initialData.date ? dayjs(initialData.date).format("HH:mm") : "09:00",
                    notes: initialData.notes || "",
                    type: initialData.type || "call",
                });
            } else {
                setNewFollowUp({
                    reason: "",
                    date: new Date().toISOString().split("T")[0],
                    time: "09:00",
                    notes: "",
                    type: "call",
                });
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleAddFollowUp = async () => {
        if (!newFollowUp.reason || !newFollowUp.date) {
            if (onError) onError("Please fill in reason and date");
            return;
        }

        setLoading(true);
        try {
            // Combine date and time if time is provided
            let dateToSend = dayjs(newFollowUp.date);
            if (newFollowUp.time) {
                const [hours, minutes] = newFollowUp.time.split(":");
                dateToSend = dateToSend.hour(parseInt(hours, 10)).minute(parseInt(minutes, 10));
            }

            const payload = {
                reason: newFollowUp.reason,
                date: dateToSend.toISOString(),
                notes: newFollowUp.notes || "",
                type: newFollowUp.type || "call",
            };

            if (initialData?._id || initialData?.id) {
                const id = initialData._id || initialData.id;
                const updated = await updateFollowUp(id, payload);
                if (onSuccess) onSuccess("Follow-up updated successfully!", updated, "update");
            } else if (clientId) {
                const added = await addClientFollowUp(clientId, {
                    ...payload,
                    clientId: clientId // Extra safety
                });
                if (onSuccess) onSuccess("Follow-up added successfully!", added, "add");
            } else if (leadId) {
                const added = await addFollowUp(leadId, payload);
                if (onSuccess) onSuccess("Follow-up added successfully!", added, "add");
            }

            onClose();
        } catch (error) {
            console.error("Error saving follow-up:", error);
            if (onError) onError(`Failed to save follow-up: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div
                    className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-primary-dark">
                            {initialData ? "Edit Follow-up" : "Add Follow-up"}
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={newFollowUp.reason}
                                onChange={(e) =>
                                    setNewFollowUp((prev) => ({
                                        ...prev,
                                        reason: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                                placeholder="e.g. Call, Proposal, Meeting"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={newFollowUp.type}
                                onChange={(e) =>
                                    setNewFollowUp((prev) => ({
                                        ...prev,
                                        type: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                            >
                                <option value="call">Call</option>
                                <option value="email">Email</option>
                                <option value="meeting">Meeting</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="offline">Offline</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    value={newFollowUp.date ? dayjs(newFollowUp.date) : null}
                                    onChange={(date) =>
                                        setNewFollowUp((prev) => ({
                                            ...prev,
                                            date: date ? date.format("YYYY-MM-DD") : "",
                                        }))
                                    }
                                    format="DD/MM/YYYY"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                                    placeholder="Select date"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time
                                </label>
                                <div className="relative">
                                    <TimePicker
                                        value={newFollowUp.time ? dayjs(newFollowUp.time, "HH:mm") : null}
                                        onChange={(time) =>
                                            setNewFollowUp((prev) => ({
                                                ...prev,
                                                time: time ? time.format("HH:mm") : "",
                                            }))
                                        }
                                        format="h:mm A"
                                        use12Hours
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm h-[38px]"
                                        placeholder="Select time"
                                        needConfirm={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                value={newFollowUp.notes}
                                onChange={(e) =>
                                    setNewFollowUp((prev) => ({
                                        ...prev,
                                        notes: e.target.value,
                                    }))
                                }
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm resize-none"
                                placeholder="Add follow-up notes..."
                            />
                            {clientId && (
                                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
                                    <Info size={14} className="text-amber-600 flex-shrink-0" />
                                    <p className="text-[11px] text-amber-800 leading-tight font-medium">
                                        <span className="font-bold  mr-1">Tip:</span>
                                        This is a future based follow up for this client.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddFollowUp}
                            disabled={loading || !newFollowUp.reason || !newFollowUp.date}
                            className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <LoadingSpinner size={16} color="white" /> : (initialData ? "Update Follow-up" : "Add Follow-up")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
