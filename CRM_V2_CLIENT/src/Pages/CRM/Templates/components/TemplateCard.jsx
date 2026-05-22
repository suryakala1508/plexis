import React, { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit2, Copy, Trash2, LayoutTemplate, Check, BadgeCheck } from 'lucide-react'

export const TemplateCard = ({ template, onEdit, onDuplicate, onDelete, onSetDefault, canEdit = true }) => {
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const bg = template.background || {}
    const accent = template.customization?.primaryColor || '#9916b1'
    const header = template.customization?.headerColor || bg.headerColor || '#22031f'

    const cardStyle =
        bg.type === 'image' && bg.imageUrl
            ? { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : bg.type === 'gradient'
                ? { background: `linear-gradient(${bg.gradientDirection || 'to bottom right'}, ${bg.gradientFrom || '#fff'}, ${bg.gradientTo || '#f3e8ff'})` }
                : { backgroundColor: bg.color || '#ffffff' }


    return (
        <div
            className={`relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => canEdit && onEdit(template.id)}
        >
            {template.isDefault && (
                <div
                    className="absolute top-2 right-2 z-30 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-lg"
                    title="Default template"
                />
            )}

            {/* Preview thumbnail */}
            <div
                className="h-32 relative flex flex-col items-center justify-center gap-1 p-3 overflow-hidden rounded-t-xl"
                style={cardStyle}
            >
                {/* White overlay for image backgrounds */}
                {bg.type === 'image' && bg.imageUrl && (
                    <div className="absolute inset-0" style={{ backgroundColor: `rgba(255,255,255,${bg.imageOpacity ?? 0.15})` }} />
                )}
                <div className="relative z-10 w-full flex flex-col gap-1">
                    {/* Mock header bar */}
                    <div
                        className="w-full h-5 rounded-md opacity-90 flex items-center px-2 gap-1"
                        style={{ backgroundColor: header }}
                    >
                        <div className="w-3 h-3 rounded-sm bg-white/30" />
                        <div className="flex-1 h-1.5 rounded bg-white/20" />
                    </div>
                    {/* Mock content lines */}
                    <div className="w-full flex gap-1 mt-1">
                        <div className="flex-1 space-y-1">
                            <div className="h-1.5 rounded bg-gray-400/40 w-3/4" />
                            <div className="h-1.5 rounded bg-gray-400/40 w-1/2" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="h-1.5 rounded bg-gray-400/40 w-2/3" />
                            <div className="h-1.5 rounded bg-gray-400/40 w-1/2" />
                        </div>
                    </div>
                    {/* Mock table */}
                    <div className="w-full mt-1 space-y-0.5">
                        <div className="h-1.5 rounded w-full" style={{ backgroundColor: accent + '60' }} />
                        <div className="h-1.5 rounded bg-gray-300/60 w-full" />
                        <div className="h-1.5 rounded bg-gray-300/60 w-full" />
                    </div>
                </div>
                {/* Accent dot */}
                <div
                    className={`absolute top-2 ${template.isDefault ? 'right-9' : 'right-2'} w-3 h-3 rounded-full border-2 border-white shadow z-10`}
                    style={{ backgroundColor: accent }}
                />
                {/* Image badge */}
                {bg.type === 'image' && bg.imageUrl && (
                    <div className="absolute bottom-1.5 left-1.5 z-10 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>🖼</span>
                    </div>
                )}
            </div>

            {/* Card body */}
            <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{template.name || 'Untitled Template'}</p>
                </div>

                {/* 3-dot menu — only shown when user has edit access */}
                {canEdit && (
                <div className="relative shrink-0" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40">
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(template.id) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(template.id) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Copy size={14} />
                                Duplicate
                            </button>
                            {template.isDefault ? (
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    disabled
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 bg-emerald-50 cursor-not-allowed"
                                >
                                    <Check size={14} />
                                    Default Template
                                </button>
                            ) : (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onSetDefault?.(template.id) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <BadgeCheck size={14} />
                                    Set as Default
                                </button>
                            )}
                            <div className="border-t border-gray-100 my-1" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(template.id) }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    )
}
