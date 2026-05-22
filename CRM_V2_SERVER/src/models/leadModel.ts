import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: { type: String, required: false },
    email: { type: String, required: false },
    contactNumber: { type: String, required: false },
    whatsappNumber: { type: String, required: false },
    EnquiryType: { type: String, required: false },
    EventType: { type: String, required: false },
    customEventType: { type: String, required: false },
    EventDate: { type: Date, required: false },
    EventEndDate: { type: Date, required: false },
    Location: { type: String, required: false },
    Relation: { type: String, required: false },
    status: { type: String, enum: ['Inquiry', 'Proposal', 'Negotiation', 'Confirmed', 'Rejected'], default: 'Inquiry' },
    source: { type: String, required: false },
    budget: { type: String, required: false },
    additionalBudget: { type: String, default: "0" }, // Budget added from accepted quotations
    remarks: { type: String, required: false },
    additionalfields: { type: Object, default: {} },
    userRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

leadSchema.index({ userRef: 1, createdAt: -1 });

export const LeadModel = mongoose.model('Lead', leadSchema);