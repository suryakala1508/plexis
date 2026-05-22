import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export const GooglePhotosSuccessModal = ({ isOpen, onClose, email, count }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-center">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-600" />
        </button>
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h2>
        <p className="text-gray-600 mb-6">
          Successfully uploaded <strong>{count}</strong> photo{count !== '1' && count !== 1 ? 's' : ''} to Google Photos {email && <span>for <strong>{email}</strong></span>}.
        </p>
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
