import mongoose, { Schema, Document } from 'mongoose';

export interface IContract extends Document {
    userId: mongoose.Types.ObjectId;
    leadId: mongoose.Types.ObjectId;
    quotationId?: mongoose.Types.ObjectId;
    contractNumber: string;
    status: 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected';

    agreement: {
        agreementDate: string;
        corporationName: string;
        corporationAddress: string;
        photographerName: string;
        photographerAddress: string;
        eventDescription: string;
        duration: string;
        deliveryDays: string | number;
        clientEmail?: string;
        clientPhone?: string;
    };

    terms: {
        customTerms: string;
    };

    items: Array<{
        description: string;
        quantity: number;
        rate: number;
        total: number;
    }>;

    deliverables: Array<{
        description: string;
        quantity: number;
    }>;

    complimentary: Array<{
        description: string;
        quantity: number;
    }>;

    paymentMilestones: Array<{
        description: string;
        amount: number;
        dueDate: string;
    }>;

    copyright: {
        transferCopyright: boolean;
        imagesDescription: string;
        photoCredit: string;
        licensingTerms: string;
    };

    disclaimer: {
        text: string;
    };

    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;

    pdfUrl?: string;

    sentAt?: Date;
    viewedAt?: Date;
    signedAt?: Date;
    rejectedAt?: Date;

    isDeleted: boolean;
    deletedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const ContractSchema = new Schema<IContract>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        leadId: {
            type: Schema.Types.ObjectId,
            ref: 'Lead',
            required: true,
            index: true
        },
        quotationId: {
            type: Schema.Types.ObjectId,
            ref: 'Quotation',
            required: false
        },
        contractNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        status: {
            type: String,
            enum: ['draft', 'sent', 'viewed', 'signed', 'rejected'],
            default: 'draft',
            required: true
        },

        agreement: {
            agreementDate: { type: String, required: true },
            corporationName: { type: String, required: true },
            corporationAddress: { type: String, default: '' },
            photographerName: { type: String, required: true },
            photographerAddress: { type: String, default: '' },
            eventDescription: { type: String, default: '' },
            duration: { type: String, default: '' },
            deliveryDays: { type: Schema.Types.Mixed, default: '' },
            clientEmail: { type: String, default: '' },
            clientPhone: { type: String, default: '' }
        },

        terms: {
            customTerms: { type: String, default: '' }
        },

        items: [{
            description: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            rate: { type: Number, required: true, min: 0 },
            total: { type: Number, required: true, min: 0 }
        }],

        deliverables: [{
            description: { type: String, default: '' },
            quantity: { type: Number, default: 1 }
        }],

        complimentary: [{
            description: { type: String, default: '' },
            quantity: { type: Number, default: 1 }
        }],

        paymentMilestones: [{
            description: { type: String, required: true },
            amount: { type: Number, required: true, min: 0 },
            dueDate: { type: String, required: true }
        }],

        copyright: {
            transferCopyright: { type: Boolean, default: false },
            imagesDescription: { type: String, default: '' },
            photoCredit: { type: String, default: '' },
            licensingTerms: { type: String, default: '' }
        },

        disclaimer: {
            text: { type: String, default: '' }
        },

        subtotal: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        taxAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        discountAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        grandTotal: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },

        pdfUrl: {
            type: String,
            default: null
        },

        sentAt: {
            type: Date,
            default: null
        },
        viewedAt: {
            type: Date,
            default: null
        },
        signedAt: {
            type: Date,
            default: null
        },
        rejectedAt: {
            type: Date,
            default: null
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Index for common queries
ContractSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
ContractSchema.index({ leadId: 1, isDeleted: 1 });
ContractSchema.index({ status: 1, isDeleted: 1 });

export const ContractModel = mongoose.model<IContract>('Contract', ContractSchema);
