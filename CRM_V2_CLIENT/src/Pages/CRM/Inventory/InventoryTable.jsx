import React, { useState } from 'react';
import { Pencil, Trash2, Camera, Aperture, Mic, Lightbulb, HardDrive, HelpCircle, Star } from 'lucide-react';
import { ConfirmDialog } from '../../../Components/ui/confirm-dialog';
import { PageGuard, PermissionGate } from '@/Pages/utils/permissions';

const CATEGORY_OPTIONS = [
  { value: 'Camera', label: 'Camera', icon: Camera, textColor: 'text-blue-700' },
  { value: 'Lens', label: 'Lens', icon: Aperture, textColor: 'text-purple-700' },
  { value: 'Audio', label: 'Audio', icon: Mic, textColor: 'text-green-700' },
  { value: 'Light', label: 'Light', icon: Lightbulb, textColor: 'text-amber-700' },
  { value: 'Storage', label: 'Storage', icon: HardDrive, textColor: 'text-orange-700' },
  { value: 'Uncategorized', label: 'Uncategorized', icon: HelpCircle, textColor: 'text-gray-600' },
];

const CategoryBadge = ({ category }) => {
  const normalizedCategory = category?.trim().charAt(0).toUpperCase() + category?.trim().slice(1).toLowerCase();
  const opt = CATEGORY_OPTIONS.find(o => o.value === normalizedCategory);
  if (opt) {
    const IconComponent = opt.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ${opt.textColor}`}>
        <IconComponent size={14} className="flex-shrink-0" />
        {opt.label}
      </span>
    );
  } else {
    // Custom category
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold text-indigo-700">
        <Star size={14} className="flex-shrink-0" />
        {category}
      </span>
    );
  }
};


export const InventoryTable = ({ items, onItemClick, selectedItemId, onEdit, onDelete }) => {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: null,
  });

  const showConfirm = (title, description, onConfirm) => {
    setConfirmState({ open: true, title, description, onConfirm });
  };

  const handleDelete = (item) => {
    showConfirm(
      'Delete item?',
      `${item.name} will be permanently removed from your inventory.`,
      async () => {
        try {
          await onDelete(item);
        } catch (error) {
          console.error('Delete failed:', error);
        }
      }
    );
  };

  const handleEdit = (item) => {
    showConfirm(
      'Edit item details?',
      `You are about to edit ${item.name}'s information.`,
      async () => {
        try {
          await onEdit(item);
        } catch (error) {
          console.error('Edit failed:', error);
        }
      }
    );
  };

  const handleConfirm = async () => {
    const cb = confirmState.onConfirm;
    setConfirmState(prev => ({ ...prev, open: false }));
    if (cb) {
      await cb();
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className='bg-white border border-gray-200 p-8 text-center'>
        <p className='text-gray-500 text-sm'>No inventory items found</p>
        <p className='text-gray-400 text-xs mt-1'>Add your first item to get started</p>
      </div>
    );
  }

  return (
    <>
      <PageGuard page="8">
        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmState.open}
          onOpenChange={(v) => setConfirmState(prev => ({ ...prev, open: v }))}
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={handleConfirm}
        />

        <div
          id="inventory-table"
          className='bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Category
                  </th>
                  <th className='px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Quantity
                  </th>
                  <th className='px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Available
                  </th>
                  <th className='px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider'>
                    Assigned To
                  </th>
                  <PermissionGate page="8" component="8_1" action="edit">
                    <th className='px-6 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]'>
                      Actions
                    </th>
                  </PermissionGate>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    onClick={() => onItemClick(item)}
                    className={`cursor-pointer transition-colors ${selectedItemId === item.id
                      ? 'bg-primary-light/50 hover:bg-primary-light/50'
                      : index % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-primary-light/30 hover:bg-primary-light/50'
                      }`}
                  >
                    <td className='px-4 py-2.5'>
                      <div className='text-sm font-semibold text-gray-900'>{item.name}</div>
                    </td>
                    <td className='px-4 py-2.5'>
                      <CategoryBadge category={item.category} />
                    </td>
                    <td className='px-4 py-2.5 text-center'>
                      <div className='text-sm text-gray-600'>{item.quantity}</div>
                    </td>
                    <td className='px-4 py-2.5 text-center'>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.availableCount > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {item.availableCount} available
                      </span>
                    </td>
                    <td className='px-4 py-2.5'>
                      {item.assignedProjects && item.assignedProjects.length > 0 ? (
                        <div className='flex items-center gap-2'>
                          <span className='px-2 py-0.5 bg-primary-dark text-white rounded-md text-[10px] font-black uppercase tracking-tighter shadow-sm'>
                            {item.assignedProjects.length}{' '}
                            {item.assignedProjects.length === 1 ? 'Project' : 'Projects'}
                          </span>
                          {item.totalAssignedQuantity > 0 && (
                            <span className='text-[10px] text-gray-600 font-medium'>
                              ({item.totalAssignedQuantity} units)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className='text-xs text-gray-400 italic font-medium'>Unassigned</span>
                      )}
                    </td>
                    <PermissionGate page="8" component="8_1" action="edit">
                      <td
                        className="px-6 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center gap-2">
                          {/* Edit Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg
                            text-blue-600 hover:bg-blue-50 border-2 border-transparent
                            hover:border-blue-200 active:scale-95 transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil size={16} />
                            </button>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full mb-2
                          left-1/2 -translate-x-1/2 hidden group-hover:block
                          bg-gray-900 text-white text-xs font-medium
                          px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap
                          after:content-[''] after:absolute after:top-full
                          after:left-1/2 after:-translate-x-1/2
                          after:border-4 after:border-transparent
                          after:border-t-gray-900">
                              Edit {item.name}
                            </div>
                          </div>

                          {/* Delete Button */}
                          <div className="relative group">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-lg
                            text-red-600 hover:bg-red-50 border-2 border-transparent
                            hover:border-red-200 active:scale-95 transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Delete ${item.name}`}
                            >
                              <Trash2 size={16} />
                            </button>

                            {/* Tooltip */}
                            <div className="pointer-events-none absolute bottom-full mb-2
                          left-1/2 -translate-x-1/2 hidden group-hover:block
                          bg-gray-900 text-white text-xs font-medium
                          px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap
                          after:content-[''] after:absolute after:top-full
                          after:left-1/2 after:-translate-x-1/2
                          after:border-4 after:border-transparent
                          after:border-t-gray-900">
                              Delete {item.name}
                            </div>
                          </div>
                        </div>
                      </td>
                    </PermissionGate>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageGuard>
    </>
  );
};

