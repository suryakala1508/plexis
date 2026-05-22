import mongoose from "mongoose";

const PermissionSchema = new mongoose.Schema(
  {
    view: { type: Boolean, default: false },
    edit: { type: Boolean, default: false },
    deny: { type: Boolean, default: false },
  },
  { _id: false }
);

const CrewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    position: { type: String, required: true },

    notes: { type: String, default: "" },

    contactInfo: {
      email: { type: String, required: true, index: true },
      phone: { type: String },
    },

    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    crewToStudio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    hasAccess: { type: Boolean, default: false },

    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    role: {
      type: String,
      index: true,
    },

    pages: {
      type: Map,
      of: Boolean,
      default: {},
    },

    invite: {
      tokenHash: { type: String },
      expiresAt: { type: Date },
      used: { type: Boolean, default: false },
    },

    components: {
      type: Map,
      of: {
        type: Map,
        of: PermissionSchema,
      },
      default: {},
    },
    photo: { type: String, default: null },
  },
  { timestamps: true }
);

export const Crew = mongoose.model("Crew", CrewSchema);
