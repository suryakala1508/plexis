import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    itemDescription: { type: String },
    category: { type: String, default: 'Uncategorized' },
    customCategory: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    available: { type: Number, required: true, default: 0 },
    assignedTo: [{
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
        quantity: { type: Number, required: true },
        assignedFrom: { type: Date },
        assignedTo: { type: Date }
    }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: { type: String }
}, { timestamps: true });

export const InventoryModel = mongoose.model("Inventory", inventorySchema);