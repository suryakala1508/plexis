import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentSchedule extends Document {
    projectId: mongoose.Types.ObjectId;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue';
    paidDate?: Date;
    notes?: string;
    paidByName?: string;
    paymentMethod?: string;
    payerPhone?: string;
    createdBy: mongoose.Types.ObjectId;
    screenshots?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const PaymentScheduleSchema = new Schema<IPaymentSchedule>({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    paidDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    paidByName: {
        type: String,
        trim: true
    },
    paymentMethod: {
        type: String,
        trim: true
    },
    payerPhone: {
        type: String,
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    screenshots: [{ type: String }]
}, {
    timestamps: true
});

// Auto-update status to 'overdue' if past due date and not paid
PaymentScheduleSchema.pre('find', function () {
    // This will be handled in the controller for better control
});

// Index for efficient queries
PaymentScheduleSchema.index({ projectId: 1, dueDate: 1 });
PaymentScheduleSchema.index({ createdBy: 1, status: 1 });

export const PaymentScheduleModel = mongoose.model<IPaymentSchedule>('PaymentSchedule', PaymentScheduleSchema);
