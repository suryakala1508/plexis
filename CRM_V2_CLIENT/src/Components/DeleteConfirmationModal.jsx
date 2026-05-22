import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Confirmation",
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    itemLabel = "",
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="flex items-center justify-center min-h-screen p-4">
                <div
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with warning icon */}
                    <div className="bg-red-50 px-6 py-6 flex flex-col items-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4">
                        <p className="text-gray-600 text-center">
                            {message}
                        </p>
                        {itemLabel && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 italic text-center text-sm font-medium text-gray-800">
                                "{itemLabel}"
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-6 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold text-sm transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-sm transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Confirm Delete"
                            )}
                        </button>
                    </div>

                    {/* Close button top right */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-black/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
