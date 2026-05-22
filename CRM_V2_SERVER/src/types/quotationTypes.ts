export interface QuotationStudio {
    name: string;
    address: string;
    gstNumber?: string;
    phone: string;
    logo?: string;
    banner?: string;
}

export interface QuotationClient {
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface QuotationEvent {
    type: string;
    date: Date;
    time?: string;
    location: string;
    numberOfPhotographers?: number;
}

export interface QuotationDiscount {
    enabled: boolean;
    type: 'percentage' | 'fixed';
    value: number;
}

export interface QuotationItem {
    event: string;
    description?: string;
    date?: Date;
    location?: string;
    crew: Array<{ name: string; cost: number; pricingId: any }>;
    equipment: Array<{ name: string; cost: number; pricingId: any }>;
    packages: Array<{
        name: string;
        amount: number;
        pricingId: any;
        packageItems: Array<{
            name: string;
            type: string;
            quantity: number;
            pricingId?: any;
        }>;
    }>;
    amount: number;
    total?: number;
    quantity?: number;
}

export interface PaymentMilestone {
    description: string;
    dueDate: Date;
    amount: number;
    paid?: boolean;
    paidAt?: Date;
}

export interface PaymentMethods {
    creditCards: boolean;
    stripe?: boolean;
    wiseStripe?: boolean;
    paypal?: boolean;
    venmo?: boolean;
    bankTransfer: boolean;
    cashOrCheck: boolean;
}

export interface QuotationCustomization {
    primaryColor: string;
    headerColor: string;
    sectionColor: string;
    fontFamily: string;
    tableColumnColor?: string;
    tableColumnOpacity?: number;
}

export interface CreateQuotationRequest {
    leadId: string;
    templateId?: string;
    quotationDate: string | Date;
    dueDate: string | Date;
    studio: QuotationStudio;
    client: any; // Can be ID or object
    background?: any;
    quotationBackground?: any;
    welcomeMessage?: string;
    event?: QuotationEvent;
    taxRate: number;
    discount: QuotationDiscount;
    items: QuotationItem[];
    paymentMilestones: PaymentMilestone[];
    paymentMethods: PaymentMethods;
    deliverables: Array<{ description: string; quantity: number }>;
    complimentary: Array<{ description: string; quantity: number }>;
    notes?: string;
    termsAndConditions?: string;
    customization: QuotationCustomization;
    serviceColumns?: any;
    fields?: any;
    validUntil?: string | Date;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;
}

export interface UpdateQuotationRequest extends Partial<CreateQuotationRequest> { }

export interface QuotationResponse {
    quotationId: string;
    quotationNumber: string;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    leadId: string;
    quotationDate: Date;
    dueDate: Date;
    studio: QuotationStudio;
    client: QuotationClient;
    event?: QuotationEvent;
    items: QuotationItem[];
    paymentMilestones: PaymentMilestone[];
    paymentMethods: PaymentMethods;
    notes?: string;
    termsAndConditions?: string;
    deliverables: Array<{ description: string; quantity: number }>;
    complimentary: Array<{ description: string; quantity: number }>;
    customization: QuotationCustomization;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    grandTotal: number;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date;
    viewedAt?: Date;
    acceptedAt?: Date;
    rejectedAt?: Date;
}

export interface QuotationListItem {
    quotationId: string;
    quotationNumber: string;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    grandTotal: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface SendQuotationRequest {
    recipientEmail: string;
    ccEmails?: string[];
    subject: string;
    message: string;
}

export interface PaginationQuery {
    status?: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    limit?: number;
    page?: number;
}
