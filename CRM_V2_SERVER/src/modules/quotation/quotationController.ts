import { AuthRequest } from "../../core/middleware";
import { Request, Response } from "express";
import { QuotationModel } from "../../models/quotationModel";
import { CreateQuotationRequest, UpdateQuotationRequest, SendQuotationRequest, PaginationQuery } from "../../types/quotationTypes";
import mongoose from "mongoose";
import { LeadModel } from "../../models/leadModel";
import { generateQuotationPDFFromPreview } from "../../core/services/pdf";
import { buildFrontendUrl } from "../../core/services/urlHelper";
import { QuotationData } from "../../types/pdfTypes";
import { sendMail } from "../../core/services/mailer";
import { ENV } from "../../config/env";
import { quotationEmailTemplate } from "./templates/quotationEmail";
import { User } from "../../models/userModel";
import { StudioModel } from "../../models/studioModel";
import Client from "../../models/clientModel";
import { Project } from "../../models/projectModel";
import { TemplateModel } from "../../models/templateModel";
import axios from "axios";

// Tracks in-progress PDF generations. Prevents duplicate work and lets status checks
// know a generation is underway without hitting the DB.
const generatingPdfs = new Map<string, Promise<string>>();

const normalizeAbsolutePdfUrl = (value: unknown): string => {
    const normalized = typeof value === "string" ? value.trim() : "";
    if (!normalized) return "";

    if (/^https?:\/\//i.test(normalized)) {
        return normalized;
    }

    if (/^[^\s/]+\.[^\s/]+\/.+/.test(normalized)) {
        return `https://${normalized}`;
    }

    return "";
};

const normalizePortfolioImages = (images: unknown, variantMap: any = {}) => {
    const source = Array.isArray(images) ? images : [];
    const map = variantMap && typeof variantMap === 'object' ? variantMap : {};
    return Array.from(new Set(source.map((url) => map[url] || url).filter(Boolean)));
};

export const saveQuotationDraft = async (req: AuthRequest, res: Response) => {
    try {
        const quotationData: CreateQuotationRequest = req.body;
        console.log("saveQuotationDraft receive:", {
            itemsCount: Array.isArray(quotationData.items) ? quotationData.items.length : 0,
            paymentMilestonesCount: Array.isArray(quotationData.paymentMilestones) ? quotationData.paymentMilestones.length : 0,
            deliverablesCount: Array.isArray(quotationData.deliverables) ? quotationData.deliverables.length : 0,
            complimentaryCount: Array.isArray(quotationData.complimentary) ? quotationData.complimentary.length : 0
        });

        if (!quotationData.leadId) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: [{ field: "leadId", message: "Lead ID is required" }]
            });
        }

        if (!quotationData.items || quotationData.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: [{ field: "items", message: "At least one item is required" }]
            });
        }

        // Fetch template to freeze background, welcomeMessage, serviceColumns, and fields
        let backgroundData = quotationData.background;
        let quotationBackgroundData = quotationData.quotationBackground;
        let welcomeMessageData = quotationData.welcomeMessage;
        let serviceColumnsData = quotationData.serviceColumns;
        let fieldsData = quotationData.fields;

        if (quotationData.templateId) {
            const template = await TemplateModel.findById(quotationData.templateId).lean() as any;
            if (template) {
                if (!backgroundData || Object.keys(backgroundData).length === 0) {
                    backgroundData = template.background;
                }
                if (!quotationBackgroundData || Object.keys(quotationBackgroundData).length === 0) {
                    quotationBackgroundData = template.quotationBackground;
                }
                if (!welcomeMessageData) {
                    welcomeMessageData = template.welcomeMessage;
                }
                if (!serviceColumnsData || Object.keys(serviceColumnsData).length === 0) {
                    serviceColumnsData = template.serviceColumns;
                }
                if (!fieldsData || Object.keys(fieldsData).length === 0) {
                    fieldsData = template.fields;
                }
                // Merge template customization with incoming customization to preserve user selections.
                quotationData.customization = {
                    ...(template.customization || {}),
                    ...(quotationData.customization || {})
                } as any;

                // Preserve template portfolio images when client sends partial customization payloads.
                if (!Array.isArray((quotationData.customization as any).portfolioImages)) {
                    (quotationData.customization as any).portfolioImages = Array.isArray((template.customization as any)?.portfolioImages)
                        ? (template.customization as any).portfolioImages
                        : [];
                }
            }
        }

        const newQuotation = new QuotationModel({
            ...quotationData,
            background: backgroundData,
            quotationBackground: quotationBackgroundData,
            welcomeMessage: welcomeMessageData,
            serviceColumns: serviceColumnsData,
            fields: fieldsData,
            customization: quotationData.customization,
            userId: req.user!._id,
            status: 'draft',
            quotationNumber: `Q${Date.now()}`,
            validUntil: quotationData.dueDate || quotationData.validUntil // Sync validUntil with dueDate
        });

        await newQuotation.save();

        // Generate PDF immediately on save
        let pdfUrl = '';
        try {
            console.time('[PDF][saveQuotationDraft] total');
            const [populatedQuotation, user] = await Promise.all([
                QuotationModel.findById(newQuotation._id)
                    .populate('leadId')
                    .populate('templateId')
                    .lean() as any,
                User.findById(req.user!._id).select('refNo phone email').lean() as any
            ]);

            if (populatedQuotation) {
                let studioInfo = populatedQuotation.studio || {};

                if (user?.refNo) {
                    const studio = await StudioModel.findOne({ refNo: user.refNo }).lean();
                    if (studio) {
                        studioInfo = {
                            ...studioInfo,
                            name: studio.name || studioInfo.name,
                            logo: studio.logo || studioInfo.logo,
                            tagline: studio.tagline || studioInfo.tagline,
                            phone: user?.phone || studioInfo.phone,
                            email: user?.email || studioInfo.email,
                            address: studio.mainAddress ? `${studio.mainAddress.addressLine1}${studio.mainAddress.addressLine2 ? ', ' + studio.mainAddress.addressLine2 : ''}, ${studio.mainAddress.city}, ${studio.mainAddress.state}, ${studio.mainAddress.country}` : studioInfo.address,
                            gstNumber: (studio as any).gstNumber || studioInfo.gstNumber
                        };
                    }
                }

                const quotationForPdf = {
                    ...populatedQuotation,
                    studio: studioInfo,
                    fields: populatedQuotation.templateId?.fields || {},
                    template: populatedQuotation.templateId || {}
                };
                console.time('[PDF][saveQuotationDraft] generateQuotationPDFFromPreview');
                pdfUrl = await generateQuotationPDFFromPreview(quotationForPdf);
                console.timeEnd('[PDF][saveQuotationDraft] generateQuotationPDFFromPreview');
                await QuotationModel.findByIdAndUpdate(newQuotation._id, { pdfUrl, isPdfOutdated: false });
            }
            console.timeEnd('[PDF][saveQuotationDraft] total');
        } catch (pdfErr) {
            console.error("Error generating PDF on save:", pdfErr);
            // Don't fail the whole request if PDF generation fails
        }

        // Convert to plain object to prevent circular JSON errors
        const savedQuotation = newQuotation.toObject();

        res.status(201).json({
            success: true,
            message: "Quotation draft saved successfully",
            data: {
                quotationId: savedQuotation._id,
                quotationNumber: savedQuotation.quotationNumber,
                status: savedQuotation.status,
                itemsCount: Array.isArray(savedQuotation.items) ? savedQuotation.items.length : 0,
                paymentMilestonesCount: Array.isArray(savedQuotation.paymentMilestones) ? savedQuotation.paymentMilestones.length : 0,
                pdfUrl: pdfUrl || savedQuotation.pdfUrl,
                createdAt: savedQuotation.createdAt,
                updatedAt: savedQuotation.updatedAt
            }
        });
    } catch (err: any) {
        console.error("Error in saveQuotationDraft:", err);
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Quotation number already exists"
            });
        }
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Get Quotation by ID
export const getQuotationById = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };

        if (!mongoose.Types.ObjectId.isValid(quotationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }

        // Check if this is a public request (no user authentication)
        const isPublic = !req.user;

        const query: any = {
            _id: quotationId,
            isDeleted: false
        };

        // Only filter by userId if authenticated
        if (!isPublic) {
            query.userId = req.user!._id;
        }

        const quotation = await QuotationModel.findOne(query)
            .populate('leadId')
            .populate('templateId')
            .lean() as any;

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        // Fetch user to get refNo and contact info
        const user = await User.findById(req.user?._id || quotation.userId).select('refNo phone email').lean() as any;
        let studioInfo = quotation.studio || {};
        let portfolioVariants: any = {};

        if (user?.refNo) {
            const studio = await StudioModel.findOne({ refNo: user.refNo }).lean();
            if (studio) {
                portfolioVariants = (studio as any).quotationBackgroundPortfolioVariants || {};
                studioInfo = {
                    ...studioInfo,
                    name: studio.name || studioInfo.name,
                    logo: studio.logo || studioInfo.logo,
                    tagline: studio.tagline || studioInfo.tagline,
                    phone: user?.phone || studioInfo.phone,
                    email: user?.email || studioInfo.email,
                    address: studio.mainAddress ? `${studio.mainAddress.addressLine1}${studio.mainAddress.addressLine2 ? ', ' + studio.mainAddress.addressLine2 : ''}, ${studio.mainAddress.city}, ${studio.mainAddress.state}, ${studio.mainAddress.country}` : studioInfo.address,
                    gstNumber: (studio as any).gstNumber || studioInfo.gstNumber
                };
            }
        }

        const normalizedCustomization = {
            ...(quotation.templateId?.customization || {}),
            ...(quotation.customization || {}),
            portfolioImages: normalizePortfolioImages(
                (quotation.customization || quotation.templateId?.customization || {}).portfolioImages,
                portfolioVariants
            ),
        };

        res.status(200).json({
            success: true,
            data: {
                quotationId: quotation._id,
                templateId: quotation.templateId?._id || quotation.templateId,
                status: quotation.status,
                leadId: quotation.leadId?._id || quotation.leadId,
                quotationDate: quotation.quotationDate,
                dueDate: quotation.dueDate,
                studio: studioInfo,
                client: quotation.client && typeof quotation.client === 'object' && Object.keys(quotation.client).length > 0
                    ? quotation.client
                    : (quotation.leadId && typeof quotation.leadId === 'object' ? {
                        name: quotation.leadId.name,
                        email: quotation.leadId.email,
                        phone: quotation.leadId.contactNumber || quotation.leadId.whatsappNumber,
                        address: quotation.leadId.Location
                    } : {}),
                event: quotation.event,
                welcomeMessage: quotation.welcomeMessage,
                background: quotation.background || quotation.templateId?.background,
                quotationBackground: quotation.quotationBackground || quotation.templateId?.quotationBackground,
                serviceColumns: quotation.serviceColumns || quotation.templateId?.serviceColumns,
                fields: (quotation.fields && Object.keys(quotation.fields).length > 0) ? quotation.fields : (quotation.templateId?.fields || {}),
                taxRate: quotation.taxRate,
                discount: quotation.discount,
                items: quotation.items,
                deliverables: quotation.deliverables,
                complimentary: quotation.complimentary,
                paymentMilestones: quotation.paymentMilestones,
                paymentMethods: quotation.paymentMethods,
                notes: quotation.notes,
                termsAndConditions: quotation.termsAndConditions,
                customization: normalizedCustomization,
                subtotal: quotation.subtotal,
                taxAmount: quotation.taxAmount,
                discountAmount: quotation.discountAmount,
                grandTotal: quotation.grandTotal,
                createdAt: quotation.createdAt,
                updatedAt: quotation.updatedAt,
                sentAt: quotation.sentAt,
                viewedAt: quotation.viewedAt,
                acceptedAt: quotation.acceptedAt,
                rejectedAt: quotation.rejectedAt,
                selectedPaymentMethod: quotation.selectedPaymentMethod,
                quotationNumber: quotation.quotationNumber,
                isPdfOutdated: quotation.isPdfOutdated
            }
        });
    } catch (err: any) {
        console.error("Error in getQuotationById:", err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Get All Quotations for a Lead
export const getQuotationsByLead = async (req: AuthRequest, res: Response) => {
    try {
        const { leadId } = req.params as { leadId: string };
        const { status, limit = 10, page = 1 } = req.query as unknown as PaginationQuery;

        if (!mongoose.Types.ObjectId.isValid(leadId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid lead ID"
            });
        }

        const query: any = {
            leadId: leadId,
            userId: req.user!._id,
            isDeleted: false
        };

        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [quotations, total] = await Promise.all([
            QuotationModel.find(query)
                .select('status grandTotal createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            QuotationModel.countDocuments(query)
        ]);

        const formattedQuotations = quotations.map((q: any) => ({
            quotationId: q._id,
            status: q.status,
            grandTotal: q.grandTotal,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
            isPdfOutdated: q.isPdfOutdated
        }));

        res.status(200).json({
            success: true,
            data: {
                quotations: formattedQuotations,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// Patch Quotation Due Date (lightweight — no PDF regen)
export const updateQuotationDueDate = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };
        const { dueDate } = req.body;

        if (!mongoose.Types.ObjectId.isValid(quotationId)) {
            return res.status(400).json({ success: false, message: "Invalid quotation ID" });
        }

        if (!dueDate) {
            return res.status(400).json({ success: false, message: "dueDate is required" });
        }

        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format" });
        }

        const quotation = await QuotationModel.findOneAndUpdate(
            { _id: quotationId, userId: req.user!._id, isDeleted: false },
            { $set: { dueDate: parsedDate, validUntil: parsedDate } },
            { new: true }
        );

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Quotation validity date updated successfully",
            data: {
                quotationId: quotation._id,
                dueDate: quotation.dueDate,
                validUntil: (quotation as any).validUntil,
            }
        });
    } catch (err: any) {
        console.error("Error updating quotation due date:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Update Quotation
export const updateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };
        const updateData: UpdateQuotationRequest = req.body;
        console.log("updateQuotation receive:", {
            quotationId,
            itemsCount: Array.isArray(updateData.items) ? updateData.items.length : undefined,
            paymentMilestonesCount: Array.isArray(updateData.paymentMilestones) ? updateData.paymentMilestones.length : undefined,
            deliverablesCount: Array.isArray(updateData.deliverables) ? updateData.deliverables.length : undefined,
            complimentaryCount: Array.isArray(updateData.complimentary) ? updateData.complimentary.length : undefined
        });

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

        // Prevent editing accepted quotations
        if (quotation.status === 'accepted') {
            return res.status(403).json({
                success: false,
                message: "Cannot edit an accepted quotation"
            });
        }

        // Fetch template to freeze background, welcomeMessage, serviceColumns and fields if template changed or if they are missing
        let backgroundData = updateData.background;
        let quotationBackgroundData = updateData.quotationBackground;
        let welcomeMessageData = updateData.welcomeMessage;
        let serviceColumnsData = updateData.serviceColumns;
        let fieldsData = updateData.fields;

        if (updateData.templateId) {
            const template = await TemplateModel.findById(updateData.templateId).lean() as any;
            if (template) {
                const templateChanged = updateData.templateId !== quotation.templateId?.toString();
                if (!backgroundData || Object.keys(backgroundData).length === 0 || templateChanged) {
                    backgroundData = template.background;
                }
                if (!quotationBackgroundData || Object.keys(quotationBackgroundData).length === 0 || templateChanged) {
                    quotationBackgroundData = template.quotationBackground;
                }
                if (!welcomeMessageData || templateChanged) {
                    welcomeMessageData = template.welcomeMessage;
                }
                if (!serviceColumnsData || Object.keys(serviceColumnsData).length === 0 || templateChanged) {
                    serviceColumnsData = template.serviceColumns;
                }
                if (!fieldsData || Object.keys(fieldsData).length === 0 || templateChanged) {
                    fieldsData = template.fields;
                }
                updateData.customization = {
                    ...(templateChanged ? (template.customization || {}) : (quotation.customization || {})),
                    ...(updateData.customization || {})
                } as any;

                // Preserve existing/template portfolio images when patch payload omits them.
                if (!Array.isArray((updateData.customization as any).portfolioImages)) {
                    (updateData.customization as any).portfolioImages = templateChanged
                        ? (Array.isArray((template.customization as any)?.portfolioImages) ? (template.customization as any).portfolioImages : [])
                        : (Array.isArray((quotation.customization as any)?.portfolioImages) ? (quotation.customization as any).portfolioImages : []);
                }
            }
            updateData.background = backgroundData;
            updateData.quotationBackground = quotationBackgroundData;
            updateData.welcomeMessage = welcomeMessageData;
            updateData.serviceColumns = serviceColumnsData;
            updateData.fields = fieldsData;
        } else if (updateData.customization) {
            updateData.customization = {
                ...(quotation.customization || {}),
                ...(updateData.customization || {})
            } as any;

            if (!Array.isArray((updateData.customization as any).portfolioImages)) {
                (updateData.customization as any).portfolioImages = Array.isArray((quotation.customization as any)?.portfolioImages)
                    ? (quotation.customization as any).portfolioImages
                    : [];
            }
        }

        // Update fields explicitly if provided to ensure Mongoose tracks nested changes
        if (updateData.deliverables) {
            quotation.deliverables = updateData.deliverables as any;
            delete updateData.deliverables;
        }
        if (updateData.complimentary) {
            quotation.complimentary = updateData.complimentary as any;
            delete updateData.complimentary;
        }
        if (updateData.items && Array.isArray(updateData.items)) {
            quotation.items = updateData.items as any;
            delete updateData.items;
        }
        if (updateData.customization) {
            quotation.customization = updateData.customization as any;
            delete updateData.customization;
        }

        if (updateData.dueDate) {
            updateData.validUntil = updateData.dueDate;
        }

        Object.assign(quotation, updateData);
        // Invalidate cached PDF — content changed, next export will regenerate.
        quotation.isPdfOutdated = true;
        await quotation.save();

        // Keep draft saves fast: PDF is generated in explicit export/download/send flows.
        const pdfUrl = quotation.pdfUrl;

        // Convert to plain object to prevent circular JSON errors
        const updatedQuotation = quotation.toObject();

        res.status(200).json({
            success: true,
            message: "Quotation updated successfully",
            data: {
                quotationId: updatedQuotation._id,
                status: updatedQuotation.status,
                itemsCount: Array.isArray(updatedQuotation.items) ? updatedQuotation.items.length : 0,
                paymentMilestonesCount: Array.isArray(updatedQuotation.paymentMilestones) ? updatedQuotation.paymentMilestones.length : 0,
                pdfUrl: pdfUrl || updatedQuotation.pdfUrl,
                updatedAt: updatedQuotation.updatedAt
            }
        });
    } catch (err: any) {
        console.error("Error in updateQuotation:", err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

async function buildQuotationForPdf(quotationId: string, userId: string): Promise<{ quotationForPdf: any } | null> {
    const [populatedQuotation, user] = await Promise.all([
        QuotationModel.findOne({ _id: quotationId, userId, isDeleted: false })
            .populate('leadId')
            .populate('templateId')
            .lean() as any,
        User.findById(userId).select('refNo phone email').lean() as any,
    ]);

    if (!populatedQuotation) return null;

    let studioInfo = populatedQuotation.studio || {};
    let portfolioVariants: any = {};

    if (user?.refNo) {
        const studio = await StudioModel.findOne({ refNo: user.refNo }).lean();
        if (studio) {
            portfolioVariants = (studio as any).quotationBackgroundPortfolioVariants || {};
            studioInfo = {
                ...studioInfo,
                name: studio.name || studioInfo.name,
                logo: studio.logo || studioInfo.logo,
                tagline: studio.tagline || studioInfo.tagline,
                phone: user?.phone || studioInfo.phone,
                email: user?.email || studioInfo.email,
                address: studio.mainAddress
                    ? `${studio.mainAddress.addressLine1}${studio.mainAddress.addressLine2 ? ', ' + studio.mainAddress.addressLine2 : ''}, ${studio.mainAddress.city}, ${studio.mainAddress.state}, ${studio.mainAddress.country}`
                    : studioInfo.address,
                gstNumber: (studio as any).gstNumber || studioInfo.gstNumber,
            };
        }
    }

    const quotationForPdf = {
        ...populatedQuotation,
        customization: {
            ...(populatedQuotation.templateId?.customization || {}),
            ...(populatedQuotation.customization || {}),
            portfolioImages: normalizePortfolioImages(
                (populatedQuotation.customization || populatedQuotation.templateId?.customization || {}).portfolioImages,
                portfolioVariants
            ),
        },
        studio: studioInfo,
        fields: populatedQuotation.templateId?.fields || {},
        template: populatedQuotation.templateId || {},
    };

    return { quotationForPdf };
}

export const exportQuotationToPdf = async (req: AuthRequest, res: Response) => {
    const { quotationId } = req.params as { quotationId: string };
    const forceRegenerate = req.query.force === 'true' || req.query.force === '1';

    if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }

    try {
        // Fast path: serve from cache without touching user/studio collections.
        if (!forceRegenerate) {
            const cached = await QuotationModel.findOne(
                { _id: quotationId, userId: req.user!._id, isDeleted: false },
                { pdfUrl: 1, isPdfOutdated: 1 }
            ).lean() as any;

            if (!cached) {
                return res.status(404).json({ success: false, message: "Quotation not found" });
            }

            const cachedPdfUrl = normalizeAbsolutePdfUrl(cached.pdfUrl);
            if (cachedPdfUrl && !cached.isPdfOutdated) {
                return res.status(200).json({ success: true, data: { pdfUrl: cachedPdfUrl } });
            }
        }

        // If a generation is already running for this quotation, tell the client to poll.
        if (generatingPdfs.has(quotationId)) {
            return res.status(202).json({ success: true, data: { status: 'generating' } });
        }

        // Start background generation. Client will poll /pdf-status for the result.
        const generationPromise = (async () => {
            try {
                const built = await buildQuotationForPdf(quotationId, String(req.user!._id));
                if (!built) throw new Error('Quotation not found during background build');
                const pdfUrl = await generateQuotationPDFFromPreview(built.quotationForPdf);
                await QuotationModel.findByIdAndUpdate(quotationId, { pdfUrl, isPdfOutdated: false });
                console.log(`[PDF][exportQuotationToPdf][${quotationId}] background generation complete`);
                return pdfUrl;
            } finally {
                generatingPdfs.delete(quotationId);
            }
        })();

        generatingPdfs.set(quotationId, generationPromise);

        return res.status(202).json({ success: true, data: { status: 'generating' } });
    } catch (err: any) {
        generatingPdfs.delete(quotationId);
        console.error("Error in exportQuotationToPdf:", err);
        return res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};

export const getPdfStatus = async (req: AuthRequest, res: Response) => {
    const { quotationId } = req.params as { quotationId: string };

    if (!mongoose.Types.ObjectId.isValid(quotationId)) {
        return res.status(400).json({ success: false, message: "Invalid quotation ID" });
    }

    try {
        if (generatingPdfs.has(quotationId)) {
            return res.status(200).json({ success: true, data: { status: 'generating' } });
        }

        const quotation = await QuotationModel.findOne(
            { _id: quotationId, userId: req.user!._id, isDeleted: false },
            { pdfUrl: 1, isPdfOutdated: 1 }
        ).lean() as any;

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        const pdfUrl = normalizeAbsolutePdfUrl(quotation.pdfUrl);
        if (pdfUrl && !quotation.isPdfOutdated) {
            return res.status(200).json({ success: true, data: { status: 'ready', pdfUrl } });
        }

        return res.status(200).json({ success: true, data: { status: 'generating' } });
    } catch (err: any) {
        console.error("Error in getPdfStatus:", err);
        return res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};

export const downloadQuotationPdf = async (req: Request, res: Response) => {
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
            isDeleted: false
        })
            .populate('leadId')
            .populate('templateId')
            .lean() as any;

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        // Serve cached URL instantly if up to date
        const cachedUrl = normalizeAbsolutePdfUrl(quotation.pdfUrl);
        if (cachedUrl && !quotation.isPdfOutdated) {
            return res.redirect(cachedUrl);
        }

        const quotationForPdf = {
            ...quotation,
            fields: quotation.templateId?.fields || {},
            template: quotation.templateId || {}
        };

        const freshPdfUrl = await generateQuotationPDFFromPreview(quotationForPdf);
        await QuotationModel.findByIdAndUpdate(quotationId, { pdfUrl: freshPdfUrl });

        res.redirect(freshPdfUrl);

    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

export const sendQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };

        if (!mongoose.Types.ObjectId.isValid(quotationId)) {
            return res.status(400).json({ success: false, message: "Invalid quotation ID" });
        }

        // Fetch quotation + user in parallel
        const [quotation, user] = await Promise.all([
            QuotationModel.findOne({
                _id: quotationId,
                userId: req.user!._id,
                isDeleted: false
            }).populate('leadId', '_id name email contactNumber whatsappNumber EventType EventDate Location').lean(),
            User.findById(req.user!._id).select('refNo firstName lastName email').lean()
        ]);

        if (!quotation) return res.status(404).json({ success: false, message: "Quotation not found" });
        if (!user || !user.refNo) return res.status(404).json({ success: false, message: "User or studio reference not found" });

        const lead = quotation.leadId as any;
        if (!lead) return res.status(404).json({ success: false, message: "Associated lead not found" });

        const recipientEmail = req.body?.recipientEmail || lead?.email;
        const recipientName = req.body?.recipientName || lead?.name;

        if (!recipientEmail) return res.status(400).json({ success: false, message: "Recipient email is required" });

        const studio = await StudioModel.findOne({ refNo: user.refNo }).lean();
        if (!studio) return res.status(404).json({ success: false, message: "Studio not found" });

        // Prepare all email content synchronously before responding
        const baseUrl = buildFrontendUrl(req);
        const acceptUrl = `${baseUrl}/confirm-quotation/${lead._id}/quotation?id=${quotationId}&status=accepted`;
        const declineUrl = `${baseUrl}/confirm-quotation/${lead._id}/quotation?id=${quotationId}&status=rejected`;

        const quotationNumber = (quotation as any).quotationNumber || quotationId.toString().slice(-8).toUpperCase();
        const quotationEmailData = {
            quotationNumber,
            quotationDate: (quotation as any).quotationDate,
            validUntil: ((quotation as any).validUntil || (quotation as any).dueDate) as Date,
            grandTotal: (quotation as any).grandTotal,
            items: ((quotation as any).items || []).map((item: any) => {
                let description = item.event || item.description || 'Service';
                if (item.packages && item.packages.length > 0) {
                    description += ` (Packages: ${item.packages.map((p: any) => p.name).join(', ')})`;
                }
                return { description, quantity: item.quantity || 1, rate: item.rate || item.amount || 0, total: item.total || item.amount || 0 };
            }),
            paymentMilestones: ((quotation as any).paymentMilestones || []).map((m: any) => ({
                description: m.description, dueDate: m.dueDate, amount: m.amount
            }))
        };
        const studioEmailData = {
            name: studio.name,
            tagline: studio.tagline || undefined,
            logo: studio.logo || undefined,
            mainAddress: studio.mainAddress
                ? { addressLine1: studio.mainAddress.addressLine1, addressLine2: studio.mainAddress.addressLine2, city: studio.mainAddress.city, state: studio.mainAddress.state, country: studio.mainAddress.country }
                : { addressLine1: '', city: '', state: '', country: '' },
            accentColor: (studio as any).accentColor || '#8B5CF6'
        };
        const emailContent = quotationEmailTemplate(
            quotationEmailData,
            studioEmailData,
            { name: recipientName || lead?.name || 'Client', email: recipientEmail },
            acceptUrl,
            declineUrl
        );
        const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
        const emailSubject = req.body?.subject || emailContent.subject;
        const emailMessage = req.body?.message || `Hello ${recipientName || 'Client'},\n\nYour quotation from ${studio.name} is ready for review.\n\nTotal Amount: INR ${formatINR((quotation as any).grandTotal)}\n\nPlease review and respond using the buttons in the email.\n\nThank you!\n\n${studio.name}`;
        const emailHtml = emailContent.html;

        // Update lead + quotation status synchronously, then respond immediately
        const [count] = await Promise.all([
            QuotationModel.countDocuments({ userId: req.user!._id, leadId: lead._id }),
        ]);
        await Promise.all([
            LeadModel.findByIdAndUpdate(lead._id, { status: count === 0 ? 'Proposal' : 'Negotiation' }),
            QuotationModel.findByIdAndUpdate(quotationId, { status: 'sent', sentAt: new Date(), emailStatus: 'pending', emailFailReason: null })
        ]);

        // Respond immediately — PDF + SMTP run in background
        res.status(200).json({
            success: true,
            message: "Quotation sent successfully",
            data: { sentTo: recipientEmail, quotationNumber }
        });

        // Background: resolve PDF buffer then send mail
        (async () => {
            try {
                const existingPdfUrl = normalizeAbsolutePdfUrl((quotation as any).pdfUrl);
                let pdfBuffer: Buffer | null = null;
                let pdfUrl = existingPdfUrl;

                if (existingPdfUrl && !(quotation as any).isPdfOutdated) {
                    pdfBuffer = await axios.get(existingPdfUrl, { responseType: 'arraybuffer' })
                        .then(r => Buffer.from(r.data)).catch(() => null);
                }

                if (!pdfBuffer) {
                    const populatedQuotation = await QuotationModel.findById(quotationId)
                        .populate('leadId').populate('templateId').lean() as any;
                    const quotationForPdf = { ...populatedQuotation, fields: populatedQuotation.templateId?.fields || {} };
                    const { generateQuotationHTMLFromPreview, convertHtmlToPdf, compressPdfIfNeeded } = await import('../../core/services/pdf');
                    const html = await generateQuotationHTMLFromPreview(quotationForPdf);
                    const rawBuffer = await convertHtmlToPdf(html, { waitDelayMs: 0 });
                    pdfBuffer = await compressPdfIfNeeded(rawBuffer);

                    if (!pdfUrl) {
                        const { uploadPdfToDigitalOcean } = await import('../../core/services/upload');
                        pdfUrl = await uploadPdfToDigitalOcean(pdfBuffer, quotationForPdf.client?.name || quotationForPdf.studio?.name || 'quotation', 'quotation');
                        await QuotationModel.findByIdAndUpdate(quotationId, { pdfUrl, isPdfOutdated: false });
                    }
                }

                const attachments: any[] = pdfBuffer
                    ? [{ filename: `Quotation-${quotationNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
                    : [];

                await sendMail(recipientEmail, emailSubject, emailMessage, emailHtml, attachments);
                await QuotationModel.findByIdAndUpdate(quotationId, { emailStatus: 'sent' });
            } catch (bgErr: any) {
                const reason = bgErr?.responseCode
                    ? `SMTP ${bgErr.responseCode}: ${bgErr.response || bgErr.message}`
                    : (bgErr?.message || 'Unknown error');
                console.error('[sendQuotation] background send failed:', reason);
                await QuotationModel.findByIdAndUpdate(quotationId, { emailStatus: 'failed', emailFailReason: reason });
            }
        })();

    } catch (err: any) {
        console.error('Error sending quotation:', err);
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};

export const deleteQuotation = async (req: AuthRequest, res: Response) => {
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

        if (quotation.status === 'accepted') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete quotation with status 'accepted'"
            });
        }

        quotation.isDeleted = true;
        quotation.deletedAt = new Date();
        await quotation.save();

        res.status(200).json({
            success: true,
            message: "Quotation deleted successfully"
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

export const setQuotationSeen = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }
        await QuotationModel.findOneAndUpdate({
            _id: id,
            isDeleted: false
        }, {
            viewedAt: new Date(),
            status: 'viewed'
        }, { new: true }).lean();

        res.status(200).json({
            success: true,
            message: "Quotation marked as seen"
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

export const setQuotationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { status, paymentMethod } = req.query;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid quotation ID"
            });
        }
        if (!['accepted', 'rejected'].includes(status as string)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const updateObj: any = {
            status: status,
            acceptedAt: status === 'accepted' ? new Date() : undefined,
            isContract: status === 'accepted' ? true : false,
            rejectedAt: status === 'rejected' ? new Date() : undefined
        };
        if (status === 'accepted' && paymentMethod) {
            updateObj.selectedPaymentMethod = paymentMethod;
        }

        const Quote = await QuotationModel.findOne({ _id: id, isDeleted: false });
        if (!Quote) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found"
            });
        }

        /*
        if (Quote.status === 'accepted' || Quote.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: "Cannot change status of a finalized quotation"
            });
        }
        */

        await QuotationModel.findOneAndUpdate({
            _id: id,
            isDeleted: false
        }, updateObj, { new: true }).lean();


        if (Quote.leadId) {
            const lead = await LeadModel.findById(Quote.leadId);
            if (lead) {
                // Update lead status
                lead.status = (status === 'accepted') ? 'Confirmed' : 'Rejected';

                // Update lead's budget by replacing it with quotation amount when accepted
                if (status === 'accepted') {
                    const quotationAmount = parseFloat(Quote.grandTotal?.toString() || '0');

                    lead.budget = quotationAmount.toString();
                    lead.additionalBudget = quotationAmount.toString();
                }

                await lead.save();


                // Auto-add client if accepted
                if (status === 'accepted') {
                    const existingClient = await Client.findOne({
                        email: lead.email,
                        userRef: Quote.userId
                    });

                    if (!existingClient) {
                        const newClient = new Client({
                            clientName: lead.name || 'Unnamed Client',
                            email: lead.email || '',
                            phone: lead.contactNumber || lead.whatsappNumber || '',
                            userRef: Quote.userId,
                            status: 'Ongoing'
                        });
                        await newClient.save();
                    }

                    // Update project's additionalBudget when quotation is accepted
                    const quotationAmount = parseFloat(Quote.grandTotal?.toString() || '0');

                    // Find projects linked to this quotation
                    const linkedProjects = await Project.find({
                        sourceQuotationId: id,
                        createdBy: Quote.userId
                    });



                    // Update each linked project's budget & additionalBudget
                    for (const project of linkedProjects) {
                        project.budget = quotationAmount.toString();
                        project.additionalBudget = quotationAmount.toString();
                        await project.save();
                    }
                }
            }
        }
        res.status(200).json({
            success: true,
            message: `Quotation marked as ${status}`
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

export const autoSaveQuotationDraft = async (req: AuthRequest, res: Response) => {
    try {
        const quotationData: CreateQuotationRequest = req.body;
        
        if (!quotationData.leadId) {
            return res.status(400).json({ success: false, message: "Validation error", errors: [{ field: "leadId", message: "Lead ID is required" }] });
        }
        if (!quotationData.items || quotationData.items.length === 0) {
            return res.status(400).json({ success: false, message: "Validation error", errors: [{ field: "items", message: "At least one item is required" }] });
        }

        let backgroundData = quotationData.background;
        let quotationBackgroundData = quotationData.quotationBackground;
        let welcomeMessageData = quotationData.welcomeMessage;
        let serviceColumnsData = quotationData.serviceColumns;
        let fieldsData = quotationData.fields;

        if (quotationData.templateId) {
            const template = await TemplateModel.findById(quotationData.templateId).lean() as any;
            if (template) {
                if (!backgroundData || Object.keys(backgroundData).length === 0) backgroundData = template.background;
                if (!quotationBackgroundData || Object.keys(quotationBackgroundData).length === 0) quotationBackgroundData = template.quotationBackground;
                if (!welcomeMessageData) welcomeMessageData = template.welcomeMessage;
                if (!serviceColumnsData || Object.keys(serviceColumnsData).length === 0) serviceColumnsData = template.serviceColumns;
                if (!fieldsData || Object.keys(fieldsData).length === 0) fieldsData = template.fields;
                if (!quotationData.customization || Object.keys(quotationData.customization).length <= 1) {
                    quotationData.customization = template.customization as any;
                }
            }
        }

        const newQuotation = new QuotationModel({
            ...quotationData,
            background: backgroundData,
            quotationBackground: quotationBackgroundData,
            welcomeMessage: welcomeMessageData,
            serviceColumns: serviceColumnsData,
            fields: fieldsData,
            userId: req.user!._id,
            status: 'draft',
            quotationNumber: `Q${Date.now()}`,
            validUntil: quotationData.dueDate || quotationData.validUntil,
            isPdfOutdated: true
        });

        await newQuotation.save();
        const savedQuotation = newQuotation.toObject();

        res.status(201).json({
            success: true,
            message: "Quotation draft auto-saved successfully",
            data: {
                quotationId: savedQuotation._id,
                quotationNumber: savedQuotation.quotationNumber,
                status: savedQuotation.status,
                itemsCount: Array.isArray(savedQuotation.items) ? savedQuotation.items.length : 0,
                paymentMilestonesCount: Array.isArray(savedQuotation.paymentMilestones) ? savedQuotation.paymentMilestones.length : 0,
                createdAt: savedQuotation.createdAt,
                updatedAt: savedQuotation.updatedAt
            }
        });
    } catch (err: any) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: "Quotation number already exists" });
        }
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};

export const autoUpdateQuotation = async (req: AuthRequest, res: Response) => {
    try {
        const { quotationId } = req.params as { quotationId: string };
        const updateData: UpdateQuotationRequest = req.body;

        if (!mongoose.Types.ObjectId.isValid(quotationId)) {
            return res.status(400).json({ success: false, message: "Invalid quotation ID" });
        }

        const quotation = await QuotationModel.findOne({
            _id: quotationId,
            userId: req.user!._id,
            isDeleted: false
        });

        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }

        if (quotation.status === 'accepted') {
            return res.status(403).json({ success: false, message: "Cannot edit an accepted quotation" });
        }

        let backgroundData = updateData.background;
        let quotationBackgroundData = updateData.quotationBackground;
        let welcomeMessageData = updateData.welcomeMessage;
        let serviceColumnsData = updateData.serviceColumns;
        let fieldsData = updateData.fields;

        if (updateData.templateId) {
             const template = await TemplateModel.findById(updateData.templateId).lean() as any;
             if (template) {
                 const templateChanged = updateData.templateId !== quotation.templateId?.toString();
                 if (!backgroundData || Object.keys(backgroundData).length === 0 || templateChanged) backgroundData = template.background;
                 if (!quotationBackgroundData || Object.keys(quotationBackgroundData).length === 0 || templateChanged) quotationBackgroundData = template.quotationBackground;
                 if (!welcomeMessageData || templateChanged) welcomeMessageData = template.welcomeMessage;
                 if (!serviceColumnsData || Object.keys(serviceColumnsData).length === 0 || templateChanged) serviceColumnsData = template.serviceColumns;
                 if (!fieldsData || Object.keys(fieldsData).length === 0 || templateChanged) fieldsData = template.fields;
                 if (!updateData.customization || Object.keys(updateData.customization).length <= 1 || templateChanged) {
                     updateData.customization = template.customization as any;
                 }
             }
             updateData.background = backgroundData;
             updateData.quotationBackground = quotationBackgroundData;
             updateData.welcomeMessage = welcomeMessageData;
             updateData.serviceColumns = serviceColumnsData;
             updateData.fields = fieldsData;
        }

        if (updateData.deliverables) {
            quotation.deliverables = updateData.deliverables as any;
            delete updateData.deliverables;
        }
        if (updateData.complimentary) {
            quotation.complimentary = updateData.complimentary as any;
            delete updateData.complimentary;
        }
        if (updateData.items && Array.isArray(updateData.items)) {
            quotation.items = updateData.items as any;
            delete updateData.items;
        }
        if (Array.isArray(updateData.paymentMilestones)) {
            quotation.paymentMilestones = updateData.paymentMilestones as any;
            delete updateData.paymentMilestones;
        }

        if (updateData.dueDate) {
            updateData.validUntil = updateData.dueDate;
        }

        Object.assign(quotation, updateData);
        (quotation as any).isPdfOutdated = true;

        await quotation.save();

        const updatedQuotation = quotation.toObject();

        res.status(200).json({
            success: true,
            message: "Quotation auto-updated successfully",
            data: {
                quotationId: updatedQuotation._id,
                status: updatedQuotation.status,
                itemsCount: Array.isArray(updatedQuotation.items) ? updatedQuotation.items.length : 0,
                paymentMilestonesCount: Array.isArray(updatedQuotation.paymentMilestones) ? updatedQuotation.paymentMilestones.length : 0,
                updatedAt: updatedQuotation.updatedAt
            }
        });
    } catch (err: any) {
        res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
    }
};
