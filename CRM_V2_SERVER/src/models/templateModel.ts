import mongoose from 'mongoose';

const backgroundSchema = new mongoose.Schema({
    type: { type: String, enum: ['solid', 'gradient', 'image'], default: 'solid' },
    color: { type: String, default: '#ffffff' },
    gradientFrom: { type: String, default: '#ffffff' },
    gradientTo: { type: String, default: '#f3e8ff' },
    gradientDirection: { type: String, default: 'to bottom right' },
    headerColor: { type: String, default: '#22031f' },
    accentColor: { type: String, default: '#9916b1' },
    imageUrl: { type: String, default: '' },
    imageOpacity: { type: Number, default: 0.15 },
    imageSize: { type: String, enum: ['cover', 'contain', 'repeat'], default: 'cover' }
}, { _id: false });

const fieldsSchema = new mongoose.Schema({
    studioHeader: { type: Boolean, default: true },
    welcomeMessage: { type: Boolean, default: true },
    clientDetails: { type: Boolean, default: true },
    eventDetails: { type: Boolean, default: true },
    servicesTable: { type: Boolean, default: true },
    deliverablesTable: { type: Boolean, default: true },
    complimentaryTable: { type: Boolean, default: false },
    paymentTimeline: { type: Boolean, default: true },
    notes: { type: Boolean, default: true },
    termsAndConditions: { type: Boolean, default: true },
    gst: { type: Boolean, default: true },
    discount: { type: Boolean, default: false },
    subTotal: { type: Boolean, default: true },
    grandTotal: { type: Boolean, default: true }
}, { _id: false });

const serviceColumnsSchema = new mongoose.Schema({
    date: { type: Boolean, default: true },
    location: { type: Boolean, default: true },
    crew: { type: Boolean, default: true },
    equipment: { type: Boolean, default: false },
    individualAmounts: { type: Boolean, default: true },
    subTotal: { type: Boolean, default: true },
    gst: { type: Boolean, default: true },
    discount: { type: Boolean, default: false },
    grandTotal: { type: Boolean, default: true }
}, { _id: false });

const customizationSchema = new mongoose.Schema({
    primaryColor: { type: String, default: '#9916b1' },
    headerColor: { type: String, default: '#22031f' },
    fontFamily: { type: String, default: 'Poppins' },
    tableColumnColor: { type: String, default: '#ffffff' },
    tableColumnOpacity: { type: Number, default: 1 },
    showPortfolio: { type: Boolean, default: false },
    portfolioLayout: { type: String, enum: ['grid', 'masonry', 'large'], default: 'grid' },
    portfolioImages: [{ type: String }],
    introPageBackground: {
        type: { type: String, enum: ['solid', 'gradient', 'image'], default: 'solid' },
        color: { type: String, default: '' },
        gradientFrom: { type: String, default: '' },
        gradientTo: { type: String, default: '' },
        gradientDirection: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        imageOpacity: { type: Number, default: 0.15 },
        imageSize: { type: String, enum: ['cover', 'contain', 'repeat'], default: 'cover' }
    },
    portfolioPageBackgrounds: {
        type: Object,
        default: {}
    },
    coverDescription: { type: String, default: '' },
    featuredOnItems: [{
        name: { type: String },
        url: { type: String }
    }],
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    facebook: { type: String, default: '' }
}, { _id: false });

const templateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    background: { type: backgroundSchema, default: () => ({}) },
    quotationBackground: { type: backgroundSchema, default: null },
    welcomeMessage: {
        type: String,
        default: 'Thank you for trusting us with your special day. We would be honored to be a part of your celebrations and tell your story through our vision.'
    },
    fields: { type: fieldsSchema, default: () => ({}) },
    serviceColumns: { type: serviceColumnsSchema, default: () => ({}) },
    customization: { type: customizationSchema, default: () => ({}) },
    notes: { type: String, default: '' },
    termsAndConditions: { type: String, default: '' },
    deliverables: [{
        description: { type: String },
        quantity: { type: Number, default: 1 }
    }],
    complimentary: [{
        description: { type: String }
    }],
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

templateSchema.index({ userId: 1 });
templateSchema.index({ userId: 1, isDeleted: 1 });
templateSchema.index(
    { userId: 1, isDefault: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isDefault: true,
            isDeleted: false,
        },
    }
);

export const TemplateModel = mongoose.model('Template', templateSchema);
