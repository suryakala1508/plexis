// Email Template for Quotation Approval
// Email-safe using only tables, inline styles, and compatible CSS

interface QuotationEmailData {
    quotationNumber: string;
    quotationDate: Date;
    validUntil: Date;
    grandTotal: number;
    items: Array<{
        description: string;
        quantity: number;
        rate: number;
        total: number;
    }>;
    paymentMilestones?: Array<{
        description: string;
        dueDate: Date;
        amount: number;
    }>;
}

interface StudioData {
    name: string;
    tagline?: string;
    logo?: string;
    mainAddress: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        country: string;
    };
    accentColor?: string;
}

interface LeadData {
    name: string;
    email: string;
}

export const quotationEmailTemplate = (
    quotationData: QuotationEmailData,
    studioData: StudioData,
    leadData: LeadData,
    acceptUrl: string,
    declineUrl: string
) => {
    const accentColor = studioData.accentColor || '#8B5CF6';
    const formattedDate = new Date(quotationData.quotationDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    const formattedValidUntil = new Date(quotationData.validUntil).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });

    const formatINR = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    return {
        subject: `📋 Quotation from ${studioData.name} - Awaiting Your Response`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Quotation - ${studioData.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Main Container -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F3F4F6; padding: 20px 0;">
        <tr>
            <td align="center" style="padding: 0;">
                
                <!-- Email Card -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header with Gradient (Compact & Left Aligned) - FROM SECOND FILE -->
                    <tr>
                        <td style="background: linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%); padding: 35px 35px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <!-- Left: Logo & Name -->
                                    <td align="left" valign="middle">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                ${studioData.logo ? `
                                                <td style="padding-right: 18px;">
                                                    <img src="${studioData.logo}" alt="${studioData.name}" width="60" height="60" style="display: block; border-radius: 50%; border: 3px solid rgba(255, 255, 255, 0.3); object-fit: cover;">
                                                </td>
                                                ` : ''}
                                                <td>
                                                    <h1 style="margin: 0; padding: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px; line-height: 1.2;">
                                                        ${studioData.name}
                                                    </h1>
                                                    ${studioData.tagline ? `
                                                    <p style="margin: 4px 0 0; padding: 0; font-size: 14px; font-weight: 400; color: rgba(255, 255, 255, 0.85);">
                                                        ${studioData.tagline}
                                                    </p>
                                                    ` : ''}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    
                                    <!-- Right: Address (Compact) -->
                                    <td align="right" valign="middle" style="display: none; @media only screen and (min-width: 600px) { display: table-cell; }">
                                        <!-- Hidden on mobile if needed, or stacking. For simplicity keeping it responsive-safe table cell -->
                                        <p style="margin: 0; font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.8); line-height: 1.5; text-align: right;">
                                            ${studioData.mainAddress.addressLine1}${studioData.mainAddress.addressLine2 ? ', ' + studioData.mainAddress.addressLine2 : ''}<br>
                                            ${studioData.mainAddress.city}, ${studioData.mainAddress.state}
                                        </p>
                                    </td>
                                </tr>
                                <!-- Mobile Address Row (Optional hack if strictly needed, but let's stick to simple table cell first) -->
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content Body - FROM FIRST FILE -->
                    <tr>
                        <td style="padding: 40px 35px;">
                            
                            <!-- Greeting -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 24px;">
                                        <h2 style="margin: 0; padding: 0; font-size: 20px; font-weight: 600; color: #111827; line-height: 1.4;">
                                            Hello ${leadData.name},
                                        </h2>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <p style="margin: 0; padding: 0; font-size: 16px; font-weight: 400; color: #4B5563; line-height: 1.6;">
                                            Thank you for considering <strong style="color: #111827;">${studioData.name}</strong> for your photography needs. We've carefully prepared a customized quotation based on your requirements.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Quotation Info Card -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-radius: 12px; border: 2px solid #E5E7EB; margin-bottom: 30px; overflow: hidden;">
                                <!-- Top Border Accent -->
                                <tr>
                                    <td colspan="2" style="background: linear-gradient(90deg, ${accentColor}, #6D28D9); height: 4px; padding: 0;"></td>
                                </tr>
                                
                                <!-- Quotation Details Grid -->
                                <tr>
                                    <td style="padding: 24px 24px 12px 24px; width: 50%; vertical-align: top;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 4px;">
                                                    <p style="margin: 0; padding: 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Quotation ID
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #111827;">
                                                        #${quotationData.quotationNumber}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding: 24px 24px 12px 24px; width: 50%; vertical-align: top;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 4px;">
                                                    <p style="margin: 0; padding: 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Date Issued
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #111827;">
                                                        ${formattedDate}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 12px 24px 24px 24px; width: 50%; vertical-align: top;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 4px;">
                                                    <p style="margin: 0; padding: 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Valid Until
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #111827;">
                                                        ${formattedValidUntil}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td style="padding: 12px 24px 24px 24px; width: 50%; vertical-align: top;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 4px;">
                                                    <p style="margin: 0; padding: 0; font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
                                                        Items
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0; font-size: 15px; font-weight: 600; color: #111827;">
                                                        ${quotationData.items.length} Service${quotationData.items.length !== 1 ? 's' : ''}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Total Amount Section -->
                                <tr>
                                    <td colspan="2" style="background: linear-gradient(135deg, ${accentColor} 0%, #6D28D9 100%); padding: 20px 24px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 4px;">
                                                    <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 500; color: rgba(255, 255, 255, 0.9);">
                                                        Total Amount
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                                                        INR ${formatINR(quotationData.grandTotal)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            ${quotationData.paymentMilestones && quotationData.paymentMilestones.length > 0 ? `
                            <!-- Payment Milestones -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="padding-bottom: 16px;">
                                        <h3 style="margin: 0; padding: 0; font-size: 16px; font-weight: 600; color: #111827;">
                                            💳 Payment Milestones
                                        </h3>
                                    </td>
                                </tr>
                                ${quotationData.paymentMilestones.map((milestone, index) => `
                                <tr>
                                    <td style="padding: 12px 0; ${index < quotationData.paymentMilestones!.length - 1 ? 'border-bottom: 1px solid #E5E7EB;' : ''}">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td style="width: 70%; vertical-align: top;">
                                                    <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 500; color: #111827; padding-bottom: 4px;">
                                                        ${milestone.description}
                                                    </p>
                                                    <p style="margin: 0; padding: 0; font-size: 12px; font-weight: 400; color: #6B7280;">
                                                        Due: ${new Date(milestone.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td style="width: 30%; text-align: right; vertical-align: top;">
                                                    <p style="margin: 0; padding: 0; font-size: 16px; font-weight: 600; color: ${accentColor};">
                                                        INR ${formatINR(milestone.amount)}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                `).join('')}
                            </table>
                            ` : ''}
                            
                            <!-- Action Section -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #F9FAFB 0%, #EFF6FF 100%); border-radius: 12px; border: 2px solid #DBEAFE; padding: 28px 24px; margin-bottom: 30px;">
                                <tr>
                                    <td align="center" style="padding-bottom: 8px;">
                                        <h3 style="margin: 0; padding: 0; font-size: 18px; font-weight: 600; color: #111827;">
                                            Ready to Proceed?
                                        </h3>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 24px;">
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: #6B7280; line-height: 1.5;">
                                            Please review the quotation details above and let us know your decision
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Action Buttons -->
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 0 6px 12px 6px; width: 50%;">
                                                    <a href="${acceptUrl}" style="display: block; text-decoration: none; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; padding: 16px 20px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                                                        ✓ Accept Quotation
                                                    </a>
                                                </td>
                                                <td align="center" style="padding: 0 6px 12px 6px; width: 50%;">
                                                    <a href="${declineUrl}" style="display: block; text-decoration: none; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #FFFFFF; padding: 16px 20px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);">
                                                        ✗ Decline Quotation
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Closing Message -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td>
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 400; color: #6B7280; line-height: 1.6;">
                                            This quotation is valid until <strong style="color: #111827;">${formattedValidUntil}</strong>. If you have any questions or need modifications, please don't hesitate to contact us. We're committed to ensuring your complete satisfaction.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 24px;">
                                        <p style="margin: 0; padding: 0; font-size: 14px; font-weight: 500; color: #111827;">
                                            Best regards,<br>
                                            <span style="color: ${accentColor};">${studioData.name}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1F2937 0%, #111827 100%); padding: 28px 35px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <!-- Studio Info -->
                                <tr>
                                    <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td>
                                                    <p style="margin: 0; padding: 0 0 6px 0; font-size: 16px; font-weight: 600; color: #FFFFFF;">
                                                        ${studioData.name}
                                                    </p>
                                                    <p style="margin: 0; padding: 0; font-size: 13px; font-weight: 400; color: rgba(255, 255, 255, 0.7); line-height: 1.5;">
                                                        ${studioData.mainAddress.addressLine1}${studioData.mainAddress.addressLine2 ? ', ' + studioData.mainAddress.addressLine2 : ''}<br>
                                                        ${studioData.mainAddress.city}, ${studioData.mainAddress.state}, ${studioData.mainAddress.country}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Powered by Plexis -->
                                <tr>
                                    <td align="right" style="padding-top: 20px;">
                                        <table border="0" cellpadding="0" cellspacing="0" style="margin-left: auto;">
                                            <tr>
                                                <!-- Social Icons -->
                                                <td align="center" style="vertical-align: middle; padding-right: 15px;">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td align="center" style="padding-right: 10px;">
                                                                <a href="https://www.instagram.com/plexis.in/" target="_blank" style="text-decoration: none;">
                                                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="20" height="20" style="display: block; opacity: 0.7; border: 0;">
                                                                </a>
                                                            </td>
                                                            <td align="center">
                                                                <a href="https://www.linkedin.com/company/genz-galaxy/" target="_blank" style="text-decoration: none;">
                                                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="20" height="20" style="display: block; opacity: 0.7; border: 0;">
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                
                                                <!-- Powered by text -->
                                                <td align="center" style="vertical-align: middle; padding-right: 8px;">
                                                    <span style="font-weight: 500; color: rgba(255, 255, 255, 0.6); font-family: Arial, sans-serif; font-size: 12px;">Powered by</span>
                                                </td>
                                                
                                                <!-- Plexis logo -->
                                                <td align="center" style="vertical-align: middle;">
                                                    <a href="https://www.plexis.in" target="_blank" style="text-decoration: none;">
                                                        <img src="https://crm-client-main-branch.vercel.app/assets/logo-CtWZqSaM.png" alt="Plexis" width="65" height="22" style="display: block; opacity: 0.8; border: 0;">
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
        `
    };
};