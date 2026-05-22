import { Response } from "express";
import { AuthRequest } from "../../core/middleware";
import { QuotationModel } from "../../models/quotationModel";
import { ContractModel } from "../../models/contractModel";
import { generateContractPDF, generateContractPDFFromPreview, generateContractHTMLFromPreview, convertHtmlToPdf } from "../../core/services/pdf";
import { ContractData } from "../../types/pdfTypes";
import mongoose from "mongoose";
import { sendMail } from "../../core/services/mailer";
import { LeadModel } from "../../models/leadModel";
import { User } from "../../models/userModel";
import { StudioModel } from "../../models/studioModel";

interface ContractExportRequest {
    contractData: {
        agreement: {
            agreementDate: string;
            corporationName: string;
            corporationAddress: string;
            photographerName: string;
            photographerAddress: string;
            eventDescription: string;
            duration: string;
            deliveryDays: string | number;
        };
        terms: {
            customTerms: string;
        };
        items: Array<{
            description: string;
            quantity: number;
            rate: number;
            total?: number;
        }>;
        paymentMilestones: Array<{
            description: string;
            amount: number;
            dueDate: string;
        }>;
        copyright: {
            transferCopyright: boolean;
            imagesDescription: string;
            photoCredit: string;
            licensingTerms: string;
        };
        disclaimer: {
            text: string;
        };
    };
    quotationData?: {
        studio?: {
            name: string;
            address: string;
            phone?: string;
            gstNumber?: string;
            logo?: string;
            banner?: string;
            website?: string;
        };
        client?: {
            name: string;
            email?: string;
            phone?: string;
            address?: string;
        };
        event?: {
            type: string;
            date?: string;
            location?: string;
        };
        taxRate?: number;
        discount?: {
            enabled: boolean;
            type: string;
            value: number;
        };
        grandTotal?: number;
    };
}

interface ContractExportRequest {
    contractData: {
        agreement: {
            agreementDate: string;
            corporationName: string;
            corporationAddress: string;
            photographerName: string;
            photographerAddress: string;
            eventDescription: string;
            duration: string;
            deliveryDays: string | number;
        };
        terms: {
            customTerms: string;
        };
        items: Array<{
            description: string;
            quantity: number;
            rate: number;
            total?: number;
        }>;
        paymentMilestones: Array<{
            description: string;
            amount: number;
            dueDate: string;
        }>;
        copyright: {
            transferCopyright: boolean;
            imagesDescription: string;
            photoCredit: string;
            licensingTerms: string;
        };
        disclaimer: {
            text: string;
        };
    };
    quotationData?: {
        studio?: {
            name: string;
            address: string;
            phone?: string;
            gstNumber?: string;
            logo?: string;
            banner?: string;
            website?: string;
        };
        client?: {
            name: string;
            email?: string;
            phone?: string;
            address?: string;
        };
        event?: {
            type: string;
            date?: string;
            location?: string;
        };
        taxRate?: number;
        discount?: {
            enabled: boolean;
            type: string;
            value: number;
        };
        grandTotal?: number;
    };
}

export const createContractFromQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };

        if (!mongoose.Types.ObjectId.isValid(quotationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }

        const quotation = await QuotationModel.findOne({
            _id: quotationId,
            userId: req.user!._id,
            isDeleted: false
        });

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        // Allow contract creation from any quotation status (not just accepted)
        // This enables creating contracts even if quotation isn't accepted yet

        // Populate related data
        const populatedQuotation = await QuotationModel.findById(quotationId)
            .populate('studio')
            .populate('client')
            .populate('items')
            .lean();

        if (!populatedQuotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        // Map quotation data to contract format
        const formatFull = (d?: any) => d ? new Date(d).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';
        const formatShort = (d?: any) => d ? new Date(d).toLocaleDateString('en-US') : 'N/A';

        const contractData: ContractData = {
            title: 'CONTRACT',
            contractDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            effectiveDate: formatFull(populatedQuotation.quotationDate),
            companyName: (populatedQuotation.studio as any)?.name || 'Studio Name',
            clientName: (populatedQuotation.client as any)?.name || 'Client Name',
            photographerName: (populatedQuotation.studio as any)?.ownerName || 'Photographer Name',
            agreementText: `This agreement herein referred to as the "Contract" executed as of ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, hereby referred as the 'Effective Date' is made between ${(populatedQuotation.studio as any)?.name || 'Company Name'}, hereby referred to as "PHOTOGRAPHER" and ${(populatedQuotation.client as any)?.name || 'Client Name'}, hereby referred to as "CLIENT".`,
            terms: [
                {
                    title: 'AGREEMENT',
                    content: `The CLIENT and the PHOTOGRAPHER agree to start a working agreement starting on ${formatFull(populatedQuotation.quotationDate)}. The CLIENT wishes to obtain the PHOTOGRAPHER's service for the ${populatedQuotation.event?.type || 'event'} listed below. In exchange for the services mentioned in the quotation, CLIENT agrees to pay PHOTOGRAPHER the total amount of INR ${new Intl.NumberFormat('en-IN').format(populatedQuotation.grandTotal || 0)}. ${populatedQuotation.event ? `The event is scheduled for ${formatFull(populatedQuotation.event.date)} at ${populatedQuotation.event.location}.` : ''}`
                },
                {
                    title: 'SERVICES',
                    content: `The PHOTOGRAPHER agrees to provide the following services: ${(populatedQuotation.items as any[]).map((item: any) => item.name || item.description).join(', ')}. All services will be delivered as per the terms outlined in the accepted quotation.`
                },
                {
                    title: 'PAYMENT TERMS',
                    content: `The total contract value is INR ${new Intl.NumberFormat('en-IN').format(populatedQuotation.grandTotal || 0)}. ${populatedQuotation.paymentMilestones && populatedQuotation.paymentMilestones.length > 0 ? 'Payment shall be made in milestones as follows: ' + populatedQuotation.paymentMilestones.map((m: any) => `${m.description} - INR ${new Intl.NumberFormat('en-IN').format(m.amount || 0)} due by ${formatShort(m.dueDate)}`).join('; ') + '.' : 'Full payment is due as per the agreed terms.'} ${populatedQuotation.termsAndConditions || ''}`
                },
                {
                    title: 'CANCELLATION POLICY',
                    content: `CLIENT may request reasonable changes to the Services described above. Any changes to the Services must be in writing and signed by both CLIENT and PHOTOGRAPHER. Cancellation terms and refund policies will be applied as per industry standards and mutual agreement.`
                }
            ],
            fees: {
                totalAmount: populatedQuotation.grandTotal,
                description: `Total contract value including all services, taxes, and applicable discounts`
            },
            clientSignature: {
                name: (populatedQuotation.client as any)?.name || 'Client Name',
                date: '',
                signature: ''
            },
            photographerSignature: {
                name: (populatedQuotation.studio as any)?.ownerName || (populatedQuotation.studio as any)?.name || 'Photographer Name',
                date: '',
                signature: ''
            },
            footerCompanyName: (populatedQuotation.studio as any)?.name || 'YOUR NAME PHOTOGRAPHY',
            footerWebsite: (populatedQuotation.studio as any)?.website || 'www.yourcompanywebsite.com',
            headerImage: (populatedQuotation.studio as any)?.banner
        };

        const contractUrl = await generateContractPDF(contractData);

        // Update quotation to mark as contract
        await QuotationModel.findByIdAndUpdate(
            quotationId,
            { isContract: true },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Contract created from quotation successfully",
            data: {
                contractUrl
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const exportContractToPdf = async (req: AuthRequest, res: Response) => {
    try {
        const { contractId } = req.params as { contractId: string };
        console.log(`[PDF Export] ========== START ==========`);
        console.log(`[PDF Export] Contract ID: ${contractId || 'NONE'}`);
        console.log(`[PDF Export] User ID: ${req.user?._id || 'NOT AUTHENTICATED'}`);
        console.log(`[PDF Export] User Email: ${req.user?.email || 'N/A'}`);

        let contractData: any;
        let quotationData: any = null;

        // If contractId is provided, fetch contract from database
        if (contractId) {
            console.log(`[PDF Export] Fetching contract from database...`);
            const contract = await ContractModel.findOne({
                _id: contractId,
                userId: req.user!._id,
                isDeleted: false
            }).lean();

            console.log(`[PDF Export] Contract found:`, contract ? 'YES' : 'NO');
            if (contract) {
                console.log(`[PDF Export] Contract details:`, {
                    id: contract._id,
                    userId: contract.userId,
                    leadId: contract.leadId,
                    status: contract.status
                });
            }

            if (!contract) {
                console.log(`[PDF Export] Contract NOT FOUND - returning 404`);
                return res.status(404).json({
                    success: false,
                    message: "Contract not found"
                });
            }

            contractData = contract;

            // If contract has quotationId, fetch quotation data
            if (contract.quotationId) {
                const quotation = await QuotationModel.findById(contract.quotationId)
                    .populate('client')
                    .populate('studio')
                    .lean();

                if (quotation) {
                    quotationData = quotation;
                }
            }
        } else {
            // Legacy: get contractData from request body
            const bodyData = req.body as ContractExportRequest;
            contractData = bodyData.contractData;
            quotationData = bodyData.quotationData || null;

            if (!contractData) {
                return res.status(400).json({
                    success: false,
                    message: "Contract data is required"
                });
            }
        }

        const formatFull = (d?: string | Date) => {
            if (!d) return 'N/A';
            const date = typeof d === 'string' ? new Date(d) : d;
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        const formatShort = (d?: string | Date) => {
            if (!d) return 'N/A';
            const date = typeof d === 'string' ? new Date(d) : d;
            return date.toLocaleDateString('en-US');
        };

        // Calculate totals - use contract's calculated totals if available, otherwise calculate
        const items = contractData.items || [];
        let subtotal: number;
        let tax: number;
        let discount: number;
        let grandTotal: number;

        if (contractData.subtotal !== undefined && contractData.grandTotal !== undefined) {
            // Use stored totals from contract
            subtotal = contractData.subtotal;
            tax = contractData.taxAmount || 0;
            discount = contractData.discountAmount || 0;
            grandTotal = contractData.grandTotal;
        } else {
            // Calculate from items
            subtotal = items.reduce((sum: number, item: { description: string; quantity: number; rate: number; total?: number }) => sum + (item.total || (item.rate * item.quantity)), 0);
            const taxRate = quotationData?.taxRate || 0;
            tax = (subtotal * taxRate) / 100;
            discount = quotationData?.discount?.enabled
                ? quotationData.discount.type === 'percentage'
                    ? (subtotal * quotationData.discount.value) / 100
                    : quotationData.discount.value
                : 0;
            grandTotal = subtotal + tax - discount;
        }

        // Build agreement text
        const clientName = quotationData?.client?.name || contractData.agreement.corporationName;
        const studioName = quotationData?.studio?.name || contractData.agreement.photographerName;
        const clientAddress = quotationData?.client?.address || contractData.agreement.corporationAddress;
        const studioAddress = quotationData?.studio?.address || contractData.agreement.photographerAddress;

        let agreementText = `This agreement herein referred to as the "Contract" executed as of ${formatFull(contractData.agreement.agreementDate)}, hereby referred as the 'Effective Date' is made between ${studioName}, hereby referred to as "PHOTOGRAPHER"`;
        if (studioAddress) {
            agreementText += ` located at ${studioAddress}`;
        }
        agreementText += ` and ${clientName}, hereby referred to as "CLIENT"`;
        if (clientAddress) {
            agreementText += ` located at ${clientAddress}`;
        }
        agreementText += '.';

        // Build terms
        const terms: Array<{ title: string; content: string }> = [];

        // Agreement term
        let agreementContent = `The CLIENT and the PHOTOGRAPHER agree to start a working agreement starting on ${formatFull(contractData.agreement.agreementDate)}.`;
        if (contractData.agreement.duration) {
            agreementContent += ` This Agreement is for the following length of time: ${contractData.agreement.duration}.`;
        }
        if (contractData.agreement.eventDescription) {
            agreementContent += ` The CLIENT wishes to obtain the PHOTOGRAPHER's service for the ${contractData.agreement.eventDescription} listed below.`;
        }
        if (quotationData?.event?.date) {
            agreementContent += ` The event is scheduled for ${formatFull(quotationData.event.date)}.`;
        }
        if (quotationData?.event?.location) {
            agreementContent += ` Location: ${quotationData.event.location}.`;
        }
        agreementContent += ` In exchange for the services mentioned, CLIENT agrees to pay PHOTOGRAPHER the total amount of INR ${new Intl.NumberFormat('en-IN').format(grandTotal)}.`;

        terms.push({
            title: 'AGREEMENT',
            content: agreementContent
        });

        // Services term
        if (items.length > 0) {
            const servicesList = items.map((item: { description: string; quantity: number; rate: number; total?: number }) => `${item.description} (Quantity: ${item.quantity}, Rate: INR ${new Intl.NumberFormat('en-IN').format(item.rate)})`).join('; ');
            terms.push({
                title: 'SERVICES',
                content: `The PHOTOGRAPHER agrees to provide the following services: ${servicesList}. All services will be delivered as per the terms outlined in this contract.`
            });
        }

        // Payment terms
        let paymentContent = `The total contract value is INR ${new Intl.NumberFormat('en-IN').format(grandTotal)}.`;
        if (contractData.paymentMilestones && contractData.paymentMilestones.length > 0) {
            paymentContent += ' Payment shall be made in milestones as follows: ';
            paymentContent += contractData.paymentMilestones.map((m: { description: string; amount: number; dueDate: string }) => {
                let milestoneText = `${m.description} - INR ${new Intl.NumberFormat('en-IN').format(m.amount || 0)}`;
                if (m.dueDate) {
                    milestoneText += ` due by ${formatShort(m.dueDate)}`;
                }
                return milestoneText;
            }).join('; ');
            paymentContent += '.';
        } else {
            paymentContent += ' Full payment is due as per the agreed terms.';
        }
        if (contractData.agreement.deliveryDays) {
            paymentContent += ` Photographs shall be delivered within ${contractData.agreement.deliveryDays} days of event completion.`;
        }

        terms.push({
            title: 'PAYMENT TERMS',
            content: paymentContent
        });

        // Custom terms
        if (contractData.terms.customTerms) {
            terms.push({
                title: 'TERMS AND CONDITIONS',
                content: contractData.terms.customTerms
            });
        }

        // Copyright terms
        if (contractData.copyright.transferCopyright && contractData.copyright.imagesDescription) {
            terms.push({
                title: 'COPYRIGHT TRANSFER',
                content: `The service provider agrees to transfer the copyrights of images to the Client. The image(s) subject to this agreement are as follows: ${contractData.copyright.imagesDescription}.`
            });
        } else if (contractData.copyright.photoCredit || contractData.copyright.licensingTerms) {
            let copyrightContent = 'The Service Provider retains all rights to each image. The Service Provider also retains all rights not expressed in the agreement including advertising rights.';
            if (contractData.copyright.photoCredit) {
                copyrightContent += ` The Client agrees to give the Service Provider proper photo credit on each reprint as follows: ${contractData.copyright.photoCredit}.`;
            }
            if (contractData.copyright.licensingTerms) {
                copyrightContent += ` ${contractData.copyright.licensingTerms}`;
            }
            terms.push({
                title: 'COPYRIGHT AND LICENSING',
                content: copyrightContent
            });
        }

        // Disclaimer
        if (contractData.disclaimer.text) {
            terms.push({
                title: 'DISCLAIMER',
                content: contractData.disclaimer.text
            });
        }

        // Cancellation policy
        terms.push({
            title: 'CANCELLATION POLICY',
            content: 'CLIENT may request reasonable changes to the Services described above. Any changes to the Services must be in writing and signed by both CLIENT and PHOTOGRAPHER. Cancellation terms and refund policies will be applied as per industry standards and mutual agreement.'
        });

        const contractPdfData: ContractData = {
            title: 'SERVICE AGREEMENT CONTRACT',
            contractDate: formatFull(contractData.agreement.agreementDate),
            effectiveDate: formatFull(contractData.agreement.agreementDate),
            companyName: studioName,
            clientName: clientName,
            photographerName: contractData.agreement.photographerName || studioName,
            agreementText: agreementText,
            terms: terms,
            fees: {
                totalAmount: grandTotal,
                description: `Total contract value including all services, taxes, and applicable discounts`
            },
            clientSignature: {
                name: clientName,
                date: '',
                signature: ''
            },
            photographerSignature: {
                name: contractData.agreement.photographerName || studioName,
                date: '',
                signature: ''
            },
            footerCompanyName: studioName,
            footerWebsite: quotationData?.studio?.website || '',
            headerImage: quotationData?.studio?.banner
        };

        console.log(`[PDF Export] Data prepared. Calling generateContractPDFFromPreview...`);
        const contractUrl = await generateContractPDFFromPreview(contractData, quotationData);
        console.log(`[PDF Export] PDF generated successfully: ${contractUrl}`);

        // Update contract with PDF URL if contractId exists
        if (contractId) {
            console.log(`[PDF Export] Updating contract ${contractId} with PDF URL...`);
            await ContractModel.findByIdAndUpdate(contractId, { pdfUrl: contractUrl });
        }

        res.status(200).json({
            success: true,
            message: "Contract PDF generated successfully",
            data: {
                pdfUrl: contractUrl
            }
        });
    } catch (err: any) {
        console.error('Error exporting contract PDF:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to export contract PDF'
        });
    }
};

export const sendContract = async (req: AuthRequest, res: Response) => {
    try {
        const { contractId } = req.params as { contractId: string };
        const { recipientEmail, recipientName, subject, message } = req.body;

        // Validate contract ID
        if (!mongoose.Types.ObjectId.isValid(contractId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contract ID"
            });
        }

        // Validate email data
        if (!recipientEmail || !recipientName) {
            return res.status(400).json({
                success: false,
                message: "Recipient email and name are required"
            });
        }

        // Fetch contract with populated data
        const contract = await ContractModel.findOne({
            _id: contractId,
            userId: req.user!._id,
            isDeleted: false
        }).lean();

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        // Fetch quotation data if available
        let quotationData: any = null;
        if (contract.quotationId) {
            quotationData = await QuotationModel.findById(contract.quotationId)
                .populate('client')
                .populate('studio')
                .lean();
        }

        // Fetch lead data
        const lead = await LeadModel.findById(contract.leadId).lean();
        if (!lead || !lead.email) {
            return res.status(400).json({
                success: false,
                message: "Lead email not found"
            });
        }

        // Fetch user and studio details
        const user = await User.findById(req.user!._id).select('refNo firstName lastName email').lean();
        if (!user || !user.refNo) {
            return res.status(404).json({
                success: false,
                message: "User or studio reference not found"
            });
        }

        const studio = await StudioModel.findOne({ refNo: user.refNo }).lean();
        if (!studio) {
            return res.status(404).json({
                success: false,
                message: "Studio not found"
            });
        }

        // Generate PDF if not already generated
        let pdfUrl = contract.pdfUrl;
        let attachments: any[] = [];

        if (!pdfUrl) {
            try {
                pdfUrl = await generateContractPDFFromPreview(contract, quotationData);
                await ContractModel.findByIdAndUpdate(contractId, { pdfUrl });

                // Generate PDF buffer for attachment
                const html = generateContractHTMLFromPreview(contract, quotationData);
                const pdfBuffer = await convertHtmlToPdf(html);

                attachments.push({
                    filename: `Contract-${contract.contractNumber || contractId}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                });
            } catch (pdfError) {
                console.error('Error generating PDF:', pdfError);
                // Continue without attachment
            }
        } else {
            // If PDF URL exists, we can optionally fetch it and attach
            // For now, we'll just send the email with the message
        }

        // Prepare email content
        const emailSubject = subject || `Service Agreement Contract from ${studio.name}`;
        const emailText = message || `Hello ${recipientName},\n\nPlease find attached the service agreement contract.\n\nThank you!\n\n${studio.name}`;

        // Create HTML version of the message
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9fafb; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Service Agreement Contract</h2>
                    </div>
                    <div class="content">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                    <div class="footer">
                        <p>Best regards,<br>${studio.name}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email
        await sendMail(
            recipientEmail,
            emailSubject,
            emailText,
            emailHtml,
            attachments
        );

        res.status(200).json({
            success: true,
            message: "Contract sent successfully",
            data: {
                sentTo: recipientEmail,
                contractNumber: contract.contractNumber || contractId
            }
        });
    } catch (err: any) {
        console.error('Error sending contract:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Save Contract Draft
export const saveContractDraft = async (req: AuthRequest, res: Response) => {
    try {
        const contractData = req.body;

        if (!contractData.leadId || !contractData.items || contractData.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Lead ID and at least one item are required"
            });
        }

        // Fetch lead to get client contact information
        const lead = await LeadModel.findById(contractData.leadId).lean();
        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        // Ensure client contact is stored in agreement
        if (contractData.agreement) {
            contractData.agreement.clientEmail = contractData.agreement.clientEmail || lead.email || '';
            contractData.agreement.clientPhone = contractData.agreement.clientPhone || lead.contactNumber || '';
        }

        // Calculate totals
        const subtotal = contractData.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
        const taxAmount = contractData.taxAmount || 0;
        const discountAmount = contractData.discountAmount || 0;
        const grandTotal = subtotal + taxAmount - discountAmount;

        const newContract = new ContractModel({
            ...contractData,
            userId: req.user!._id,
            status: 'draft',
            contractNumber: `CT${Date.now()}`,
            subtotal,
            taxAmount,
            discountAmount,
            grandTotal
        });

        await newContract.save();

        const savedContract = newContract.toObject();

        res.status(201).json({
            success: true,
            message: "Contract draft saved successfully",
            data: {
                contractId: savedContract._id,
                contractNumber: savedContract.contractNumber,
                status: savedContract.status,
                createdAt: savedContract.createdAt,
                updatedAt: savedContract.updatedAt
            }
        });
    } catch (err: any) {
        console.error('Error saving contract draft:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Get Contract by ID
export const getContractById = async (req: AuthRequest, res: Response) => {
    try {
        const { contractId } = req.params as { contractId: string };

        if (!mongoose.Types.ObjectId.isValid(contractId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contract ID"
            });
        }

        const contract = await ContractModel.findOne({
            _id: contractId,
            userId: req.user!._id,
            isDeleted: false
        }).lean();

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        res.status(200).json({
            success: true,
            data: contract
        });
    } catch (err: any) {
        console.error('Error fetching contract:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Get Contracts by Lead
export const getContractsByLead = async (req: AuthRequest, res: Response) => {
    try {
        const { leadId } = req.params as { leadId: string };

        if (!mongoose.Types.ObjectId.isValid(leadId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID"
            });
        }

        const contracts = await ContractModel.find({
            leadId: leadId,
            userId: req.user!._id,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: {
                contracts
            }
        });
    } catch (err: any) {
        console.error('Error fetching contracts:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Update Contract
export const updateContract = async (req: AuthRequest, res: Response) => {
    try {
        const { contractId } = req.params as { contractId: string };
        const updateData = req.body;

        if (!mongoose.Types.ObjectId.isValid(contractId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contract ID"
            });
        }

        const contract = await ContractModel.findOne({
            _id: contractId,
            userId: req.user!._id,
            isDeleted: false
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        // Prevent editing signed contracts
        if (contract.status === 'signed') {
            return res.status(403).json({
                success: false,
                message: "Cannot edit a signed contract"
            });
        }

        // Recalculate totals if items are being updated
        if (updateData.items) {
            const subtotal = updateData.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
            const taxAmount = updateData.taxAmount || contract.taxAmount || 0;
            const discountAmount = updateData.discountAmount || contract.discountAmount || 0;
            updateData.subtotal = subtotal;
            updateData.taxAmount = taxAmount;
            updateData.discountAmount = discountAmount;
            updateData.grandTotal = subtotal + taxAmount - discountAmount;
        }

        Object.assign(contract, updateData);
        await contract.save();

        const updatedContract = contract.toObject();

        res.status(200).json({
            success: true,
            message: "Contract updated successfully",
            data: {
                contractId: updatedContract._id,
                status: updatedContract.status,
                updatedAt: updatedContract.updatedAt
            }
        });
    } catch (err: any) {
        console.error('Error updating contract:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Delete Contract
export const deleteContract = async (req: AuthRequest, res: Response) => {
    try {
        const { contractId } = req.params as { contractId: string };

        if (!mongoose.Types.ObjectId.isValid(contractId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contract ID"
            });
        }

        const contract = await ContractModel.findOne({
            _id: contractId,
            userId: req.user!._id,
            isDeleted: false
        });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Contract not found"
            });
        }

        if (contract.status === 'signed') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete a signed contract"
            });
        }

        contract.isDeleted = true;
        contract.deletedAt = new Date();
        await contract.save();

        res.status(200).json({
            success: true,
            message: "Contract deleted successfully"
        });
    } catch (err: any) {
        console.error('Error deleting contract:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};
