import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String },
    countryCode: { type: String, default: '+91' },
    password: { type: String},
    role: { type: String, default: '1', required: true },
    refNo: { type: String, required: true, unique: true },
    googleId: { type: String },
    isOnboared: { type: Boolean, default: false },
    receiveDailyActivityEmail: { type: Boolean, default: false },
    validUntil: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    subscription: {
        planType: { type: String, default: "basic" },
        status: { type: String, default: "Active" },
        features: { type: Map, of: Boolean, default: {} },
        updatedAt: { type: Date, default: Date.now },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
}, { timestamps: true });

userSchema.index({ role: 1 });

export const User = mongoose.model('User', userSchema);