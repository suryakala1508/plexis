import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    accessType: {
      type: String,
      enum: ["public", "password", "private"],
      default: "private",
    },
    password: {
      type: String, // Only used if accessType is "password"
      select: false, // Don't return in queries by default
    },
    settings: {
      allowDownload: {
        type: Boolean,
        default: true,
      },
      allowShare: {
        type: Boolean,
        default: true,
      },
      watermarkEnabled: {
        type: Boolean,
        default: false,
      },
    },
    imageCount: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      default: null,
    },
    visibility: {
      type: String,
      enum: ["public", "hidden"],
      default: "public",
    },
    // Owner/studio favorite - whether project owner liked this folder
    likedByOwner: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
const projectSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, required: true },
    projectDescription: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    projectType: { type: String, required: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true },
    clientPhone: { type: String, default: "" },
    clientName: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    sourceQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: "Quotation" },
    sourceContractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
    contractUrl: { type: String, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    budget: { type: String },
    additionalBudget: { type: String, default: "0" }, // Budget added from accepted quotations
    // Total project amount agreed with client (used for payment schedule)
    projectAmount: { type: Number, default: 0 },
    location: { type: String, default: "" },
    assignedCrew: [{ type: mongoose.Schema.Types.ObjectId, ref: "Crew" }],
    assignedEquipment: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
        quantity: { type: Number, default: 1 },
      },
    ],
    // In-house crew tasks (flat structure)
    inHouseCrew: [
      {
        crewId: { type: mongoose.Schema.Types.ObjectId, ref: "Crew", required: true },
        name: { type: String, required: true, trim: true },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Review", "Completed"],
          default: "Pending",
        },
      },
    ],
    progressTimeline: [
      {
        title: { type: String, required: true },
        description: { type: String },
        completedAt: { type: Date, required: true, default: Date.now },
        status: { type: String, default: '' },
      },
    ],
    projectStatus: {
      type: String,
      enum: ['Planning', 'Pre-production', 'In Progress', 'Post-production', 'Review', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Planning'
    },
    storageUrl: { type: String, default: "" },
    storageUsed: { type: Number, default: 0 },
    folders: [folderSchema],

    gallerySettings: {
      // Support multiple shareable links (folder-level or project-level)
      shareableLinks: [
        {
          pin: { type: String, required: true },
          folderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null,
          },
          permissions: {
            allowView: { type: Boolean, default: true },
            allowDownload: { type: Boolean, default: false },
            allowEdit: { type: Boolean, default: false },
          },
          expiresAt: { type: Date },
          accessCount: { type: Number, default: 0 },
          maxAccessCount: { type: Number, default: null }, // null = unlimited
          createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      defaultFolderName: {
        type: String,
        default: "AllPhotos",
      },
      galleryPin: {
        type: String,
        default: null,
      },
      shareLink: {
        slug: { type: String, unique: true, sparse: true },
        isActive: { type: Boolean, default: false },
        expiresAt: { type: Date, default: null },
        accessibleFolders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }],
        accessCount: { type: Number, default: 0 },
        lastAccessedAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
      allowClientFavorites: {
        type: Boolean,
        default: true,
      },
      coverImage: {
      mobile: {
        type: String,
        default: null,
      },
      desktop: {
        type: String,
        default: null,
      },
    },

      mediaLinks: [
        {
          type: { type: String, enum: ["film", "reels"], required: true },
          isHero: { type: Boolean, default: false },
          title: { type: String, required: true },
          description: { type: String },
          links: [{ type: String }],
          layout: {
            columns: { type: Number, default: 3 },
          },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },

    payments: [
      {
        amount: { type: Number, required: true },
        paidBy: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        paymentMethod: {
          type: String,
          enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
          required: true,
        },
        paymentDate: { type: Date, required: true, default: Date.now },
        notes: { type: String, default: '' },
        screenshots: [{ type: String }],
        sourceScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentSchedule', default: null },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    paymentMilestones: [
      {
        description: { type: String, required: true },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        paid: { type: Boolean, default: false },
        paidAt: { type: Date },
      },
    ],

    clientFavorites: [
      {
        imageId: { type: mongoose.Schema.Types.ObjectId },
        markedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

projectSchema.index({ createdBy: 1, createdAt: -1 });

export const Project = mongoose.model("Project", projectSchema);