import mongoose from 'mongoose';


const studioSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, default: "" },
    tagline: { type: String, default: "" },
    mainAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String, default: "" },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
    },
    branches: { type: Array, default: [] },
    preferences: {
        businessType: { type: String, required: true },
        integrations: {
            metaAds: { type: Boolean, default: false },
            googleAds: { type: Boolean, default: false },
            instagramAutomation: { type: Boolean, default: false },
            hubspot: { type: Boolean, default: false },
            other: { type: String, default: "" },
        },
    },
    logo: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    bannerImageMobile: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    banner: {
        show: { type: Boolean, default: true },
        height: { type: String, default: "medium" },
        overlay: { type: Number, default: 30 },
        showGradient: { type: Boolean, default: true },
        objectPosition: { type: String, default: "center" },
    },
    portfolioSelected: { type: Array, default: null },
    aboutUs: {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
    },
    accentColor: { type: String, default: "#000000" },
    form: {
        title: { type: String, default: "Send Enquiry" },
        description: { type: String, default: "We'd love to hear about your event" },
        metaPixelId: { type: String, default: "" },
        fields: {
            contactNumber: { type: Boolean, default: true },
            whatsappNumber: { type: Boolean, default: true },
            enquiryType: { type: Boolean, default: true },
            event: { type: Boolean, default: true },
            eventType: { type: Boolean, default: true },
            eventDates: { type: Boolean, default: true },
            location: { type: Boolean, default: true },
            relation: { type: Boolean, default: true },
            budget: { type: Boolean, default: true }
        },
        // Per-field mandatory flags (separate from visibility).
        // If missing in older documents, client falls back to treating enabled fields as mandatory.
        mandatory: { type: Object, default: {} },
        customFields: [{
            name: { type: String },
            type: { type: String, enum: ['text', 'number'] },
            isMandatory: { type: Boolean, default: true }
        }],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refNo: { type: String },
    portfolioImages: { type: Array, default: [] },
    youtubeLinks: { type: Array, default: [] },
    storage_data: { type: Number, default: 5368709120 },
    remaining_data: { type: Number, default: 5368709120 },

    // Lead Form Image Management
    headerImages: { type: Array, default: [] },
    backgroundImages: { type: Array, default: [] },
    selectedHeaderImage: { type: String, default: "" },
    selectedHeaderImageMobile: { type: String, default: "" },
    selectedBackgroundImage: { type: String, default: "" },

    // Quotation Background Management
    quotationBackgroundImages: { type: Array, default: [] },
    selectedQuotationBackgroundImage: { type: String, default: "" },
    quotationBackgroundPortfolioVariants: { type: Object, default: {} },

    gstNumber: { type: String, default: "" },
    storageUsed: { type: Number, default: 0 },
        subscription: {
            planType: { type: String, default: "basic" },
            status: { type: String, default: "Active" },
            // Feature flags - derived from planType but customizable via featureOverrides
            lead_management: { type: Boolean, default: true },
            project_handling: { type: Boolean, default: true },
            quotation_invoicing_gst: { type: Boolean, default: true },
            digital_albums: { type: Boolean, default: true },
            photo_storage: { type: Boolean, default: true },
            inventory_management: { type: Boolean, default: true },
            crew_handling: { type: Boolean, default: true },
            inhouse_crew_handling: { type: Boolean, default: true },
            financial_dashboard: { type: Boolean, default: true },
            storage_backup: { type: Boolean, default: false },
            role_based_access: { type: Boolean, default: false },
            secure_gallery_pin_download: { type: Boolean, default: false },
            ai_features: { type: Boolean, default: false },
            hr_app: { type: Boolean, default: false },
            mobile_app: { type: Boolean, default: false },
            // Allows admin to override feature availability for testing/support
            featureOverrides: { type: Map, of: Boolean, default: {} },
            updatedAt: { type: Date, default: Date.now },
        },
    tourDone: { type: Boolean, default: false },
    brochures: [{
        name: { type: String },
        url: { type: String },
        key: { type: String }, // DigitalOcean Spaces key
        size: { type: Number },
        uploadedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });


studioSchema.index({ refNo: 1 }, { unique: true });
studioSchema.index({ createdBy: 1 });
studioSchema.index({ name: 1 });
studioSchema.index({ slug: 1 });

export const StudioModel = mongoose.model('Studio', studioSchema);