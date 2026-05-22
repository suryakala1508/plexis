export interface QuotationItem {
    description: string;
    rateCard: number;
    qty: number;
    tax: number;
    disc: number;
    amount: number;
}

export interface QuotationData {
    quoteNo: string;
    quoteDate: string;
    dueDate: string;
    fromCompany: string;
    fromName: string;
    fromEmail: string;
    fromPhone: string;
    fromWebsite: string;
    fromAddress: string;
    toCompany: string;
    toEmail: string;
    toPhone: string;
    toAddress: string;
    items: QuotationItem[];
    subtotal: number;
    discount: number;
    discountPercent?: number;
    shippingCost: number;
    salesTax: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    paymentInstructions: {
        paypal?: string;
        checkPayableTo?: string;
        bankTransfer?: {
            routingABA?: string;
            accountNumber?: string;
        };
    };
    notes?: string;
    logo?: string;
}


export interface ContractData {
    title: string;
    contractDate: string;
    effectiveDate: string;
    companyName: string;
    clientName?: string;
    photographerName?: string;
    agreementText: string;
    terms: {
        title: string;
        content: string;
    }[];
    fees?: {
        hourlyRate?: number;
        totalAmount?: number;
        description?: string;
    };
    clientSignature?: {
        name: string;
        date?: string;
        signature?: string; // Base64 image or empty
    };
    photographerSignature?: {
        name: string;
        date?: string;
        signature?: string; // Base64 image or empty
    };
    footerCompanyName?: string;
    footerWebsite?: string;
    headerImage?: string; // Base64 or URL for decorative header
}