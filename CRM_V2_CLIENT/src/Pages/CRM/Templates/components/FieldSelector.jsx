import React from 'react'

const FIELD_LABELS = {
    welcomeMessage: 'Welcome Message',
    studioHeader: 'Studio Header',
    clientDetails: 'Client Details',
    eventDetails: 'Event Details',
    servicesTable: 'Services Table',
    deliverablesTable: 'Deliverables Table',
    complimentaryTable: 'Complimentary Table',
    portfolio: 'Portfolio',
    termsAndConditions: 'Terms & Conditions',
    notes: 'Notes',
    paymentTimeline: 'Payment Timeline',
}

const SERVICE_COLUMN_LABELS = {
    date: 'Date',
    location: 'Location',
    crew: 'Crew',
    equipment: 'Equipment',
    individualAmounts: 'Individual Amount per Event',
    subTotal: 'Sub Total',
    gst: 'GST',
    discount: 'Discount',
    grandTotal: 'Grand Total',
}

const Toggle = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
        <div className="flex-1 min-w- pr-3">
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in  focus:outline-none ${checked ? 'bg-primary' : 'bg-gray-200'}`}
            role="switch"
            aria-checked={checked}
        >
            <span
                className={`block h-4 w-4 rounded-full bg-white p-2 shadow-sm ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-1'}`}
                style={{ marginTop: '0px' }}
            />
        </button>
    </div>
)

export const FieldSelector = ({ fields, serviceColumns, onFieldChange, onServiceColumnChange }) => {
    return (
        <div className="space-y-4">
            {/* Main fields */}
            <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sections</h4>
                <div className="bg-white rounded-xl border border-gray-200 px-4">
                    {Object.entries(FIELD_LABELS).map(([key, label]) => (
                        <Toggle
                            key={key}
                            label={label}
                            checked={fields[key] ?? true}
                            onChange={(val) => onFieldChange(key, val)}
                        />
                    ))}
                </div>
            </div>

            {/* Service table sub-columns — only shown when servicesTable is enabled */}
            {fields.servicesTable && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services Table Options</h4>
                    <div className="bg-white rounded-xl border border-gray-200 px-4">
                        {Object.entries(SERVICE_COLUMN_LABELS).map(([key, label]) => {
                            // Equipment only makes sense when crew is enabled
                            if (key === 'equipment' && !serviceColumns.crew) return null
                            return (
                                <Toggle
                                    key={key}
                                    label={label}
                                    checked={serviceColumns[key] ?? true}
                                    onChange={(val) => onServiceColumnChange(key, val)}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
