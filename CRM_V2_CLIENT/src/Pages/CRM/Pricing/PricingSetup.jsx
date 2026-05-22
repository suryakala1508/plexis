import React, { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Pencil, IndianRupee, Tag, Search, Users, Camera, Package, FileCheck, Gift, HelpCircle } from 'lucide-react'
import { getPricingItems, savePricingItem, updatePricingItem, deletePricingItem } from '../../../services/pricingService'
import { PricingModal } from './PricingModal'
import { ConfirmDialog } from '../../../Components/ui/confirm-dialog'
import { toast } from 'react-toastify'
import { PageGuard, PermissionGate } from '@/Pages/utils/permissions'

const TYPE_OPTIONS = [
    { value: 'crew', label: 'Crew', icon: Users, textColor: 'text-blue-700' },
    { value: 'equipment', label: 'Equipment', icon: Camera, textColor: 'text-amber-700' },
    { value: 'package', label: 'Package', icon: Package, textColor: 'text-purple-700' },
    { value: 'deliverable', label: 'Deliverable', icon: FileCheck, textColor: 'text-indigo-700' },
    { value: 'complimentary', label: 'Complimentary', icon: Gift, textColor: 'text-emerald-700' },
    { value: 'other', label: 'Other', icon: HelpCircle, textColor: 'text-gray-600' },
]

const TypeBadge = ({ type }) => {
    const opt = TYPE_OPTIONS.find(o => o.value === type) || TYPE_OPTIONS[5]
    const IconComponent = opt.icon || HelpCircle;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold ${opt.textColor}`}>
            <IconComponent size={14} className="flex-shrink-0" />
            {opt.label}
        </span>
    )
}

export const PricingSetup = () => {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: '',
        description: '',
        onConfirm: null,
    })

    const load = async () => {
        setLoading(true)
        try {
            const data = await getPricingItems()
            setItems(data)
        } catch {
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const showToast = (msg, type = 'success') => {
        if (type === 'error') toast.error(msg)
        else toast.success(msg)
    }

    const handleSaveItem = async (data) => {
        const itemId = selectedItem?._id || selectedItem?.id;
        if (itemId) {
            await updatePricingItem(itemId, data)
            showToast('Item updated successfully')
        } else {
            await savePricingItem(data)
            showToast('Pricing item added successfully')
        }
        await load()
    }

    const openModalForNew = (defaultType = null) => {
        setSelectedItem(defaultType ? { type: defaultType } : null)
        setIsModalOpen(true)
    }

    const openModalForEdit = (item) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const showConfirm = (title, description, onConfirm) => {
        setConfirmState({ open: true, title, description, onConfirm })
    }

    const handleConfirm = async () => {
        const cb = confirmState.onConfirm
        setConfirmState(prev => ({ ...prev, open: false }))
        if (cb) {
            await cb()
        }
    }

    const handleDelete = (item) => {
        showConfirm(
            'Delete pricing item?',
            `"${item.name}" will be permanently removed.`,
            async () => {
                try {
                    await deletePricingItem(item._id || item.id)
                    await load()
                    showToast('Deleted successfully')
                } catch {
                    showToast('Failed to delete item', 'error')
                }
            }
        )
    }

    return (
        <PageGuard page={11}>
        <div className="h-full flex flex-col bg-gray-50">
            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmState.open}
                onOpenChange={(v) => setConfirmState(prev => ({ ...prev, open: v }))}
                title={confirmState.title}
                description={confirmState.description}
                onConfirm={handleConfirm}
            />

            {/* Header */}
            <div className="shrink-0 px-6 py-7 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary-dark mb-1">Catalog</h1>
                    <p className="text-xs text-gray-500">Manage setup parameters, standard pricing, and defaults for your quotation items and terms</p>
                </div>
                <PermissionGate page={11} component="11_1" action="edit">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => openModalForNew('deliverable')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all font-medium text-sm shadow-sm"
                    >
                        <Plus size={16} />
                        Add Deliverable
                    </button>
                    <button
                        onClick={() => openModalForNew('complimentary')}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all font-medium text-sm shadow-sm"
                    >
                        <Plus size={16} />
                        Add Complimentary
                    </button>
                    <button
                        onClick={() => openModalForNew()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium text-sm shadow-sm ml-2"
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                </div>
                </PermissionGate>
            </div>
            
            <PricingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveItem}
                editItem={selectedItem}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full">
                    {/* Search and Filters */}
                    {!loading && items.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        placeholder="Search by item name..." 
                                        value={searchQuery} 
                                        onChange={e => setSearchQuery(e.target.value)} 
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white shadow-sm"
                                    />
                                </div>
                                <div className="relative" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        <svg className="w-5 h-5 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        <span className="font-medium text-sm text-primary-dark">Filters</span>
                                        {filterType !== 'all' && <span className="bg-primary-dark text-white text-xs px-2 py-0.5 rounded-full">1</span>}
                                        <svg className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isOpen && (
                                        <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 w-[240px] animate-fadeIn">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-primary-dark mb-1.5">Type</label>
                                                    <select 
                                                        value={filterType} 
                                                        onChange={e => setFilterType(e.target.value)} 
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark outline-none transition-all bg-white"
                                                    >
                                                        <option value="all">All Types</option>
                                                        {TYPE_OPTIONS.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {filterType !== 'all' && (
                                                    <div className="pt-2 mt-2 border-t border-gray-100 flex justify-end">
                                                        <button 
                                                            onClick={() => { setFilterType('all'); setIsOpen(false); }} 
                                                            className="text-xs font-medium text-red-500 hover:text-red-600"
                                                        >
                                                            Clear Filter
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cards Grid */}
                    {loading ? (
                        <div className="py-12 text-center text-sm text-gray-400 bg-white border rounded-xl border-gray-200">
                            Loading...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="bg-white border rounded-xl border-gray-200 px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                                <Tag size={48} className="text-gray-300 mb-3" />
                                <p className="text-lg font-medium mb-1">No pricing items found</p>
                                <p className="text-sm">Click "Add Item" to create your first pricing item</p>
                            </div>
                        </div>
                    ) : (
                        <div className="pb-12">
                            <ItemTable 
                                items={items.filter(i => {
                                    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase())
                                    const matchesType = filterType === 'all' || i.type === filterType
                                    return matchesSearch && matchesType
                                })} 
                                onEdit={openModalForEdit} 
                                onDelete={handleDelete} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
        </PageGuard>
    )
}

const ItemTable = ({ items, onEdit, onDelete }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse table-fixed">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-1/2">Item Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-1/4">Type</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-600 uppercase tracking-wider w-32 text-right">Amount / Qty</th>
                    <th className="px-4 py-3 w-16"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                    <tr key={item.id || item._id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{item.name}</td>
                        <td className="px-4 py-3.5"><TypeBadge type={item.type} /></td>
                        <td className="px-4 py-3.5 font-bold text-sm text-gray-900 text-right">
                            {['deliverable', 'complimentary'].includes(item.type) ? (
                                <span className="text-indigo-600">{item.quantity || 1} <span className="text-[10px] font-medium text-gray-400">Qty</span></span>
                            ) : (
                                <span className="flex items-center gap-0.5 justify-end"><span className="text-xs text-gray-400 font-normal">₹</span>{Number(item.amount).toLocaleString('en-IN')}</span>
                            )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-1 mt-0 group-hover:opacity-100 opacity-0 transition-opacity">
                                <PermissionGate page={11} component="11_1" action="edit">
                                    <button onClick={() => onEdit(item)} className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"><Pencil size={12} /></button>
                                    <button onClick={() => onDelete(item)} className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><Trash2 size={12} /></button>
                                </PermissionGate>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
