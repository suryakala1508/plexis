import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true },
        description: { type: String, required: false },
        date: { type: Date, required: true },
        category: { type: String, required: true },
        customCategory: { type: String, required: false },
        expenseType: { type: String, enum: ['general', 'project'], default: 'general' },
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false },
        assignedCrew: { type: mongoose.Schema.Types.ObjectId, ref: 'Crew', required: false },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        screenshots: [{ type: String }],
    },
    { timestamps: true }
);

export const ExpenseModel = mongoose.model('Expense', ExpenseSchema);