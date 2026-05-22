import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: false },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  date: { type: Date, required: true },

  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'whatsapp', 'offline'],
    default: 'call'
  },

  reason: { type: String, required: true },
  notes: { type: String },

  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },

  completedAt: { type: Date },


}, { timestamps: true });

followUpSchema.index({ leadId: 1, createdAt: -1 });
followUpSchema.index({ userId: 1, date: 1 });

export const FollowUpModel = mongoose.model("FollowUp", followUpSchema);
