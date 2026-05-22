import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
    },
    { timestamps: true }
);

export const AdminModel = mongoose.model('Admin', adminSchema);