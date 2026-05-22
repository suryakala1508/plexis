import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    eventTitle: {type: String, required: true},
    eventDescription: {type: String, required: true},
    eventDate: {type: Date, required: true},
    Project: {type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true},
    location: {type: String},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
}, {timestamps: true});

export const Event = mongoose.model("Event", eventSchema);