import React from 'react';

const BetaWelcomeModal = ({ open, onClose, onFeedback }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Welcome to Beta!</h2>
                <p className="text-gray-600 mb-6">
                    Thank you for trying our beta version. We'd love to hear your feedback!
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onFeedback}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                    >
                        Give Feedback
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BetaWelcomeModal;
