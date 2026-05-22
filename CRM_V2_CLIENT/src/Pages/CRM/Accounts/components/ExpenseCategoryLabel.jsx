import React from 'react'
import {
  Wrench,
  Laptop,
  Megaphone,
  Users,
  Home,
  Plane,
  Package,
  Briefcase,
  Shield,
  Receipt,
  Settings,
  GraduationCap,
  CircleHelp,
  Star,
} from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'Equipment', icon: Wrench, textColor: 'text-blue-700' },
  { value: 'Software & Tools', icon: Laptop, textColor: 'text-violet-700' },
  { value: 'Marketing', icon: Megaphone, textColor: 'text-pink-700' },
  { value: 'Salaries', icon: Users, textColor: 'text-green-700' },
  { value: 'Rent & Utilities', icon: Home, textColor: 'text-amber-700' },
  { value: 'Travel', icon: Plane, textColor: 'text-indigo-700' },
  { value: 'Office Supplies', icon: Package, textColor: 'text-gray-700' },
  { value: 'Professional Services', icon: Briefcase, textColor: 'text-cyan-700' },
  { value: 'Insurance', icon: Shield, textColor: 'text-orange-700' },
  { value: 'Taxes', icon: Receipt, textColor: 'text-red-700' },
  { value: 'Maintenance', icon: Settings, textColor: 'text-teal-700' },
  { value: 'Training & Development', icon: GraduationCap, textColor: 'text-fuchsia-700' },
  { value: 'Other', icon: CircleHelp, textColor: 'text-slate-700' },
]

const normalizeCategory = (category) => {
  const value = (category || '').trim()
  return value || 'Other'
}

export const ExpenseCategoryLabel = ({ category, className = '' }) => {
  const normalizedCategory = normalizeCategory(category)
  const option = CATEGORY_OPTIONS.find((item) => item.value === normalizedCategory)

  if (!option) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 ${className}`}>
        <Star size={14} className='flex-shrink-0' />
        <span className='truncate'>{normalizedCategory}</span>
      </span>
    )
  }

  const Icon = option.icon

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${option.textColor} ${className}`}>
      <Icon size={14} className='flex-shrink-0' />
      <span className='truncate'>{option.value}</span>
    </span>
  )
}
