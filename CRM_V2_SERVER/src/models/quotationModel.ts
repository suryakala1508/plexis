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

const quotationSchema = new mongoose.Schema({
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected'],
        default: 'draft'
    },
    quotationNumber: {
        type: String,
        unique: true
    },
    quotationDate: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date
    },
    studio: {
        name: { type: String },
        address: { type: String },
        gstNumber: { type: String },
        phone: { type: String },
        logo: { type: String },
        tagline: { type: String }
    },
    client: { type: mongoose.Schema.Types.Mixed, default: {} },
    background: { type: backgroundSchema, default: () => ({}) },
    quotationBackground: { type: backgroundSchema, default: null },
    event: {
        type: { type: String },
        date: { type: String },
        time: { type: String },
        location: { type: String },
        numberOfEvents: { type: Number, default: 1 },
        numberOfPhotographers: { type: Number }
    },
    taxRate: {
        type: Number,
        required: true,
        default: 0
    },
    discount: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 }
    },
    serviceColumns: {
        date: { type: Boolean, default: true },
        location: { type: Boolean, default: true },
        crew: { type: Boolean, default: true },
        equipment: { type: Boolean, default: false },
        individualAmounts: { type: Boolean, default: true },
        subTotal: { type: Boolean, default: true },
        gst: { type: Boolean, default: true },
        discount: { type: Boolean, default: false },
        grandTotal: { type: Boolean, default: true }
    },
    fields: { type: fieldsSchema, default: () => ({}) },
    items: [{
        event: { type: String }, // Event Name
        description: { type: String }, // Keep for backward compatibility
        date: { type: String },
        location: { type: String },
        crew: [{
            name: { type: String },
            cost: { type: Number },
            pricingId: { type: mongoose.Schema.Types.ObjectId }
        }],
        equipment: [{
            name: { type: String },
            cost: { type: Number },
            pricingId: { type: mongoose.Schema.Types.ObjectId }
        }],
        packages: [{
            name: { type: String },
            amount: { type: Number },
            pricingId: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingItem' },
            packageItems: [{
                name: { type: String },
                type: { type: String },
                quantity: { type: Number },
                pricingId: { type: mongoose.Schema.Types.ObjectId }
            }]
        }],
        amount: { type: Number, default: 0 }, // Replaces total
        quantity: { type: Number }, // Deprecated
        rate: { type: Number }, // Deprecated
        total: { type: Number } // Deprecated
    }],
    deliverables: [{
        description: { type: String },
        quantity: { type: Number, default: 1 }
    }],
    complimentary: [{
        description: { type: String },
        quantity: { type: Number, default: 1 }
    }],
    welcomeMessage: { type: String, default: '' },
    paymentMilestones: [{
        description: { type: String, required: true },
        dueDate: { type: Date, required: true },
        amount: { type: Number, required: true },
        paid: { type: Boolean, default: false },
        paidAt: { type: Date }
    }],
    paymentMethods: {
        creditCards: { type: Boolean, default: false },
        stripe: { type: Boolean, default: false },
        wiseStripe: { type: Boolean, default: false },
        paypal: { type: Boolean, default: false },
        venmo: { type: Boolean, default: false },
        bankTransfer: { type: Boolean, default: false },
        cashOrCheck: { type: Boolean, default: false }
    },
    eventName: { type: String, default: '' },
    notes: { type: String },
    termsAndConditions: { type: String },
    customization: {
        primaryColor: { type: String, default: '#D4AF37' },
        headerColor: { type: String, default: '#1F2937' },
        sectionColor: { type: String, default: '#F9FAFB' },
        fontFamily: { type: String, default: 'Inter' },
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
            type: Map, 
            of: new mongoose.Schema({
                type: { type: String, enum: ['solid', 'gradient', 'image'], default: 'solid' },
                color: { type: String, default: '' },
                gradientFrom: { type: String, default: '' },
                gradientTo: { type: String, default: '' },
                gradientDirection: { type: String, default: '' },
                imageUrl: { type: String, default: '' },
                imageOpacity: { type: Number, default: 0.15 },
                imageSize: { type: String, enum: ['cover', 'contain', 'repeat'], default: 'cover' }
            }, { _id: false }),
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
    },
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    taxAmount: {
        type: Number,
        required: true,
        default: 0
    },
    discountAmount: {
        type: Number,
        required: true,
        default: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0
    },
    selectedPaymentMethod: { type: String },
    sentAt: { type: Date },
    viewedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    isContract: { type: Boolean, default: false },
    pdfUrl: { type: String },
    isPdfOutdated: { type: Boolean, default: true }
}, { timestamps: true });

quotationSchema.index({ leadId: 1, createdAt: -1 });
quotationSchema.index({ userId: 1, isDeleted: 1 });

export const QuotationModel = mongoose.model('Quotation', quotationSchema);
