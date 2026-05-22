import mongoose from 'mongoose';

const pricingItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['crew', 'equipment', 'package', 'other', 'deliverable', 'complimentary'],
        required: true,
        default: 'other'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        default: 1
    },
    packageItems: [{
        pricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingItem' },
        name: String,
        type: { type: String, enum: ['crew', 'equipment'] },
        quantity: { type: Number, default: 1 },
        amount: Number
    }]
}, { timestamps: true });

export const PricingItemModel = mongoose.model('PricingItem', pricingItemSchema);
