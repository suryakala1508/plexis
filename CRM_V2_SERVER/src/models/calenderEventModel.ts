import mongoose from "mongoose";

const calenderEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    color: { type: String, required: false },
    description: { type: String, required: false },
    location: { type: String, required: false },
    attendees: { type: Number, required: false },
    eventType: { type: String, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);


export const CalenderEventModel = mongoose.model('CalenderEvent', calenderEventSchema);