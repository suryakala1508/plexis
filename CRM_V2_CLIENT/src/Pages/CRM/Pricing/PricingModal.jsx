import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../../../Components/Loading/LoadingSpinner';
import { toast } from 'react-toastify';
import { Plus, Trash2, Search } from 'lucide-react';
import { getPricingItems } from '../../../services/pricingService';

const TYPE_OPTIONS = [
    { value: 'crew', label: 'Crew' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'package', label: 'Package' },
    { value: 'deliverable', label: 'Deliverable' },
    { value: 'complimentary', label: 'Complimentary' },
    { value: 'other', label: 'Other' },
];

export const PricingModal = ({ isOpen, onClose, onSave, editItem = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'crew',
        amount: '',
        quantity: 1,
        packageItems: []
    });

    const [availableItems, setAvailableItems] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            getPricingItems().then(data => {
                setAvailableItems(data.filter(item => item.type === 'crew' || item.type === 'equipment'));
            });
        }
    }, [isOpen]);

    useEffect(() => {
        if (editItem) {
            setFormData({
                name: editItem.name || '',
                type: editItem.type || 'crew',
                amount: editItem.amount ? String(editItem.amount) : '',
                quantity: editItem.quantity || 1,
                packageItems: editItem.packageItems || []
            });
        } else {
            setFormData({
                name: '',
                type: 'crew',
                amount: '',
                quantity: 1,
                packageItems: []
            });
        }
        setErrors({});
    }, [editItem, isOpen]);

    // Recalculate package amount when sub-items change
    useEffect(() => {
        if (formData.type === 'package' && formData.packageItems.length > 0) {
            const total = formData.packageItems.reduce((sum, item) => sum + (Number(item.amount) * (item.quantity || 1)), 0);
            setFormData(prev => ({ ...prev, amount: String(total) }));
        }
    }, [formData.packageItems, formData.type]);

    const handleChange = (e) => {
        let { name, value } = e.target;

        if (name === 'amount') {
            // Remove commas so we store a clean number string in state
            value = value.replace(/,/g, '');
            // Allow only numbers and a single decimal point
            if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const addPackageItem = (item) => {
        if (formData.packageItems.find(p => p.pricingId === item.id)) {
            toast.warn('Item already in package');
            return;
        }
        const newItem = {
            pricingId: item.id,
            name: item.name,
            type: item.type,
            quantity: 1,
            amount: item.amount
        };
        setFormData(prev => ({
            ...prev,
            packageItems: [...prev.packageItems, newItem]
        }));
    };

    const removePackageItem = (pricingId) => {
        setFormData(prev => ({
            ...prev,
            packageItems: prev.packageItems.filter(p => p.pricingId !== pricingId)
        }));
    };

    const updatePackageItemQty = (pricingId, qty) => {
        setFormData(prev => ({
            ...prev,
            packageItems: prev.packageItems.map(p =>
                p.pricingId === pricingId ? { ...p, quantity: qty } : p
            )
        }));
    };

    const formatAmount = (val) => {
        if (!val) return '';
        const strVal = val.toString();
        const cleanVal = strVal.replace(/,/g, '');
        const [whole, decimal] = cleanVal.split('.');

        let formattedWhole = whole;
        if (whole && !isNaN(whole)) {
            formattedWhole = Number(whole).toLocaleString('en-IN');
        }

        return decimal !== undefined ? `${formattedWhole}.${decimal}` : formattedWhole;
    };

    const validateForm = () => {
        const newErrors = {};
        const isSimple = formData.type === 'deliverable' || formData.type === 'complimentary';

        if (!formData.name.trim()) newErrors.name = isSimple ? 'Description is required' : 'Name is required';
        
        if (!isSimple) {
            if (!formData.amount) newErrors.amount = 'Amount is required';
            else if (isNaN(formData.amount)) newErrors.amount = 'Amount must be a number';

            if (formData.type === 'package' && formData.packageItems.length === 0) {
                toast.error('Please add at least one item to the package');
                return false;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const isSimple = formData.type === 'deliverable' || formData.type === 'complimentary';
            const submissionData = {
                name: formData.name.trim(),
                type: formData.type,
                amount: isSimple ? 0 : (parseFloat(formData.amount) || 0),
                quantity: isSimple ? (parseInt(formData.quantity) || 1) : 1,
                packageItems: formData.type === 'package' ? formData.packageItems.map(p => ({
                    ...p,
                    quantity: parseInt(p.quantity) || 1
                })) : []
            };

            console.log('Submission Data:', submissionData);
            await onSave(submissionData);
            onClose();
        } catch (err) {
            console.error('Error in PricingModal:', err);
            const errorMsg = err.message || (typeof err === 'string' ? err : 'An error occurred while saving the item');
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const isSimple = formData.type === 'deliverable' || formData.type === 'complimentary';
    const title = editItem
        ? (isSimple ? `Edit ${formData.type === 'deliverable' ? 'Deliverable' : 'Complimentary Item'}` : 'Edit Pricing Item')
        : (isSimple ? `Add New ${formData.type === 'deliverable' ? 'Deliverable' : 'Complimentary Item'}` : 'Add New Pricing Item');

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40"
                onClick={onClose}
            />

            {/* Side Popup */}
            <div className="fixed right-0 top-0 h-full w-full md:w-[450px] lg:w-[550px] bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
                {/* Header */}
                <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-primary-dark">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form - Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {isSimple ? (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={formData.type === 'deliverable' ? "e.g. Edited photos (500+)" : "e.g. Engagement Shoot (1 hr)"}
                                        className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                                        Default Quantity
                                    </label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={handleChange}
                                        placeholder="1"
                                        className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        This quantity will be used by default when added to a quotation. You can always adjust it later.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                                        Keyword / Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Traditional Photographer"
                                        className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white cursor-pointer"
                                    >
                                        {TYPE_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Package Items Section */}
                                {formData.type === 'package' && (
                                    <div className="space-y-4 border-t border-b border-gray-100 py-4 mt-4">
                                        <label className="block text-xs font-semibold text-primary-dark mb-2">
                                            Package Components
                                        </label>

                                        {/* Add Tool */}
                                        <div className="space-y-2">
                                            <div className="relative">
                                                <select
                                                    className="w-full px-3 py-2.5 pl-9 text-sm border border-gray-300 rounded-lg appearance-none bg-white font-medium"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            const item = availableItems.find(i => i.id === e.target.value);
                                                            if (item) addPackageItem(item);
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                >
                                                    <option value=""> Add Crew or Equipment to Package</option>
                                                    {availableItems.map(item => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name} ({item.type}) - ₹{formatAmount(item.amount)}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Plus size={16} className="absolute left-3 top-3 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* List of selected items */}
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {formData.packageItems.map((item, idx) => (
                                                <div key={item.pricingId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                                                        <div className="text-xs text-gray-500 capitalize">{item.type}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Qty</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updatePackageItemQty(item.pricingId, e.target.value)}
                                                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-dark outline-none"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePackageItem(item.pricingId)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.packageItems.length === 0 && (
                                                <p className="text-center text-xs text-gray-400 py-4 italic">No items added to this package yet</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                                        {formData.type === 'package' ? 'Package Total Amount (₹)' : 'Amount (₹)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="amount"
                                        value={formatAmount(formData.amount)}
                                        onChange={handleChange}
                                        placeholder="e.g. 5,000"
                                        className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {formData.type === 'package' && (
                                        <p className="mt-1 text-[10px] text-gray-400">Total calculated from items. You can manually adjust if needed.</p>
                                    )}
                                    {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
                                </div>
                            </>
                        )}
                    </form>
                </div>

                {/* Action Buttons - Sticky Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-dark rounded-lg hover:bg-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {editItem ? 'Update Item' : 'Add Item'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
