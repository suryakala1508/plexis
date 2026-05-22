import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, CreditCard, DollarSign, MoreHorizontal } from 'lucide-react';
import { getQuotationById, setQuotationStatus } from '../../services/quotationService';
import { formatIndianCurrency } from '../../utils/formatUtils';

const ConfirmQuotation = () => {
  const { leadId } = useParams();
  const [searchParams] = useSearchParams();
  const quotationId = searchParams.get('id');
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [paymentError, setPaymentError] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        if (!quotationId) {
          setError('Invalid quotation link');
          return;
        }

        const response = await getQuotationById(quotationId);
        const quotationData = response.data || response;
        setQuotation(quotationData);

        // Check if quotation has already been responded to
        if (quotationData.status === 'accepted' || quotationData.status === 'rejected') {
          setAlreadyResponded(true);
        }
      } catch (err) {
        console.error('Error fetching quotation:', err);
        setError('Unable to load quotation details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuotation();
  }, [quotationId]);
  const handleAccept = async () => {
    console.log('👉 handleAccept clicked');
    if (!selectedPayment) {
      setPaymentError(true);
      // Scroll to payment section
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setPaymentError(false);

    if (quotation?.status === 'accepted' || quotation?.status === 'rejected') {
      setAlreadyResponded(true);
      return;
    }

    setSubmitting(true);
    try {
      await setQuotationStatus(quotationId, 'accepted', selectedPayment);

      const response = await getQuotationById(quotationId);
      const updatedQuotation = response.data || response;
      setQuotation(updatedQuotation);

      setSuccess(true);
      setAlreadyResponded(true);

      setTimeout(() => {
        navigate('/quotation-confirmed', {
          state: {
            quotation: updatedQuotation,
            paymentMethod: selectedPayment,
            fromQuotation: true
          }
        });
      }, 3000);
    } catch (err) {
      console.error('Error accepting quotation:', err);

      const errorMessage = err.message || err.toString() || '';
      if (errorMessage.includes('finalized') || errorMessage.includes('Cannot change status')) {
        setAlreadyResponded(true);
        try {
          const response = await getQuotationById(quotationId);
          const updatedQuotation = response.data || response;
          setQuotation(updatedQuotation);
        } catch (refreshErr) {
          console.error('Error refreshing quotation:', refreshErr);
        }
      } else {
        alert('Failed to accept quotation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleReject = async () => {
    if (quotation?.status === 'accepted' || quotation?.status === 'rejected') {
      setAlreadyResponded(true);
      return;
    }

    setSubmitting(true);
    try {
      await setQuotationStatus(quotationId, 'rejected');

      // Direct navigation without success screen
      navigate('/quotation-rejected');
    } catch (err) {
      console.error('Error rejecting quotation:', err);

      const errorMessage = err.message || err.toString() || '';
      if (errorMessage.includes('finalized') || errorMessage.includes('Cannot change status')) {
        setAlreadyResponded(true);
        try {
          const response = await getQuotationById(quotationId);
          const updatedQuotation = response.data || response;
          setQuotation(updatedQuotation);
        } catch (refreshErr) {
          console.error('Error refreshing quotation:', refreshErr);
        }
      } else {
        alert('Failed to reject quotation. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Generate payment options based on quotation data
  const getPaymentOptions = () => {
    if (!quotation?.paymentMethods) {
      // If no payment methods defined, show all options
      return [
        { id: 'creditCards', label: 'Credit/Debit Card', icon: CreditCard },
        { id: 'stripe', label: 'Stripe', icon: CreditCard },
        { id: 'wiseStripe', label: 'Wise Stripe', icon: CreditCard },
        { id: 'paypal', label: 'PayPal', icon: DollarSign },
        { id: 'venmo', label: 'Venmo', icon: DollarSign },
        { id: 'bankTransfer', label: 'Bank Transfer', icon: DollarSign },
        { id: 'cashOrCheck', label: 'Cash or Check', icon: MoreHorizontal }
      ];
    }

    // Filter to show only enabled payment methods
    const allOptions = [
      { id: 'creditCards', label: 'Credit/Debit Card', icon: CreditCard, enabled: quotation.paymentMethods.creditCards },
      { id: 'stripe', label: 'Stripe', icon: CreditCard, enabled: quotation.paymentMethods.stripe },
      { id: 'wiseStripe', label: 'Wise Stripe', icon: CreditCard, enabled: quotation.paymentMethods.wiseStripe },
      { id: 'paypal', label: 'PayPal', icon: DollarSign, enabled: quotation.paymentMethods.paypal },
      { id: 'venmo', label: 'Venmo', icon: DollarSign, enabled: quotation.paymentMethods.venmo },
      { id: 'bankTransfer', label: 'Bank Transfer', icon: DollarSign, enabled: quotation.paymentMethods.bankTransfer },
      { id: 'cashOrCheck', label: 'Cash or Check', icon: MoreHorizontal, enabled: quotation.paymentMethods.cashOrCheck }
    ];

    const enabledOptions = allOptions.filter(option => option.enabled);

    // If no payment methods are enabled, show all
    return enabledOptions.length > 0 ? enabledOptions : allOptions;
  };

  const paymentOptions = getPaymentOptions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600">
            Your response has been recorded. You will be redirected shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quotation Confirmation</h1>
          <p className="text-gray-600">Please review and respond to your quotation</p>
        </div>

        {/* Quotation Summary */}
        {quotation && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quotation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quotation ID</p>
                <p className="font-medium">#{quotation.quotationId?.toString().slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-lg text-green-600">{formatIndianCurrency(quotation.grandTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium">{new Date(quotation.dueDate).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {quotation.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Question */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {alreadyResponded ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Quotation Already Responded
              </h2>
              <p className="text-gray-600 mb-2">
                You have already {quotation?.status === 'accepted' ? 'accepted' : 'rejected'} this quotation.
              </p>
              <p className="text-sm text-gray-500">
                Status: <span className="font-semibold capitalize">{quotation?.status}</span>
              </p>
              {quotation?.status === 'accepted' && quotation?.acceptedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Accepted on: {new Date(quotation.acceptedAt).toLocaleString()}
                </p>
              )}
              {quotation?.status === 'rejected' && quotation?.rejectedAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Rejected on: {new Date(quotation.rejectedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Would you like to accept this quotation?
              </h2>

              {/* Payment Method Selection */}
              <div className="mb-8" id="payment-section">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferred Payment Method</h3>
                {paymentError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">⚠️ Please select a payment method to proceed</p>
                  </div>
                )}
                <div className={`grid grid-cols-1 ${paymentOptions.length === 2 ? 'md:grid-cols-2' : paymentOptions.length >= 3 ? 'md:grid-cols-3' : ''} gap-4 ${paymentError ? 'ring-2 ring-red-300 rounded-lg p-2' : ''}`}>
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedPayment(option.id);
                          setPaymentError(false);
                        }}
                        disabled={submitting || alreadyResponded}
                        className={`p-4 border-2 rounded-lg transition-all ${selectedPayment === option.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : paymentError
                            ? 'border-red-300 hover:border-red-400 text-gray-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          } ${submitting || alreadyResponded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleAccept}
                  disabled={submitting || alreadyResponded}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Yes, Accept Quotation
                    </>
                  )}
                </button>

                <button
                  onClick={handleReject}
                  disabled={submitting || alreadyResponded}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:from-red-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="h-5 w-5" />
                  No, Decline Quotation
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>This is a secure page. Your response will be recorded immediately.</p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmQuotation;
