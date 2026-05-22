import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { Project } from "../../models/projectModel";
import { User } from "../../models/userModel";
import { QuotationModel } from "../../models/quotationModel";
import { ContractModel } from "../../models/contractModel";
import { LeadModel } from "../../models/leadModel";

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

/**
 * @route GET /project/:projectId/quotation/pdf
 * @desc Get quotation PDF for a project
 */
export const getProjectQuotationPdf = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const log = (_msg: string) => { };

        log(`📄 [getProjectQuotationPdf] Fetching PDF for project: ${projectId}`);

        const project = await Project.findById(projectId).populate('sourceQuotationId');
        if (!project) {
            log(`❌ [getProjectQuotationPdf] Project not found: ${projectId}`);
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        log(`📄 [getProjectQuotationPdf] Project found: ${JSON.stringify({
            title: project.projectTitle,
            hasQuotationId: !!project.sourceQuotationId,
            quotationId: project.sourceQuotationId?._id || project.sourceQuotationId,
            sourceLeadId: project.sourceLeadId
        })}`);

        let quotation: any = project.sourceQuotationId;

        // Try to find quotation by ID directly if it's in the project but not populated correctly
        if (!quotation && project.sourceQuotationId) {
            log(`🔍 [getProjectQuotationPdf] sourceQuotationId present but not populated, fetching: ${project.sourceQuotationId}`);
            quotation = await QuotationModel.findById(project.sourceQuotationId).lean();
        }

        // AUTO-LINK FALLBACK: If sourceQuotationId is missing, try to find one from leadId or clientEmail
        if (!quotation || !quotation.pdfUrl) {
            log(`🔍 [getProjectQuotationPdf] quotation missing or no pdfUrl, searching by sourceLeadId/clientEmail`);

            let leadIds: any[] = [];
            if (project.sourceLeadId) {
                leadIds.push(project.sourceLeadId);
            } else if (project.clientEmail) {
                const leads = await LeadModel.find({ email: project.clientEmail }).select('_id');
                leadIds = leads.map(l => l._id);
            }

            if (leadIds.length > 0) {
                const fallbackQuotation = await QuotationModel.findOne({
                    leadId: { $in: leadIds },
                    status: 'accepted',
                    isDeleted: false
                }).sort({ updatedAt: -1 }).lean();

                if (fallbackQuotation) {
                    quotation = fallbackQuotation;
                    log(`✅ [getProjectQuotationPdf] Found matching quotation via lead/email: ${quotation._id}`);
                }
            }
        }

        const quotationPdfUrl = normalizeAbsolutePdfUrl(quotation?.pdfUrl);
        if (quotationPdfUrl) {
            log(`✅ [getProjectQuotationPdf] Redirecting to quotation PDF: ${quotationPdfUrl}`);
            return res.redirect(quotationPdfUrl);
        }

        log(`⚠️ [getProjectQuotationPdf] No quotation PDF found for project: ${projectId}`);
        return res.status(404).json({
            success: false,
            message: "Quotation PDF not available. Please ensure the quotation has been accepted."
        });
    } catch (err: any) {
        console.error('❌ [getProjectQuotationPdf] Error:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @route GET /project/:projectId/contract/pdf
 * @desc Get contract PDF for a project
 */
export const getProjectContractPdf = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const log = (_msg: string) => { };

        log(`📄 [getProjectContractPdf] Fetching PDF for project: ${projectId}`);

        // Populate both contract and lead data
        const project = await Project.findById(projectId)
            .populate({
                path: 'sourceContractId',
                populate: {
                    path: 'leadId',
                    select: 'name email contactNumber'
                }
            });

        if (!project) {
            log(`❌ [getProjectContractPdf] Project not found: ${projectId}`);
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        log(`📄 [getProjectContractPdf] Project found: ${JSON.stringify({
            title: project.projectTitle,
            hasContractId: !!project.sourceContractId,
            contractId: project.sourceContractId?._id || project.sourceContractId,
            contractUrl: project.contractUrl,
            sourceLeadId: project.sourceLeadId
        })}`);

        let contract: any = project.sourceContractId;

        // Try to find contract by ID directly if it's in the project but not populated correctly
        if (!contract && project.sourceContractId) {
            log(`🔍 [getProjectContractPdf] sourceContractId present but not populated, fetching: ${project.sourceContractId}`);
            contract = await ContractModel.findById(project.sourceContractId).lean();
        }

        // AUTO-LINK FALLBACK: If sourceContractId is missing, try to find one from leadId or clientEmail
        if (!contract || !contract.pdfUrl) {
            log(`🔍 [getProjectContractPdf] contract missing or no pdfUrl, searching by sourceLeadId/clientEmail`);

            let leadIds: any[] = [];
            if (project.sourceLeadId) {
                leadIds.push(project.sourceLeadId);
            }

            if (project.clientEmail) {
                const emailLeads = await LeadModel.find({
                    userRef: project.createdBy,
                    email: { $regex: new RegExp(`^${project.clientEmail}$`, 'i') }
                }).select('_id');
                const emailLeadIds = emailLeads.map(l => l._id);
                leadIds = [...new Set([...leadIds, ...emailLeadIds])];
            }

            if (project.clientPhone) {
                const cleanPhone = project.clientPhone.toString().replace(/\D/g, '');
                if (cleanPhone) {
                    const phoneLeads = await LeadModel.find({
                        userRef: project.createdBy,
                        $or: [
                            { contactNumber: { $regex: cleanPhone } },
                            { whatsappNumber: { $regex: cleanPhone } }
                        ]
                    }).select('_id');
                    const phoneLeadIds = phoneLeads.map(l => l._id);
                    leadIds = [...new Set([...leadIds, ...phoneLeadIds])];
                }
            }

            log(`🔍 [getProjectContractPdf] User: ${project.createdBy}, search leads: ${JSON.stringify(leadIds)}, email: "${project.clientEmail}", phone: "${project.clientPhone}"`);

            if (leadIds.length > 0 || project.clientEmail || project.clientPhone) {
                // Find all users in this studio to expand search
                let studioUserIds = [project.createdBy];
                try {
                    const creator = await User.findById(project.createdBy).select('refNo');
                    if (creator?.refNo) {
                        const studioUsers = await User.find({ refNo: creator.refNo }).select('_id');
                        studioUserIds = studioUsers.map((u: any) => u._id);
                    }
                } catch (e) {
                    log(`⚠️ [getProjectContractPdf] Error fetching studio users: ${e}`);
                }

                const query: any = { isDeleted: false, userId: { $in: studioUserIds } };
                const orConditions: any[] = [];

                if (leadIds.length > 0) {
                    orConditions.push({ leadId: { $in: leadIds } });
                }

                log(`🔍 [getProjectContractPdf] Found ${studioUserIds.length} studio users: ${studioUserIds.join(', ')}`);

                if (project.clientEmail) {
                    log(`🔍 [getProjectContractPdf] Adding email condition for: "${project.clientEmail}"`);
                    orConditions.push({ 'agreement.clientEmail': { $regex: new RegExp(`^${project.clientEmail}$`, 'i') } });
                }

                if (project.clientPhone) {
                    const cleanPhone = project.clientPhone.toString().replace(/\D/g, '');
                    if (cleanPhone) {
                        orConditions.push({ 'agreement.clientPhone': { $regex: cleanPhone } });
                    }
                }

                if (orConditions.length > 0) {
                    query.$or = orConditions;
                    // Ensure the contract has a PDF URL
                    query.pdfUrl = { $exists: true, $ne: null };

                    log(`🔍 [getProjectContractPdf] Running fallback query: ${JSON.stringify(query)}`);

                    const fallbackContract = await ContractModel.findOne(query).sort({ createdAt: -1 }).lean();

                    if (fallbackContract) {
                        contract = fallbackContract;
                        log(`✅ [getProjectContractPdf] Found matching contract with PDF for user ${project.createdBy} via ultra-expanded fallback: ${contract._id}`);
                    }
                }
            }
        }

        // Check if contract is populated or found
        const contractPdfUrl = normalizeAbsolutePdfUrl(contract?.pdfUrl);
        if (contractPdfUrl) {
            log(`✅ [getProjectContractPdf] Redirecting to contract PDF: ${contractPdfUrl}`);
            return res.redirect(contractPdfUrl);
        }

        const projectContractUrl = normalizeAbsolutePdfUrl(project.contractUrl);
        if (projectContractUrl) {
            log(`✅ [getProjectContractPdf] Redirecting to project contractUrl: ${projectContractUrl}`);
            return res.redirect(projectContractUrl);
        }

        log(`⚠️ [getProjectContractPdf] No contract PDF found for project: ${projectId}, details: ${JSON.stringify({
            projectId,
            hasContract: !!contract,
            contractId: contract?._id,
            hasContractPdfUrl: !!(contract?.pdfUrl),
            hasProjectContractUrl: !!project.contractUrl,
            contractStatus: contract?.status,
            sourceLeadId: project.sourceLeadId,
            clientEmail: project.clientEmail
        })}`);
        return res.status(404).json({
            success: false,
            message: "Contract PDF not available. If you just generated it, please wait a moment and refresh."
        });
    } catch (err: any) {
        console.error('❌ [getProjectContractPdf] Error:', {
            message: err.message,
            stack: err.stack
        });
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};
