import mongoose, { Schema, Document } from "mongoose";
import { CLIENT_STATUS } from "../modules/client/constants";

/**
 * Client Interface
 */
export interface IClient extends Document {
  clientName: string;
  relation: string;
  email?: string;
  phone?: string;
  status: typeof CLIENT_STATUS[keyof typeof CLIENT_STATUS];
  notes?: string;
  projectId?: mongoose.Schema.Types.ObjectId;
  userRef: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Client Schema
 */
const clientSchema: Schema<IClient> = new Schema(
  {
    clientName: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },

    relation: {
      type: String,
      // required: [true, "Relation is required"],
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // Only validate if email is provided
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },

    phone: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(CLIENT_STATUS),
      default: CLIENT_STATUS.ONGOING,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

/**
 * Model Export
 */
const Client = mongoose.model<IClient>("Client", clientSchema);
export default Client;