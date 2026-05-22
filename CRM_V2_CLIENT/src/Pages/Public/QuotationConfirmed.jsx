import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatUtils';

const QuotationConfirmed = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quotation, paymentMethod } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quotation Accepted!</h1>

        <p className="text-gray-600 mb-6">
          Thank you for accepting our quotation. We appreciate your business and look forward to working with you.
        </p>

        {quotation && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500 mb-2">Quotation Details</div>
            <div className="text-lg font-semibold text-gray-900">
              #{quotation.quotationId?.toString().slice(-8).toUpperCase()}
            </div>
            <div className="text-sm text-gray-600">
              Total: {formatIndianCurrency(quotation.grandTotal)}
            </div>
            {paymentMethod && (
              <div className="text-sm text-gray-600 mt-1">
                Payment Method: {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Our team will contact you shortly to discuss next steps and arrange the details.
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

export default QuotationConfirmed;
