import React, { useState } from 'react';
import { LoadingSpinner } from '../../../Components/Loading';

/**
 * InventoryModal Component
 * Modal popup for adding new inventory items
 */
export const InventoryModal = ({ isOpen, onClose, onSave, itemToEdit = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    description: '',
    quantity: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [assignedTotal, setAssignedTotal] = useState(0);

  const categories = ['Camera', 'Lens', 'Audio', 'Light', 'Storage', 'Uncategorized'];


  // Populate form when itemToEdit changes or modal opens
  React.useEffect(() => {
    if (isOpen && itemToEdit) {
      const isCustomCategory = !categories.includes(itemToEdit.category);

      setFormData({
        name: itemToEdit.name || '',
        category: isCustomCategory ? 'Custom' : itemToEdit.category,
        customCategory: isCustomCategory ? itemToEdit.category : '',
        description: itemToEdit.description || '',
        quantity: itemToEdit.quantity || '',
        notes: itemToEdit.notes || '',
      });
      setShowCustomCategory(isCustomCategory);

      // Calculate total assigned quantity from original item assignments
      const original = itemToEdit._original;
      if (original && Array.isArray(original.assignedTo)) {
        const total = original.assignedTo.reduce(
          (sum, a) => sum + (a.quantity || 0),
          0,
        );
        setAssignedTotal(total);
      } else {
        setAssignedTotal(0);
      }
    } else if (isOpen && !itemToEdit) {
      // Reset form for add mode
      setFormData({
        name: '',
        category: '',
        customCategory: '',
        description: '',
        quantity: '',
        notes: '',
      });
      setShowCustomCategory(false);
      setAssignedTotal(0);
    }
    setErrors({});
  }, [isOpen, itemToEdit]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Handle custom category selection
    if (field === 'category') {
      if (value === 'Custom') {
        setShowCustomCategory(true);
      } else {
        setShowCustomCategory(false);
        setFormData(prev => ({ ...prev, customCategory: '' }));
      }
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.category === 'Custom' && (!formData.customCategory || !formData.customCategory.trim())) {
      newErrors.customCategory = 'Custom category name is required';
    }

    const qty = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(qty) || qty < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    } else if (itemToEdit && assignedTotal > 0 && qty < assignedTotal) {
      // Prevent saving if new total quantity is less than already assigned quantity
      newErrors.quantity = `Quantity can't be less than the total assigned across projects (${assignedTotal}).`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const newItem = {
        name: formData.name,
        category: formData.category === 'Custom' ? formData.customCategory : formData.category,
        description: formData.description,
        quantity: parseInt(formData.quantity),
        notes: formData.notes,
      };

      await onSave(newItem);
      // Don't close here, wait for parent to handle success/error or manually close
      // But typically we close on success. The existing code closed it. 
      // We'll keep the existing behavior but let the parent close it actually? 
      // The original code called handleClose() which did onClose().
      // onSave is async, so we wait for it.
      handleClose();
    } catch (error) {
      console.error('Error saving item:', error);
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: '',
      customCategory: '',
      description: '',
      quantity: '',
      notes: '',
    });
    setErrors({});
    setIsSaving(false);
    setShowCustomCategory(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0  bg-black/30 backdrop-blur-sm transition-opacity z-40"
        onClick={handleClose}
      />

      {/* Side Popup */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[370px] lg:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-dark">
            {itemToEdit ? "Edit Item" : "Add New Item"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form - Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Canon EOS R5"
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.name ? "border-red-500" : "border-gray-300"
                  }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white ${errors.category ? "border-red-500" : "border-gray-300"
                  }`}
              >
                <option value="">Select a category</option>
                {categories.filter(cat => cat !== 'Uncategorized').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">+ Custom Category</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Custom Category Input */}
            {showCustomCategory && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                  Custom Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customCategory}
                  onChange={(e) =>
                    handleChange("customCategory", e.target.value)
                  }
                  placeholder="e.g., Drone, Tripod, Monitor"
                  className={`w-full px-3 py-2.5 text-base border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all placeholder:text-gray-400 ${errors.customCategory ? "border-red-500" : "border-gray-300"
                    }`}
                />
                {errors.customCategory && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.customCategory}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Add service details, specifications etc."
                rows={3}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                placeholder="0"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all ${errors.quantity &&
                  typeof errors.quantity === "string" &&
                  errors.quantity.includes("total assigned across projects")
                  ? "border-amber-400"
                  : errors.quantity
                    ? "border-red-500"
                    : "border-gray-300"
                  }`}
              />
              {errors.quantity && (
                <p
                  className={`mt-1 text-xs ${typeof errors.quantity === "string" &&
                    errors.quantity.includes("total assigned across projects")
                    ? "text-amber-700 bg-amber-50 border-l-4 border-amber-400 pl-2 py-1 rounded"
                    : "text-red-600"
                    }`}
                >
                  {errors.quantity}
                </p>
              )}
              {itemToEdit && assignedTotal > 0 && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Currently assigned across projects:{" "}
                  <span className="font-semibold">{assignedTotal}</span>
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-primary-dark mb-1.5">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any additional notes..."
                rows={4}
                className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all resize-none placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-dark rounded-lg hover:bg-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {itemToEdit ? "Update Item" : "Add Item"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

