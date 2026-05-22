import mongoose, { Document, Schema } from "mongoose"

export interface ITicket extends Document {
  refNo: string
  title: string
  issueType: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  status: string
  attachments: {
    data: string        // Base64 string
    contentType: string // image/png, image/jpeg
  }[]
  adminNotes: string    // Notes added by admin, visible to user
  createdAt: Date
  updatedAt: Date
}

const ticketSchema = new Schema<ITicket>(
  {
    refNo: { type: String, required: true },

    title: { type: String, required: true },
    issueType: { type: String, required: true },
    description: { type: String, required: true },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    status: {
      type: String,
      default: "open",
    },

    attachments: [
      {
        data: { type: String, required: true },
        contentType: { type: String, required: true },
      },
    ],
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // automatically manages createdAt & updatedAt
  }
)

export default mongoose.model<ITicket>("Ticket", ticketSchema)
