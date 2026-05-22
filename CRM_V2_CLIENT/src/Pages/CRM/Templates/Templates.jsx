import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, LayoutTemplate, BadgeCheck, CheckCircle2, X } from 'lucide-react'
import { getTemplates, deleteTemplate, duplicateTemplate, setDefaultTemplate } from '../../../services/templateService'
import { TemplateCard } from './components/TemplateCard'
import { ConfirmDialog } from '../../../Components/ui/confirm-dialog'
import { PageGuard, PermissionGate, canEdit as checkCanEdit } from '@/Pages/utils/permissions'
import { useSession } from '@/contexts/SessionContext'

export const Templates = () => {
    const navigate = useNavigate()
    const { session } = useSession()
    // Compute edit permission using the same logic as PermissionGate
    const sessionUser = session?.data || session
    // Role '1' = studio owner who can always edit their own templates
    const isOwner = String(sessionUser?.role) === '1'
    const canEditTemplates = isOwner || (sessionUser ? checkCanEdit(sessionUser, 10, '10_1') : false)
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: '',
        description: '',
        onConfirm: null,
    })

    const loadTemplates = async () => {
        setLoading(true)
        try {
            const data = await getTemplates()
            setTemplates(data)
        } catch {
            setTemplates([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTemplates()
    }, [])

    const showToast = (msg, type = 'success', title = '', detail = '') => {
        setToast({ msg, type, title, detail })
        setTimeout(() => setToast(null), 3000)
    }

    const handleEdit = (id) => {
        navigate(`/templates/${id}/edit`)
    }

    const handleDuplicate = async (id) => {
        try {
            await duplicateTemplate(id)
            await loadTemplates()
            showToast('Template duplicated!')
        } catch {
            showToast('Failed to duplicate template', 'error')
        }
    }

    const handleSetDefault = async (id) => {
        try {
            const updatedTemplate = await setDefaultTemplate(id)
            const refreshedTemplates = await getTemplates()
            setTemplates(refreshedTemplates)

            if (!updatedTemplate) {
                // If backend was unavailable, at least keep the cached/default-marked list on screen.
                setTemplates(prev => prev.map(template => ({
                    ...template,
                    isDefault: template.id === id || template._id === id,
                })))
            }

            showToast(
                'This template will now load automatically for new quotations.',
                'success',
                'Default template saved',
                'You can still switch templates manually in any quotation.'
            )
        } catch {
            showToast(
                'We could not save the default template right now.',
                'error',
                'Could not save default template',
                'Please try again in a moment.'
            )
        }
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

    const handleDelete = (id) => {
        showConfirm(
            'Delete Template?',
            'This cannot be undone. Are you sure you want to delete this template?',
            async () => {
                try {
                    await deleteTemplate(id)
                    await loadTemplates()
                    showToast('Template deleted')
                } catch {
                    showToast('Failed to delete template', 'error')
                }
            }
        )
    }

    return (
        <PageGuard page={10}>
        <div className="h-full flex flex-col bg-gray-50">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border shadow-2xl fade-in ${toast.type === 'error'
                        ? 'border-red-200 bg-white text-red-950'
                        : 'border-emerald-200 bg-white text-emerald-950'
                        }`}
                >
                    <div className={`flex items-start gap-3 p-4 ${toast.type === 'error' ? 'bg-red-50/80' : 'bg-emerald-50/80'}`}>
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toast.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {toast.type === 'error' ? <X size={16} /> : (toast.title === 'Default template saved' ? <BadgeCheck size={16} /> : <CheckCircle2 size={16} />)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                                <p className="text-sm font-semibold leading-5">{toast.title || (toast.type === 'error' ? 'Something went wrong' : 'Saved successfully')}</p>
                            </div>
                            <p className="mt-1 text-sm leading-5 text-slate-600">{toast.msg}</p>
                            {toast.detail && <p className="mt-1 text-xs leading-5 text-slate-500">{toast.detail}</p>}
                        </div>
                    </div>
                </div>
            )}

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
                    <h1 className="text-2xl font-bold text-primary-dark mb-1">Templates</h1>
                </div>
                <PermissionGate page={10} component="10_1" action="edit">
                <button
                    onClick={() => navigate('/templates/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium text-sm shadow-sm"
                >
                    <Plus size={16} />
                    Create New Template
                </button>
                </PermissionGate>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse border-2 border-transparent"></div>
                            ))}
                        </div>
                    </div>
                ) : templates.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                        <div className="w-16 h-16 bg-primary-light/20 rounded-2xl flex items-center justify-center mb-4">
                            <LayoutTemplate size={28} className="text-primary" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-1">No templates yet</h2>
                        <p className="text-sm text-gray-500 max-w-xs mb-6">
                            Create your first quotation template to speed up your workflow. Choose backgrounds, toggle fields, and save for reuse.
                        </p>
                        <PermissionGate page={10} component="10_1" action="edit">
                        <button
                            onClick={() => navigate('/templates/new')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-dark text-white rounded-xl hover:bg-primary transition-all font-medium text-sm shadow-sm"
                        >
                            <Plus size={16} />
                            Create Your First Template
                        </button>
                        </PermissionGate>
                    </div>
                ) : (
                    <div>
                        <p className="text-xs text-gray-500 mb-4">
                            {templates.length} Quotation {templates.length !== 1 ? 'templates' : 'template'}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                            {templates.map(template => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onEdit={handleEdit}
                                    onDuplicate={handleDuplicate}
                                    onSetDefault={handleSetDefault}
                                    onDelete={handleDelete}
                                    canEdit={canEditTemplates}
                                />
                            ))}

                            {/* Add new card — only for users with edit access */}
                            <PermissionGate page={10} component="10_1" action="edit">
                            <button
                                onClick={() => navigate('/templates/new')}
                                className="h-full min-h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary-light/10 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary group"
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus size={18} />
                                </div>
                                <span className="text-xs font-medium">New Template</span>
                            </button>
                            </PermissionGate>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </PageGuard>
    )
}
