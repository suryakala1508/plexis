import { AuthRequest } from '../../core/middleware';
import { FollowUpModel } from '../../models/followUpModel';
import { LeadModel } from '../../models/leadModel';
import { StudioModel } from '../../models/studioModel';
import { QuotationModel } from '../../models/quotationModel';
import { ContractModel } from '../../models/contractModel';
import { Request, Response } from 'express';
import { User } from '../../models/userModel';
import Client from '../../models/clientModel';
import { sendMail } from '../../core/services/mailer';
import { leadNotificationEmailTemplate } from './templates/leadFormEmaiTemplatel';
import { ENV } from '../../config/env';
import mongoose from 'mongoose'; // Added mongoose import for ObjectId validation

const SELECT_FIELDS = 'name slug form logo bannerImage bannerImageMobile tagline backgroundImage portfolioImages portfolioSelected aboutUs youtubeLinks banner refNo accentColor createdBy headerImages backgroundImages selectedHeaderImage selectedHeaderImageMobile selectedBackgroundImage';

export const leadform = async (req: Request, res: Response) => {
    try {
        const identifier = req.params.id as string;
        let studio: any = null;

        console.log(`[leadform] Looking up studio for identifier: "${identifier}"`);

        // Try to find by User ID first (Legacy support)
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            const userRef = await User.findById(identifier).select("refNo").lean();
            if (userRef?.refNo) {
                studio = await StudioModel.findOne({ refNo: (userRef as any).refNo })
                    .select(SELECT_FIELDS)
                    .lean();
            }
        }

        // Try exact slug lookup (fast, index-backed)
        if (!studio) {
            studio = await StudioModel.findOne({ slug: identifier })
                .select(SELECT_FIELDS)
                .lean();
            if (studio) console.log(`[leadform] Found by slug`);
        }

        // Fall back to name regex for studios without a slug yet, then lazy-migrate
        if (!studio) {
            const nameFromSlug = identifier.replace(/-/g, ' ');
            const escapedName = nameFromSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            console.log(`[leadform] Trying name regex: "^\\s*${escapedName}\\s*$" (i)`);
            studio = await StudioModel.findOne({ name: { $regex: new RegExp(`^\\s*${escapedName}\\s*$`, 'i') } })
                .select(SELECT_FIELDS)
                .lean();
            if (studio) {
                console.log(`[leadform] Found by name regex, name="${(studio as any).name}"`);
                if (!(studio as any).slug) {
                    StudioModel.updateOne({ _id: (studio as any)._id }, { $set: { slug: identifier } }).catch(() => {});
                }
            }
        }

        if (!studio) {
            // Log all studio names to help diagnose mismatches
            const allStudios = await StudioModel.find({}).select('name slug').lean();
            console.log(`[leadform] Studio NOT found. All studios in DB:`, allStudios.map((s: any) => ({ name: s.name, slug: s.slug })));
            return res.status(404).json({ success: false, message: "Studio not found" });
        }

        res.status(200).json({
            success: true,
            data: studio
        });
    } catch (error) {
        console.error("Error fetching lead form config:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


export const submitLeadForm = async (req: AuthRequest, res: Response) => {
    try {
        const formData = req.body;

        console.log("Received lead form data:", formData);

        // Attach userRef only if authenticated
        const leadData = {
            ...formData,
            ...(req.user?._id && { userRef: req.user._id }),
        };

        // Save lead
        const lead = new LeadModel(leadData);
        await lead.save();

        const savedLead = lead.toObject();

        let studio = null;
        let emailStatus = "not_sent";

        // ===============================
        // Try Sending Email (If Possible)
        // ===============================
        if (savedLead.userRef) {
            try {

                // Fetch studio
                studio = await StudioModel.findOne({
                    createdBy: savedLead.userRef,
                }).lean();

                // Fetch user
                const user = await User.findById(
                    savedLead.userRef
                ).lean();

                if (!studio) {
                    console.warn("Studio not found for:", savedLead.userRef);
                    emailStatus = "studio_not_found";
                } else if (!user?.email) {
                    console.warn("User email not found");
                    emailStatus = "user_email_missing";
                } else {
                    // Prepare email
                    const dashboardUrl = `${ENV.FRONTEND_URL}/dashboard`;

                    const emailData = leadNotificationEmailTemplate(
                        {
                            name: savedLead.name || "Anonymous",
                            email: savedLead.email || "",
                            contactNumber: savedLead.contactNumber || "",
                            whatsappNumber: savedLead.whatsappNumber || undefined,
                            EnquiryType: savedLead.EnquiryType || "General Inquiry",
                            EventDate: savedLead.EventDate || undefined,
                            EventEndDate: savedLead.EventEndDate || undefined,
                            Location: savedLead.Location || undefined,
                            Relation: savedLead.Relation || undefined,
                            source: savedLead.source || "Website",
                            createdAt: savedLead.createdAt
                        },
                        {
                            name: studio.name || "Studio",
                            logo: studio.logo,
                            accentColor: studio.accentColor,
                            mainAddress: studio.mainAddress || undefined,
                        },
                        dashboardUrl
                    );

                    // Send mail
                    await sendMail(
                        user.email,
                        emailData.subject,
                        "You have received a new lead inquiry.",
                        emailData.html
                    );


                    console.log("Lead email sent to:", user.email);

                    emailStatus = "sent";
                }
            } catch (mailErr) {
                console.error("Email sending failed:", mailErr);
                emailStatus = "failed";
            }
        } else {
            console.log("Public lead: No userRef, skipping email");
            emailStatus = "no_user";
        }

        // ===============================
        // RESPONSE
        // ===============================
        return res.status(200).json({
            success: true,
            message: `Lead form submitted successfully by ${savedLead.name}`,
            data: {
                lead: savedLead,
                studio,
                emailStatus,
            },
        });
    } catch (err) {
        console.error("Lead submission error:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error while submitting lead",
        });
    }
};






export const getLeads = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
        }
        const userId = req.user._id;

        // Return only leads associated with the authenticated user
        const query = { userRef: userId };
        const leads = await LeadModel.find(query).sort({ createdAt: -1 }).lean();

        return res.status(200).json({ success: true, data: leads });
    } catch (err) {
        return res.status(500).json({ success: false, message: `Server Error: ${err}` });
    }
};

export const getLeadById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
        }
        const leadId = req.params.id as string;

        // Reject known route names to prevent route matching issues
        const reservedRoutes = ['stats', 'submit', 'create'];
        if (reservedRoutes.includes(leadId)) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        const lead = await LeadModel.findById(leadId).lean();
        if (!lead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        const followUps = await FollowUpModel.find({ leadId: leadId }).sort({ createdAt: -1 }).lean();
        const quotations = await QuotationModel.find({ leadId: leadId }).sort({ createdAt: -1 }).lean();
        // Fetch contract from ContractModel, not QuotationModel
        const contract = await ContractModel.findOne({
            leadId: leadId,
            userId: req.user._id,
            isDeleted: false
        }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, data: { lead, followUps, quotations, contract } });
    } catch (err) {
        return res.status(500).json({ success: false, message: `Server Error: ${err}` });
    }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
        }
        const leadId = req.params.id as string;
        const updateData = req.body;
        const updatedLead = await LeadModel.findByIdAndUpdate(leadId, updateData, { new: true }).lean() as any;
        if (!updatedLead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }

        // Auto-add client if status is changed to 'Confirmed'
        if (updateData.status === 'Confirmed') {
            const existingClient = await Client.findOne({
                email: updatedLead.email,
                userRef: req.user._id
            });

            if (!existingClient) {
                const newClient = new Client({
                    clientName: updatedLead.name || 'Unnamed Client',
                    email: updatedLead.email || '',
                    phone: updatedLead.contactNumber || updatedLead.whatsappNumber || '',
                    userRef: req.user._id,
                    status: 'Ongoing'
                });
                await newClient.save();
            }
        }

        return res.status(200).json({ success: true, data: updatedLead });
    } catch (err) {
        return res.status(500).json({ success: false, message: `Server Error: ${err}` });
    }
};

export const deleteLead = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
        }
        const leadId = req.params.id as string;
        const deletedLead = await LeadModel.findByIdAndDelete(leadId);
        if (!deletedLead) {
            return res.status(404).json({ success: false, message: "Lead not found" });
        }
        return res.status(200).json({ success: true, message: "Lead deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: `Server Error: ${err}` });
    }
};

export const getLeadStats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
        }

        const { range } = req.query;
        const userId = req.user._id;
        let startDate = new Date();
        let endDate = new Date();
        let groupBy: any;
        let format = "month";

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        if (range === 'week') {
            // Current week: Sunday to Saturday
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999);

            startDate = startOfWeek;
            endDate = endOfWeek;
            groupBy = { $dayOfWeek: "$createdAt" };
            format = "day";
        } else if (range === 'month') {
            // Last 4 weeks from today
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 28); // 4 weeks back
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            groupBy = { $week: "$createdAt" };
            format = "week";
        } else if (range === 'year') {
            // Current year only: Jan 1 to Dec 31
            const currentYear = new Date().getFullYear();
            startDate = new Date(currentYear, 0, 1); // Jan 1st
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(currentYear, 11, 31); // Dec 31st
            endDate.setHours(23, 59, 59, 999);
            groupBy = { $month: "$createdAt" };
            format = "month";
        } else {
            startDate = new Date(0);
            groupBy = { $month: "$createdAt" };
            format = "month";
        }

        const matchQuery: any = {
            userRef: userId,
            createdAt: { $gte: startDate }
        };

        // Add end date filter for week, month, and year
        if (range === 'week' || range === 'month' || range === 'year') {
            matchQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const stats = await LeadModel.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupBy,
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Create a map of existing data
        const dataMap = new Map(stats.map(s => [s._id, s.count]));

        let formattedData: { label: string; count: number }[] = [];

        if (format === 'day') {
            // Week view: Show all 7 days Sun-Sat with 0 for missing days
            // MongoDB $dayOfWeek: 1=Sunday, 2=Monday, ... 7=Saturday
            formattedData = dayNames.map((day, index) => ({
                label: day,
                count: dataMap.get(index + 1) || 0
            }));
        } else if (format === 'month' && range === 'year') {
            // Year view: Show all 12 months Jan-Dec with 0 for missing months
            // MongoDB $month: 1=Jan, 2=Feb, ... 12=Dec
            formattedData = monthNames.map((month, index) => ({
                label: month,
                count: dataMap.get(index + 1) || 0
            }));
        } else if (format === 'week') {
            // Month view: Show weeks with relative numbering (Week 1, 2, 3, 4)
            const sortedStats = stats.sort((a: any, b: any) => a._id - b._id);
            formattedData = sortedStats.map((s: any, index: number) => ({
                label: `Week ${index + 1}`,
                count: s.count
            }));
        } else {
            // Default formatting for other ranges
            formattedData = stats.map((s: any) => ({
                label: monthNames[s._id - 1] || `Month ${s._id}`,
                count: s.count
            }));
        }

        return res.status(200).json({ success: true, data: formattedData });
    } catch (err) {
        console.error('Lead Stats Error:', err);
        return res.status(500).json({ success: false, message: `Server Error: ${err}` });
    }
};
