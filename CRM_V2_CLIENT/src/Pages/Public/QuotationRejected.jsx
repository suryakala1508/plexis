import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';

const QuotationRejected = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quotation Declined</h1>

        <p className="text-gray-600 mb-6">
          We understand that our quotation may not have met your expectations. We're sorry we couldn't work together on this project.
        </p>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            If you have any feedback or would like to discuss alternative options, please don't hesitate to contact us.
          </p>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationRejected;
