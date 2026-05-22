import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { Project } from "../../models/projectModel";
import { User } from "../../models/userModel";
import { Crew } from "../../models/crewModel";
import mongoose, { Types } from "mongoose";

import { LeadModel } from "../../models/leadModel";
import Client from "../../models/clientModel";
import { ExpenseModel } from "../../models/expenseModel";
import { InventoryModel } from "../../models/inventoryModel";
import { QuotationModel } from "../../models/quotationModel";
import { ContractModel } from "../../models/contractModel";
import { StudioModel } from "../../models/studioModel";
import { CalenderEventModel } from "../../models/calenderEventModel";
import { FollowUpModel } from "../../models/followUpModel";
import { sendMail } from "../../core/services/mailer";
import { projectCreatedEmailTemplate } from "./templates/ClientEmailTemplate";
import { timelineUpdateEmailTemplate } from "./templates/TimelineUpdateEmailTemplate";
import { PaymentScheduleModel } from "../../models/paymentScheduleModel";
import { ENV } from "../../config/env";

interface ProjectWithCrew {
    _id: mongoose.Schema.Types.ObjectId;
    name: string;
    assignedCrew: typeof Crew;
}

const WEEK_LABELS = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_WEEK_LABELS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

const toValidDate = (value: any) => {
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? null : date;
};

const formatPaymentSignature = (payment: any) => {
    const paymentDate = toValidDate(payment?.paymentDate || payment?.paidDate || payment?.updatedAt || payment?.createdAt);
    const dateKey = paymentDate ? paymentDate.toISOString().slice(0, 10) : 'invalid';

    return [
        Number(payment?.amount) || 0,
        String(payment?.paidBy || payment?.paidByName || '').trim().toLowerCase(),
        String(payment?.phoneNumber || payment?.payerPhone || '').trim().toLowerCase(),
        String(payment?.paymentMethod || '').trim().toLowerCase(),
        dateKey
    ].join('|');
};

const buildLedgerEntries = (projects: any[], paidSchedules: any[]) => {
    const projectPayments: any[] = [];
    const scheduleIds = new Set<string>();
    const signatures = new Set<string>();

    projects.forEach((project: any) => {
        const payments = Array.isArray(project?.payments) ? project.payments : [];

        payments.forEach((payment: any) => {
            const sourceScheduleId = payment?.sourceScheduleId ? String(payment.sourceScheduleId) : null;
            if (sourceScheduleId) {
                scheduleIds.add(sourceScheduleId);
            }

            const paymentDate = toValidDate(payment?.paymentDate || payment?.createdAt);
            if (!paymentDate) {
                return;
            }

            const normalizedPayment = {
                amount: Number(payment?.amount) || 0,
                paidBy: payment?.paidBy || project?.clientName || 'Client',
                phoneNumber: payment?.phoneNumber || project?.clientPhone || '',
                paymentMethod: payment?.paymentMethod || 'Other',
                paymentDate,
                notes: payment?.notes || '',
                sourceScheduleId: sourceScheduleId || null
            };

            signatures.add(formatPaymentSignature(normalizedPayment));
            projectPayments.push(normalizedPayment);
        });
    });

    const schedulePayments = paidSchedules.reduce((entries: any[], schedule: any) => {
        const sourceScheduleId = String(schedule?._id || '');
        const paymentDate = toValidDate(schedule?.paidDate || schedule?.updatedAt);

        if (!paymentDate) {
            return entries;
        }

        const normalizedPayment = {
            amount: Number(schedule?.amount) || 0,
            paidBy: schedule?.paidByName || 'Client',
            phoneNumber: schedule?.payerPhone || '',
            paymentMethod: schedule?.paymentMethod || 'Other',
            paymentDate,
            notes: schedule?.notes || schedule?.description || 'From payment schedule',
            sourceScheduleId
        };

        if (scheduleIds.has(sourceScheduleId)) {
            return entries;
        }

        const signature = formatPaymentSignature(normalizedPayment);
        if (signatures.has(signature)) {
            return entries;
        }

        signatures.add(signature);
        entries.push(normalizedPayment);
        return entries;
    }, []);

    return [...projectPayments, ...schedulePayments];
};

const buildFilledBuckets = (labels: string[]) => {
    return new Map(labels.map((label) => [label, { label, revenue: 0 }]));
};

const getWeekStart = (date: Date) => {
    const weekStart = new Date(date);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return weekStart;
};

const getMonthWeekLabel = (paymentDate: Date) => {
    const weekIndex = Math.min(3, Math.floor((paymentDate.getDate() - 1) / 7));
    return MONTH_WEEK_LABELS[weekIndex];
};



export const getAllProjects = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const userEmail = req.user!.email;
        const userRole = req.user!.role.toString(); // 1 = Admin/Owner usually

        // If Admin/Owner, show all projects for their studio (refNo)
        if (userRole === "1") {
            // Get user's refNo
            const user = await User.findById(userId).select('refNo');
            if (user?.refNo) {
                // Find all users in this studio
                const studioUsers = await User.find({ refNo: user.refNo }).select('_id');
                const studioUserIds = studioUsers.map(u => u._id);

                const projects = await Project.find({ createdBy: { $in: studioUserIds } }).sort({ updatedAt: -1 }).lean();
                return res.status(200).json({ success: true, data: projects });
            }
        }

        // For Staff/Crew: lookup projects where they are creator, directly assigned, 
        // or part of the assignedCrew (finding Crew record by linkedUser OR email)
        const crewRecords = await Crew.find({
            $or: [
                { linkedUser: userId },
                { "contactInfo.email": userEmail }
            ]
        }).select('_id');

        const crewIds = crewRecords.map(c => c._id);

        const query: any = {
            $or: [
                { createdBy: userId },
                { assignedTo: userId },
                { assignedCrew: { $in: crewIds } }
            ]
        };

        const projects = await Project.find(query).sort({ updatedAt: -1 }).lean();
        res.status(200).json({ success: true, data: projects });
    } catch (err) {
        console.error("❌ getAllProjects error:", err);
        res.status(500).send(`Server Error :${err}`);
    }
}



export const addProject = async (req: AuthRequest, res: Response) => {
    try {
        const {
            projectTitle,
            projectDescription,
            startDate,
            endDate,
            projectType,
            clientEmail,
            clientPhone,
            budget,
            additionalBudget,
            assignedCrew,
            assignedEquipment,
            clientName,
            paymentMilestones,
            sourceLeadId,
            sourceQuotationId,
            sourceContractId,
            contractUrl,
            location,
            sendClientMail,
            projectAmount,
            inHouseCrew,
        } = req.body;

        // Parse dates from DD-MM-YYYY format to Date objects
        const parseDate = (dateStr: string): Date | undefined => {
            if (!dateStr) return undefined;
            // Check if it's DD-MM-YYYY format
            const parts = dateStr.split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
                // DD-MM-YYYY format
                const [day, month, year] = parts;
                return new Date(`${year}-${month}-${day}`);
            }
            // Otherwise try to parse as-is
            return new Date(dateStr);
        };

        const parsedStartDate = parseDate(startDate);
        const parsedEndDate = parseDate(endDate);

        // ===============================
        // CREATE PROJECT
        // ===============================
        const newProject = new Project({
            projectTitle,
            projectDescription: projectDescription || "",
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            projectType,
            clientEmail,
            clientPhone: clientPhone || "",
            clientName: clientName?.trim() || "Unnamed Client",
            location,
            budget,
            additionalBudget: additionalBudget || "0",
            projectAmount: typeof projectAmount === 'number' ? projectAmount : 0,
            sourceLeadId,
            sourceQuotationId,
            sourceContractId,
            contractUrl,
            assignedCrew: assignedCrew || [],
            assignedEquipment: assignedEquipment || [],
            paymentMilestones: paymentMilestones || [],
            inHouseCrew: Array.isArray(inHouseCrew) ? inHouseCrew : [],
            createdBy: req.user!._id,
            progressTimeline: [{
                title: "Project Created",
                description: "Project has been created",
                completedAt: new Date()
            }]
        });

        await newProject.save();

        // ===============================
        // CLIENT SYNC
        // ===============================
        let existingClient = null;

        if (clientEmail) {
            existingClient = await Client.findOne({
                email: clientEmail,
                userRef: req.user!._id
            });
        }

        if (existingClient) {
            existingClient.status = 'Ongoing';
            if (clientName) existingClient.clientName = clientName;
            if (clientPhone) existingClient.phone = clientPhone;
            await existingClient.save();
        } else {
            const ClientData = new Client({
                clientName: clientName || "Unnamed Client",
                email: clientEmail || "",
                phone: clientPhone || "",
                userRef: req.user!._id,
                status: 'Ongoing'
            });

            await ClientData.save();
        }

        // ===============================
        // CREW SYNC
        // ===============================
        if (newProject.assignedCrew && newProject.assignedCrew.length > 0) {
            await Crew.updateMany(
                { _id: { $in: newProject.assignedCrew } },
                { $addToSet: { assignedTo: newProject._id } }
            );
        }

        // ===============================
        // EMAIL FLOW (CLIENT NOTIFICATION)
        // ===============================
        let studio = null;
        let emailStatus = "not_sent";

        if (sendClientMail && clientEmail) {
            try {

                // Fetch studio
                studio = await StudioModel.findOne({
                    createdBy: newProject.createdBy
                }).lean();

                // Fetch user
                const user = await User.findById(
                    newProject.createdBy
                ).lean();

                if (!studio) {
                    console.warn("⚠️ Studio not found for:", newProject.createdBy);
                    emailStatus = "studio_not_found";
                } else if (!clientEmail) {
                    console.warn("⚠️ Client email missing");
                    emailStatus = "client_email_missing";
                } else {
                    // ===============================
                    // EMAIL DATA
                    // ===============================
                    const projectPortalUrl = `${ENV.FRONTEND_URL}/project/${newProject._id}`;

                    const emailData = projectCreatedEmailTemplate(
                        {
                            projectTitle: newProject.projectTitle,
                            projectType: newProject.projectType,
                            startDate: newProject.startDate,
                            endDate: newProject.endDate || undefined,
                            location: location,
                        },
                        {
                            name: studio.name || "Studio",
                            tagline: studio.tagline,
                            logo: studio.logo,
                            accentColor: studio.accentColor,
                            address: studio.mainAddress || undefined,
                            phone: user?.phone || "",
                            email: user?.email || "",
                        },
                        {
                            name: clientName || "Client",
                            email: clientEmail
                        },
                        projectPortalUrl
                    );

                    // ===============================
                    // SEND EMAIL
                    // ===============================
                    await sendMail(
                        clientEmail,
                        emailData.subject,
                        `Your project "${newProject.projectTitle}" has been created.`,
                        emailData.html
                    );

                    emailStatus = "sent";
                }

            } catch (mailErr) {
                console.error("❌ Project email sending failed:", mailErr);
                emailStatus = "failed";
            }
        } else {
            emailStatus = "skipped";
        }

        // ===============================
        // RESPONSE
        // ===============================
        const projectData = newProject.toObject();

        return res.status(201).json({
            success: true,
            data: projectData,
            studio,
            emailStatus
        });

    } catch (err) {
        console.error("❌ addProject error:", err);

        return res.status(500).json({
            success: false,
            error: err instanceof Error ? err.message : err
        });
    }
};



export const editProject = async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const updateData = req.body;

        // Defensive Sanitization: Remove invalid IDs that could cause CastErrors
        if (updateData.assignedCrew && Array.isArray(updateData.assignedCrew)) {
            updateData.assignedCrew = updateData.assignedCrew.filter((id: { toString: () => string | number | mongoose.mongo.BSON.ObjectId | Uint8Array<ArrayBufferLike> | mongoose.mongo.BSON.ObjectIdLike; }) =>
                id && mongoose.Types.ObjectId.isValid(id.toString()) && id.toString() !== '[object Object]'
            );
        }

        if (updateData.assignedEquipment && Array.isArray(updateData.assignedEquipment)) {
            type AssignedEquipmentInput = { id?: any; _id?: any; quantity?: number } | null;
            const sanitizedEquipment = (updateData.assignedEquipment as AssignedEquipmentInput[])
                .map((item): { id: string; quantity: number } | null => {
                    if (!item) return null;
                    const id = item.id?._id || item.id || item._id;
                    return {
                        id: id ? id.toString() : "",
                        quantity: item.quantity || 1,
                    };
                })
                .filter((item): item is { id: string; quantity: number } =>
                    !!item &&
                    !!item.id &&
                    mongoose.Types.ObjectId.isValid(item.id) &&
                    item.id !== '[object Object]'
                );

            updateData.assignedEquipment = sanitizedEquipment;
        }

        const { assignedCrew: newAssignedCrew } = updateData;

        // Get the existing project to compare crew assignments
        const existingProject = await Project.findById(projectId);
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        const oldAssignedCrew = (existingProject.assignedCrew as any[]).map((id: any) => id.toString());
        const newCrewIds = newAssignedCrew ? newAssignedCrew.map((id: string) => id.toString()) : [];

        // Find crew to add (in new but not in old)
        const crewToAdd = newCrewIds.filter((id: string) => !oldAssignedCrew.includes(id));

        // Find crew to remove (in old but not in new)
        const crewToRemove = oldAssignedCrew.filter((id: string) => !newCrewIds.includes(id));

        // Update the project
        const updatedProject = await Project.findByIdAndUpdate(
            projectId,
            updateData,
            { new: true, runValidators: true }
        ).populate('assignedCrew'); // Populate crew data

        if (!updatedProject) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Add project to new crew members
        if (crewToAdd.length > 0) {
            await Crew.updateMany(
                { _id: { $in: crewToAdd } },
                { $addToSet: { assignedTo: projectId } }
            );
        }

        // Remove project from removed crew members
        if (crewToRemove.length > 0) {
            await Crew.updateMany(
                { _id: { $in: crewToRemove } },
                { $pull: { assignedTo: projectId } }
            );
        }

        return res.status(200).json({
            success: true,
            data: updatedProject,
            message: "Project updated successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Server Error: ${err}`
        });
    }
};

/**
 * In-house crew APIs
 * -------------------
 * These manage roles and tasks within a project's inHouseCrew array.
 */


export const addInHouseTask = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params as { projectId: string };
        const { crewId, name, dueDate } = req.body as { crewId?: string; name?: string; dueDate?: string };

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }
        if (!crewId || !Types.ObjectId.isValid(crewId)) {
            return res.status(400).json({ success: false, message: "Valid crewId is required" });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Task name is required" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const newTask: any = {
            crewId: new Types.ObjectId(crewId),
            name: name.trim(),
            status: "Pending",
        };
        if (dueDate) {
            newTask.dueDate = new Date(dueDate);
        }

        // Ensure array
        if (!Array.isArray((project as any).inHouseCrew)) {
            (project as any).inHouseCrew = [];
        }
        (project as any).inHouseCrew.push(newTask);
        
        await project.save();
        const savedTask = (project as any).inHouseCrew[(project as any).inHouseCrew.length - 1];
        const updated = await Project.findById(projectId)
                .populate({
                    path: "inHouseCrew.crewId",
                    select: "name position contactInfo role hasAccess",
                })
                .select("inHouseCrew")
                .lean();

            return res.status(200).json({
                success: true,
                newTaskId: savedTask._id,  // <-- explicit new task _id
                data: updated?.inHouseCrew || [],
            });
        } catch (err) {
                console.error("addInHouseTask error:", err);
                return res.status(500).json({
                    success: false,
                    message: `Server Error: ${err}`
                });
    }
};

/**
 * @desc Update an in-house task
 * @route PUT /api/project/:projectId/inhouse/tasks/:taskId
 * @access Private
 */
export const updateInHouseTask = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, taskId } = req.params as { projectId: string; taskId: string };
        const { crewId, name, dueDate } = req.body as { crewId?: string; name?: string; dueDate?: string };

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Find the task in the inHouseCrew array (checking both _id and id properties if needed, usually _id for subdocuments)
        // Mongoose subdocuments have an _id by default.
        const task = (project as any).inHouseCrew.id(taskId);

        if (!task) {
             return res.status(404).json({ success: false, message: "Task not found" });
        }

        if (name !== undefined) task.name = name.trim();
        if (crewId && Types.ObjectId.isValid(crewId)) task.crewId = new Types.ObjectId(crewId);
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
        // status is updated via a separate endpoint, but could be included here if desired.
        // For now, let's keep status separate as per existing pattern or include if body has it.
        // The prompt asked for "edit option for the cards... same popup", usually main details.

        await project.save();

        const updated = await Project.findById(projectId)
            .populate({
                path: "inHouseCrew.crewId",
                select: "name position contactInfo role hasAccess",
            })
            .select("inHouseCrew")
            .lean();

        return res.status(200).json({
            success: true,
            data: updated?.inHouseCrew || [],
            message: "Task updated successfully"
        });

    } catch (err) {
        console.error("updateInHouseTask error:", err);
        return res.status(500).json({
            success: false,
            message: `Server Error: ${err}`
        });
    }
};


export const getInHouseTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params as { projectId: string };

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }

        const project = await Project.findById(projectId)
            .populate({
                path: "inHouseCrew.crewId",
                select: "name position contactInfo role hasAccess",
            })
            .select("inHouseCrew")
            .lean();

        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        return res.status(200).json({
            success: true,
            data: project.inHouseCrew || [],
        });
    } catch (err) {
        console.error("getInHouseTasks error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// Old addInHouseTask and getInHouseTasks removed/replaced


export const updateInHouseTaskStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, taskId } = req.params as {
            projectId: string;
            taskId: string;
        };
        const { status } = req.body as { status?: string };

        const allowedStatuses = ["Pending", "In Progress", "Review", "Completed"];

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        const project: any = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        if (!Array.isArray(project.inHouseCrew)) {
            return res.status(404).json({ success: false, message: "No in-house tasks found" });
        }

        let task = project.inHouseCrew.id(taskId);
        if (!task) {
             task = project.inHouseCrew.find(
                (t: any) => t.id?.toString?.() === taskId || t._id?.toString?.() === taskId
            );
        }
        
        if (!task) {
             return res.status(404).json({ success: false, message: "Task not found" });
        }

        task.status = status;
        await project.save();



        const updated = await Project.findById(projectId)
            .populate({
                path: "inHouseCrew.crewId",
                select: "name position contactInfo role hasAccess",
            })
            .select("inHouseCrew")
            .lean();

        return res.status(200).json({
            success: true,
            data: updated?.inHouseCrew || [],
        });
    } catch (err) {
        console.error("updateInHouseTaskStatus error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};
export const deleteInHouseTask = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, taskId } = req.params as { projectId: string; taskId: string };

        if (!Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ success: false, message: "Invalid project id" });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const task = (project as any).inHouseCrew.id(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        task.deleteOne();
        await project.save();

        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });

    } catch (err) {
        console.error("deleteInHouseTask error:", err);
        return res.status(500).json({
            success: false,
            message: `Server Error: ${err}`,
        });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const deletedProject = await Project.findByIdAndDelete(projectId);
        if (!deletedProject) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }
        res.status(200).json({ success: true, message: "Project deleted successfully" });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const addTimeline = async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.id as string;
        const { title, description, completedAt, status, sendToClient } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Add timeline entry
        project.progressTimeline.push({
            title,
            description,
            completedAt,
            status: status || ''
        });

        // Update project status if provided
        if (status && ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'].includes(status)) {
            project.projectStatus = status as any;
        }

        await project.save();

        // Send email to client if requested
        const shouldSendEmail = Boolean(sendToClient) && project.clientEmail;

        if (shouldSendEmail) {
            try {
                const studio = await StudioModel.findOne({ createdBy: project.createdBy }).lean();

                if (!studio) {
                    throw new Error("Studio not found");
                }

                const emailData = timelineUpdateEmailTemplate(
                    project.projectTitle,
                    {
                        title,
                        description,
                        completedAt,
                        status: status || undefined,
                    },
                    {
                        name: studio.name || "PLEXIS",
                        tagline: studio.tagline,
                        logo: studio.logo,
                        accentColor: studio.accentColor,
                        address: studio.mainAddress || undefined,
                    },
                    {
                        name: project.clientName || "Valued Client",
                        email: project.clientEmail,
                    }
                );

                const emailResult = await sendMail(project.clientEmail, emailData.subject, emailData.text, emailData.html);
            } catch (emailError: any) {
                console.error('❌ [addTimeline] Failed to send email to client:', emailError);
                console.error('❌ [addTimeline] Error details:', {
                    message: emailError?.message,
                    code: emailError?.code,
                    response: emailError?.response,
                    stack: emailError?.stack
                });
                // Don't fail the request if email fails
            }
        } else if (sendToClient && !project.clientEmail) {
            console.warn('⚠️ [addTimeline] Email requested but project has no client email');
            console.warn('⚠️ [addTimeline] Project data:', {
                projectId: project._id,
                projectTitle: project.projectTitle,
                clientEmail: project.clientEmail
            });
        } else if (!sendToClient) {

        }

        // Convert to plain object to prevent circular JSON errors
        const projectData = project.toObject();
        res.status(200).json({ success: true, data: projectData });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const updateTimelineEntry = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, entryIndex } = req.params as { projectId: string; entryIndex: string };
        const { title, description, completedAt, status, sendToClient }: {
            title?: string;
            description?: string;
            completedAt?: string | Date;
            status?: string;
            sendToClient?: boolean;
        } = req.body;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        const index = parseInt(entryIndex);
        if (index < 0 || index >= project.progressTimeline.length) {
            return res.status(400).json({ success: false, message: "Invalid timeline entry index" });
        }

        // Update the timeline entry in-place to respect subdocument typing
        const entry = project.progressTimeline[index];
        if (title !== undefined) entry.title = title;
        if (description !== undefined) entry.description = description;
        if (completedAt !== undefined) entry.completedAt = new Date(completedAt);
        if (status !== undefined) entry.status = status;

        // Update project status if provided
        if (status && ['Planning', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'].includes(status)) {
            project.projectStatus = status as any;
        }

        await project.save();

        // Send email to client if requested
        if (sendToClient && project.clientEmail) {
            try {
                const studio = await StudioModel.findOne({ createdBy: project.createdBy }).lean();

                if (!studio) {
                    throw new Error("Studio not found");
                }

                const emailData = timelineUpdateEmailTemplate(
                    project.projectTitle,
                    {
                        title: entry.title,
                        description: entry.description ?? undefined,
                        completedAt: entry.completedAt,
                        status: entry.status || undefined,
                    },
                    {
                        name: studio.name || "PLEXIS",
                        tagline: studio.tagline ?? undefined,
                        logo: studio.logo ?? undefined,
                        accentColor: studio.accentColor ?? undefined,
                        address: studio.mainAddress || undefined,
                    },
                    {
                        name: project.clientName || "Valued Client",
                        email: project.clientEmail,
                    }
                );

                await sendMail(project.clientEmail, emailData.subject, emailData.text, emailData.html);

            } catch (emailError) {
                console.error('❌ Failed to send email to client:', emailError);
                // Don't fail the request if email fails
            }
        } else if (sendToClient && !project.clientEmail) {
            console.warn('⚠️ Email requested but project has no client email');
        }

        const projectData = project.toObject();
        res.status(200).json({ success: true, data: projectData });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<Response | void> => {
    try {
        const { id } = req.params as { id: string };

        // Reject known route names to prevent route matching issues
        const reservedRoutes = ['stats', 'summary', 'turnover', 'recent-activity', 'count-stats', 'profit-loss-stats', 'financial-insights', 'add', 'update', 'delete', 'addTimeline', 'deleteTimeline', 'payment-schedule-summary', 'event'];
        if (reservedRoutes.includes(id)) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Validate ObjectId
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project id"
            });
        }

        // Fetch project with populated crew, equipment, in-house crew, and source documents
        let project = await Project.findById(id)
            .populate({
                path: 'assignedCrew',
                select: 'name position contactInfo role hasAccess'
            })
            .populate({
                path: 'assignedEquipment.id',
                select: 'itemName category customCategory quantity available'
            })
            .populate({
                path: 'inHouseCrew.crewId',
                select: 'name position contactInfo role hasAccess'
            })
            .populate({
                path: 'sourceQuotationId',
            })
            .populate({
                path: 'sourceContractId',
                populate: {
                    path: 'leadId',
                    select: 'name email contactNumber'
                }
            })
            .lean() as any;

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Dynamic Linkage Fallback: If quotation or contract are missing, try to find them
        const projectObj = project as any;
        if (projectObj.assignedEquipment && Array.isArray(projectObj.assignedEquipment)) {
            projectObj.assignedEquipment = projectObj.assignedEquipment.filter((equipment: any) => {
                return equipment.id &&
                    equipment.id.itemName &&
                    (equipment.id.category || equipment.id.customCategory);
            });
        }
        if (!projectObj.sourceQuotationId) {
            let leadIds: any[] = [];
            if (projectObj.sourceLeadId) {
                leadIds.push(projectObj.sourceLeadId);
            } else if (projectObj.clientEmail) {
                const leads = await LeadModel.find({ email: projectObj.clientEmail }).select('_id');
                leadIds = leads.map(l => l._id);
            }

            if (leadIds.length > 0) {
                const fallbackQuotation = await QuotationModel.findOne({
                    leadId: { $in: leadIds },
                    status: 'accepted',
                    isDeleted: false
                }).sort({ updatedAt: -1 }).lean();

                if (fallbackQuotation) {
                    projectObj.sourceQuotationId = fallbackQuotation;
                }
            }
        }

        if (!projectObj.sourceContractId) {
            let leadIds: any[] = [];
            if (projectObj.sourceLeadId) {
                leadIds.push(projectObj.sourceLeadId);
            } else if (projectObj.clientEmail) {
                const leads = await LeadModel.find({ email: projectObj.clientEmail }).select('_id');
                leadIds = leads.map(l => l._id);
            }

            if (leadIds.length > 0) {
                const fallbackContract = await ContractModel.findOne({
                    leadId: { $in: leadIds },
                    isDeleted: false
                }).sort({ updatedAt: -1 }).lean();

                if (fallbackContract) {
                    projectObj.sourceContractId = fallbackContract;
                }
            }
        }

        // Format storage usage
        const storageUsed = project.storageUsed || 0;
        const formatBytes = (bytes: number) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const enrichedProject = {
            ...project,
            storageSize: {
                bytes: storageUsed,
                formatted: formatBytes(storageUsed)
            }
        };

        // Return project with all populated data
        return res.status(200).json({
            success: true,
            data: enrichedProject
        });

    } catch (err) {
        console.error('Get project by ID error:', err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


export const getProjectStats = async (req: AuthRequest, res: Response) => {
    try {
        const { range } = req.query;
        let matchCondition: any = {
            createdBy: new mongoose.Types.ObjectId(req.user!._id)
        };

        if (range === 'week') {
            // Current week: Monday to Sunday
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const startOfWeek = new Date(today);
            const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday of current week
            startOfWeek.setDate(diff);
            startOfWeek.setHours(0, 0, 0, 0); // Start of day

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
            endOfWeek.setHours(23, 59, 59, 999); // End of day

            matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
        } else if (range === 'month') {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            matchCondition.createdAt = { $gte: startDate };
        } else if (range === 'year') {
            const startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            matchCondition.createdAt = { $gte: startDate };
        } else {
            // All time - no date filter
        }

        const stats = await Project.aggregate([
            {
                $match: matchCondition
            },
            {
                $group: {
                    _id: "$projectType",
                    value: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", "Wedding"] }, then: "wedding" },
                                { case: { $eq: ["$_id", "Pre-wedding"] }, then: "pre-wedding" },
                                { case: { $eq: ["$_id", "Portrait"] }, then: "portrait" },
                                { case: { $eq: ["$_id", "Corporate"] }, then: "corporate" },
                                { case: { $eq: ["$_id", "Event"] }, then: "event" },
                            ],
                            default: "others"
                        }
                    },
                    value: 1
                }
            },
            {
                $group: {
                    _id: "$_id",
                    value: { $sum: "$value" }
                }
            },
            {
                $project: {
                    name: "$_id",
                    value: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({ success: true, data: stats });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);

        const [projectsCount, leadsCount, clientsCount, projects, expenses, paidSchedules] = await Promise.all([
            Project.countDocuments({ createdBy: userId }),
            LeadModel.countDocuments({ userRef: userId }),
            Client.countDocuments({ userRef: userId }),
            Project.find({ createdBy: userId }).select('budget payments clientName clientPhone').lean(),
            ExpenseModel.find({ createdBy: userId }).select('amount'),
            PaymentScheduleModel.find({ createdBy: userId, status: 'paid' }).select('amount paidDate updatedAt paidByName paymentMethod payerPhone description notes').lean()
        ]);

        const totalRevenue = projects.reduce((acc, project) => {
            if (!project.budget) return acc;
            const amount = parseFloat(project.budget.replace(/[^0-9.]/g, '')) || 0;
            return acc + amount;
        }, 0);

        const ledgerEntries = buildLedgerEntries(projects, paidSchedules);
        const totalIncome = ledgerEntries.reduce((acc, payment: any) => acc + (Number(payment?.amount) || 0), 0);
        const incomeTransactions = ledgerEntries.length;

        const totalExpenses = expenses.reduce((acc, expense) => {
            return acc + (expense.amount || 0);
        }, 0);

        const netRevenue = totalIncome - totalExpenses;

        res.status(200).json({
            success: true,
            data: {
                totalLeads: leadsCount,
                activeProjects: projectsCount, // For simplicity using total projects
                totalClients: clientsCount,
                revenue: totalRevenue,  // Changed from netRevenue to totalRevenue (total budget)
                totalIncome,
                incomeTransactions,
                totalExpenses: totalExpenses,
                netProfit: netRevenue   // Added for reference
            }
        });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const getTurnoverStats = async (req: AuthRequest, res: Response) => {
    try {
        const { range } = req.query;
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const now = new Date();
        const [paidSchedules, projects] = await Promise.all([
            PaymentScheduleModel.find({ createdBy: userId, status: 'paid' }).select('amount paidDate updatedAt paidByName paymentMethod payerPhone description notes').lean(),
            Project.find({ createdBy: userId }).select('payments clientName clientPhone').lean()
        ]);

        const ledgerEntries = buildLedgerEntries(projects, paidSchedules);

        let startDate: Date;
        let endDate: Date;
        let buckets: Map<string, { label: string; revenue: number }>;
        let getLabel: (paymentDate: Date) => string;

        if (range === 'week') {
            startDate = getWeekStart(now);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            buckets = buildFilledBuckets(WEEK_LABELS);
            getLabel = (paymentDate: Date) => WEEK_LABELS[paymentDate.getDay()];
        } else if (range === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            buckets = buildFilledBuckets(MONTH_WEEK_LABELS);
            getLabel = (paymentDate: Date) => getMonthWeekLabel(paymentDate);
        } else {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            buckets = buildFilledBuckets(MONTH_LABELS);
            getLabel = (paymentDate: Date) => MONTH_LABELS[paymentDate.getMonth()];
        }

        ledgerEntries.forEach((payment: any) => {
            const amount = Number(payment?.amount) || 0;
            const paymentDate = toValidDate(payment?.paymentDate);

            if (!amount || !paymentDate) {
                return;
            }

            if (paymentDate < startDate || paymentDate > endDate) {
                return;
            }

            const label = getLabel(paymentDate);
            const bucket = buckets.get(label);
            if (bucket) {
                bucket.revenue += amount;
            }
        });

        const formattedData = Array.from(buckets.values()).map((value) => ({
            label: value.label,
            revenue: value.revenue,
            amount: value.revenue,
            value: value.revenue
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (err) {
        res.status(500).send(`Server Error :${err}`);
    }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);

        const [leads, projects, expenses, crew, inventory, clients] = await Promise.all([
            LeadModel.find({ userRef: userId }).sort({ createdAt: -1 }).limit(5).lean(),
            Project.find({ createdBy: userId }).sort({ updatedAt: -1 }).limit(5).lean(),
            ExpenseModel.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
            Crew.find({ crewToStudio: userId }).sort({ createdAt: -1 }).limit(5).lean(),
            InventoryModel.find({ addedBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
            Client.find({ userRef: userId }).sort({ createdAt: -1 }).limit(5).lean()
        ]);

        const activities = [
            ...leads.map(l => ({
                id: `lead-${l._id}`,
                type: 'lead',
                title: 'New Lead Added',
                description: `${l.name} - ${l.EventType || 'Inquiry'}`,
                timestamp: l.createdAt,
                color: 'blue'
            })),
            ...projects.map(p => ({
                id: `project-${p._id}`,
                type: 'project',
                title: 'Project Update',
                description: p.projectTitle,
                timestamp: p.updatedAt,
                color: 'purple'
            })),
            ...expenses.map(e => ({
                id: `expense-${e._id}`,
                type: 'expense',
                title: 'Expense Added',
                description: `${e.description} - ₹${e.amount}`,
                timestamp: e.createdAt,
                color: 'green'
            })),
            ...crew.map(c => ({
                id: `crew-${c._id}`,
                type: 'crew',
                title: 'Crew Member Added',
                description: `${c.name} - ${c.position}`,
                timestamp: c.createdAt,
                color: 'orange'
            })),
            ...inventory.map(i => ({
                id: `inventory-${i._id}`,
                type: 'inventory',
                title: 'Inventory Item Added',
                description: `${i.itemName} - ${i.category} (Qty: ${i.quantity})`,
                timestamp: i.createdAt,
                color: 'teal'
            })),
            ...clients.map(c => ({
                id: `client-${c._id}`,
                type: 'client',
                title: 'New Client Added',
                description: `${c.clientName} - ${c.relation || 'Direct'}`,
                timestamp: c.createdAt,
                color: 'orange'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);


        res.status(200).json({ success: true, data: activities });
    } catch (err) {
        console.error('Recent Activity Error:', err);
        res.status(500).send(`Server Error :${err}`);
    }
};

export const getProjectCountStats = async (req: AuthRequest, res: Response) => {
    try {
        const { range } = req.query;
        const userId = new mongoose.Types.ObjectId(req.user!._id);
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
            createdBy: userId,
            createdAt: { $gte: startDate }
        };

        // Add end date filter for week, month, and year
        if (range === 'week' || range === 'month' || range === 'year') {
            matchQuery.createdAt = { $gte: startDate, $lte: endDate };
        }

        const stats = await Project.aggregate([
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
            formattedData = dayNames.map((day, index) => ({
                label: day,
                count: dataMap.get(index + 1) || 0
            }));
        } else if (format === 'month' && range === 'year') {
            // Year view: Show all 12 months Jan-Dec with 0 for missing months
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
                label: s._id ? (monthNames[s._id - 1] || `Month ${s._id}`) : 'Unknown',
                count: s.count
            }));
        }

        res.status(200).json({ success: true, data: formattedData });
    } catch (err) {
        console.error('Project Count Stats Error:', err);
        res.status(500).send(`Server Error :${err}`);
    }
};

/**
 * @desc Get comprehensive Profit & Loss statistics
 * @route GET /api/project/profit-loss-stats
 */
export const getProfitLossStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const { view = 'monthly', year, startDate: qStartDate, endDate: qEndDate } = req.query;

        // Use provided year or default to current year
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const now = new Date();
        const currentMonth = now.getMonth();

        // Custom date range parsing
        const customStart = qStartDate ? new Date(qStartDate as string) : null;
        const customEnd = qEndDate ? new Date(qEndDate as string) : null;
        if (customEnd) { customEnd.setHours(23, 59, 59, 999); }

        // Fetch all necessary data
        const [quotations, expenses, projects, schedules] = await Promise.all([
            QuotationModel.find({
                userId: userId,
                status: 'accepted',
                isDeleted: false
            }).populate('client', 'email').lean(),
            ExpenseModel.find({
                createdBy: userId
            }).lean(),
            Project.find({
                createdBy: userId
            }).select('projectTitle clientEmail budget startDate _id payments'),
            PaymentScheduleModel.find({
                createdBy: userId
            }).lean()
        ]);

        // Helper function to parse budget string to number
        const parseBudget = (budgetStr: string | null | undefined): number => {
            if (!budgetStr) return 0;
            const cleaned = budgetStr.replace(/[^0-9.]/g, '');
            return parseFloat(cleaned) || 0;
        };

        let result: any[] = [];

        if (view === 'monthly') {
            const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthlyMap = new Map();
            monthShortNames.forEach((month, index) => {
                monthlyMap.set(index, { month, paidPayments: 0, expenses: 0, overduePayments: 0, upcomingPayments: 0, totalBudget: 0 });
            });

            // Aggregate budgets and actual payments by month
            projects.forEach(project => {
                if (project.startDate) {
                    const startDate = new Date(project.startDate);
                    if (startDate.getFullYear() === targetYear) {
                        const data = monthlyMap.get(startDate.getMonth());
                        if (data) data.totalBudget += parseBudget(project.budget);
                    }
                }

                (project.payments || []).forEach((p: any) => {
                    const pDate = new Date(p.paymentDate);
                    if (pDate.getFullYear() === targetYear) {
                        const data = monthlyMap.get(pDate.getMonth());
                        if (data) data.paidPayments += p.amount;
                    }
                });
            });

            expenses.forEach(exp => {
                const expDate = new Date(exp.date);
                if (expDate.getFullYear() === targetYear) {
                    const data = monthlyMap.get(expDate.getMonth());
                    if (data) data.expenses += (exp.amount || 0);
                }
            });

            // Calculate overdue/upcoming based on schedule status directly
            for (let m = 0; m < 12; m++) {
                const monthSchedules = schedules.filter(s => {
                    const d = new Date(s.dueDate);
                    return d.getFullYear() === targetYear && d.getMonth() === m;
                });

                monthSchedules.forEach(s => {
                    if (s.status === 'paid') return;
                    const d = new Date(s.dueDate);
                    const data = monthlyMap.get(m);
                    if (data) {
                        if (d < now) data.overduePayments += s.amount;
                        else data.upcomingPayments += s.amount;
                    }
                });
            }

            result = Array.from(monthlyMap.values());

        } else if (view === 'weekly') {
            // Weekly breakdown for CURRENT MONTH
            const startOfMonth = new Date(targetYear, currentMonth, 1);
            const endOfMonth = new Date(targetYear, currentMonth + 1, 0);

            // Initialize 5 weeks (max possible in a month)
            const weeklyMap = new Map();
            for (let i = 1; i <= 5; i++) {
                weeklyMap.set(i, { month: `Week ${i}`, paidPayments: 0, expenses: 0, overduePayments: 0, upcomingPayments: 0, totalBudget: 0 });
            }

            const getWeekNumber = (date: Date) => {
                const day = date.getDate();
                return Math.ceil(day / 7);
            };

            projects.forEach(project => {
                const startDate = new Date(project.startDate);
                // Filter by target year for weekly view as well
                if (startDate.getFullYear() === targetYear && startDate.getMonth() === currentMonth) {
                    const data = weeklyMap.get(getWeekNumber(startDate));
                    if (data) data.totalBudget += parseBudget(project.budget);
                }

                (project.payments || []).forEach((p: any) => {
                    const pDate = new Date(p.paymentDate);
                    if (pDate.getFullYear() === targetYear && pDate.getMonth() === currentMonth) {
                        const data = weeklyMap.get(getWeekNumber(pDate));
                        if (data) data.paidPayments += p.amount;
                    }
                });
            });

            expenses.forEach(exp => {
                const expDate = new Date(exp.date);
                if (expDate.getFullYear() === targetYear && expDate.getMonth() === currentMonth) {
                    const data = weeklyMap.get(getWeekNumber(expDate));
                    if (data) data.expenses += (exp.amount || 0);
                }
            });

            schedules.forEach(s => {
                const d = new Date(s.dueDate);
                if (d.getFullYear() === targetYear && d.getMonth() === currentMonth) {
                    if (s.status === 'paid') return;
                    const data = weeklyMap.get(getWeekNumber(d));
                    if (data) {
                        if (d < now) data.overduePayments += s.amount;
                        else data.upcomingPayments += s.amount;
                    }
                }
            });

            result = Array.from(weeklyMap.values());

        } else if (view === 'project') {
            // Project-wise breakdown - Filter by target year
            const projectMap = new Map();

            // Filter projects by year first
            const filteredProjects = projects.filter(p => {
                if (!p.startDate) return false;
                const startDate = new Date(p.startDate);
                return startDate.getFullYear() === targetYear;
            });

            // Initialize with filtered projects (ONLY ONCE)
            filteredProjects.forEach(p => {
                const projectPaid = (p.payments || []).reduce((sum: number, pay: any) => sum + pay.amount, 0);
                const projectSchedules = schedules.filter(s => s.projectId?.toString() === p._id.toString())
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

                let overdue = 0;
                let upcoming = 0;

                projectSchedules.forEach(s => {
                    if (s.status === 'paid') return;
                    if (new Date(s.dueDate) < now) overdue += s.amount;
                    else upcoming += s.amount;
                });

                projectMap.set(p._id.toString(), {
                    month: p.projectTitle,
                    paidPayments: projectPaid,
                    expenses: expenses.filter(e => e.projectId?.toString() === p._id.toString()).reduce((sum, e) => sum + (e.amount || 0), 0),
                    overduePayments: overdue,
                    upcomingPayments: upcoming,
                    totalBudget: parseBudget(p.budget),
                    projectId: p._id.toString()
                });
            });

            result = Array.from(projectMap.values());

        } else if (view === 'custom' && customStart && customEnd) {
            // Custom date range — single aggregated row
            const label = `${customStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${customEnd.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;

            const row = { month: label, paidPayments: 0, expenses: 0, overduePayments: 0, upcomingPayments: 0, totalBudget: 0 };

            projects.forEach(project => {
                if (project.startDate) {
                    const sd = new Date(project.startDate);
                    if (sd >= customStart && sd <= customEnd) {
                        row.totalBudget += parseBudget(project.budget);
                    }
                }
                (project.payments || []).forEach((p: any) => {
                    const pDate = new Date(p.paymentDate);
                    if (pDate >= customStart && pDate <= customEnd) {
                        row.paidPayments += p.amount;
                    }
                });
            });

            expenses.forEach(exp => {
                const expDate = new Date(exp.date);
                if (expDate >= customStart && expDate <= customEnd) {
                    row.expenses += (exp.amount || 0);
                }
            });

            // Overdue/upcoming within custom range
            schedules.forEach(s => {
                const d = new Date(s.dueDate);
                if (d < customStart || d > customEnd) return;
                if (s.status === 'paid') return;
                if (d < now) row.overduePayments += s.amount;
                else row.upcomingPayments += s.amount;
            });

            result = [row];
        }

        // Common profit calculations
        const finalResult = result.map(data => {
            const exactProfit = Math.round(data.totalBudget - data.expenses);
            const paidPayments = Math.round(data.paidPayments);
            return {
                ...data,
                paidPayments,
                expenses: Math.round(data.expenses),
                overduePayments: Math.round(data.overduePayments || 0), // Use granularly calculated overdue amount
                upcomingPayments: Math.round(data.upcomingPayments || 0),
                realizedProfit: Math.round(paidPayments - data.expenses),
                exactProfit: exactProfit,
            };
        });

        res.status(200).json({
            success: true,
            data: finalResult
        });

    } catch (err: any) {
        console.error('P&L Stats Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Get Financial Insights based on 6-month trend analysis
 * @route GET /api/project/financial-insights
 */
export const getFinancialInsights = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // Fetch last 6 months of data
        const last6Months: any[] = [];
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(currentYear, currentMonth - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0);

            const [quotations, expenses] = await Promise.all([
                QuotationModel.find({
                    userId: userId,
                    status: 'accepted',
                    isDeleted: false,
                    'paymentMilestones.dueDate': { $gte: startDate, $lte: endDate }
                }).populate('client', 'email').lean(),
                ExpenseModel.find({
                    createdBy: userId,
                    date: { $gte: startDate, $lte: endDate }
                }).lean()
            ]);

            let monthlyRevenue = 0;
            let monthlyExpenses = 0;

            quotations.forEach(quote => {
                (quote.paymentMilestones || []).forEach(milestone => {
                    const dueDate = new Date(milestone.dueDate);
                    // Ensure milestone falls within the current month being processed
                    if (dueDate >= startDate && dueDate <= endDate) {
                        if (milestone.paid) {
                            monthlyRevenue += milestone.amount;
                        }
                    }
                });
            });

            expenses.forEach(exp => {
                monthlyExpenses += (exp.amount || 0);
            });

            last6Months.push({
                month: targetDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: Math.round(monthlyRevenue),
                expenses: Math.round(monthlyExpenses),
                profit: Math.round(monthlyRevenue - monthlyExpenses),
                profitMargin: monthlyRevenue > 0 ? ((monthlyRevenue - monthlyExpenses) / monthlyRevenue * 100).toFixed(1) : '0'
            });
        }

        // Generate basic financial insight based on trend analysis
        const currentMonthData = last6Months[last6Months.length - 1];
        const previousMonthData = last6Months.length > 1 ? last6Months[last6Months.length - 2] : null;

        // Calculate trends
        const revenueTrend = previousMonthData
            ? currentMonthData.revenue - previousMonthData.revenue
            : 0;
        const expenseTrend = previousMonthData
            ? currentMonthData.expenses - previousMonthData.expenses
            : 0;
        const profitTrend = previousMonthData
            ? currentMonthData.profit - previousMonthData.profit
            : 0;

        // Generate insight based on data
        let aiInsight: any = {
            message: currentMonthData.profit < 0
                ? `Operating at a loss this month (₹${Math.abs(currentMonthData.profit).toLocaleString()}). Review expenses immediately.`
                : profitTrend < 0 && previousMonthData
                    ? `Profit decreased by ₹${Math.abs(profitTrend).toLocaleString()} from last month. Monitor revenue and expenses.`
                    : revenueTrend > 0 && previousMonthData
                        ? `Revenue increased by ₹${revenueTrend.toLocaleString()} this month. Profit margin at ${currentMonthData.profitMargin}%.`
                        : `Profit margin at ${currentMonthData.profitMargin}%. Keep monitoring your finances.`,
            color: currentMonthData.profit < 0 ? 'red' : profitTrend < 0 ? 'amber' : 'blue',
            icon: currentMonthData.profit < 0 ? 'alert-triangle' : profitTrend < 0 ? 'trending-down' : 'lightbulb',
            priority: currentMonthData.profit < 0 ? 1 : profitTrend < 0 ? 3 : 5
        };

        res.status(200).json({
            success: true,
            data: {
                insight: aiInsight,
                trend: last6Months
            }
        });

    } catch (err: any) {
        console.error('Financial Insights Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Delete a timeline entry from project
 * @route POST /api/project/deleteTimeline/:projectId
 * @access Private
 */
export const deleteTimelineEntry = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { entryIndex } = req.body;

        if (entryIndex === undefined || entryIndex === null) {
            return res.status(400).json({
                success: false,
                message: 'Entry index is required'
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check if index is valid
        if (entryIndex < 0 || entryIndex >= project.progressTimeline.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entry index'
            });
        }

        // Remove the entry at the specified index
        project.progressTimeline.splice(entryIndex, 1);

        await project.save();

        res.status(200).json({
            success: true,
            message: 'Timeline entry deleted successfully',
            data: project
        });

    } catch (err: any) {
        console.error('Delete Timeline Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Add a payment to a project
 * @route POST /api/project/:projectId/payments
 * @access Private
 */
export const addPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { amount, paidBy, phoneNumber, paymentMethod, paymentDate, notes, screenshots } = req.body;

        if (!amount || !paidBy || !phoneNumber || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Amount, paidBy, phoneNumber, and paymentMethod are required'
            });
        }

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Push payment directly into the project's embedded payments array
        project.payments.push({
            amount,
            paidBy,
            phoneNumber,
            paymentMethod,
            paymentDate: paymentDate || new Date(),
            notes,
            screenshots: Array.isArray(screenshots) ? screenshots : [],
            createdAt: new Date()
        } as any);

        await project.save();

        res.status(201).json({
            success: true,
            message: 'Payment added successfully',
            data: project
        });

    } catch (err: any) {
        console.error('Add Payment Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Get all payments for a project
 * @route GET /api/project/:projectId/payments
 * @access Private
 */
export const getPayments = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId).select('payments');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project.payments || []
        });

    } catch (err: any) {
        console.error('Get Payments Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Update a payment in a project
 * @route PUT /api/project/:projectId/payments/:paymentId
 * @access Private
 */
export const updatePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, paymentId } = req.params as { projectId: string; paymentId: string };
        const { amount, paidBy, phoneNumber, paymentMethod, paymentDate, notes } = req.body;

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const payment = project.payments.id(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        if (amount !== undefined) payment.amount = amount;
        if (paidBy !== undefined) payment.paidBy = paidBy;
        if (phoneNumber !== undefined) payment.phoneNumber = phoneNumber;
        if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
        if (paymentDate !== undefined) payment.paymentDate = paymentDate;
        if (notes !== undefined) payment.notes = notes;

        await project.save();

        res.status(200).json({
            success: true,
            message: 'Payment updated successfully',
            data: payment
        });

    } catch (err: any) {
        console.error('Update Payment Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Delete a payment from a project
 * @route DELETE /api/project/:projectId/payments/:paymentId
 * @access Private
 */
export const deletePayment = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, paymentId } = req.params as { projectId: string; paymentId: string };

        const project = await Project.findById(projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const payment = project.payments.id(paymentId);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        payment.deleteOne();
        await project.save();

        res.status(200).json({
            success: true,
            message: 'Payment deleted successfully'
        });

    } catch (err: any) {
        console.error('Delete Payment Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

// ============ PAYMENT SCHEDULE (Milestones) FUNCTIONS ============


/**
 * @desc Add a payment schedule/milestone to a project
 * @route POST /api/project/:projectId/payment-schedule
 * @access Private
 */
export const addPaymentSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { description, amount, dueDate, notes } = req.body;
        const userId = req.user!._id;

        // Validate project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const schedule = new PaymentScheduleModel({
            projectId,
            description,
            amount,
            dueDate: new Date(dueDate),
            status: new Date(dueDate) < new Date() ? 'overdue' : 'pending',
            notes,
            createdBy: userId
        });

        await schedule.save();

        res.status(201).json({
            success: true,
            data: schedule,
            message: 'Payment milestone added successfully'
        });
    } catch (err: any) {
        console.error('Add Payment Schedule Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Get all payment schedules for a project
 * @route GET /api/project/:projectId/payment-schedule
 * @access Private
 */
export const getPaymentSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const now = new Date();

        const project = await Project.findById(projectId).select('projectStatus');
        const isProjectCompleted = project?.projectStatus === 'Completed';

        // Get all schedules for this project
        const schedules = await PaymentScheduleModel.find({ projectId })
            .sort({ dueDate: 1 })
            .lean();

        // Auto-update status for overdue items
        const updatedSchedules = schedules.map(schedule => {
            let currentStatus = schedule.status;

            if (currentStatus === 'pending' && new Date(schedule.dueDate) < now) {
                currentStatus = 'overdue';
            }

            // If the project is already completed, it shouldn't show as overdue
            if (isProjectCompleted && currentStatus === 'overdue') {
                currentStatus = 'pending';
            }

            return { ...schedule, status: currentStatus };
        });

        res.status(200).json({
            success: true,
            data: updatedSchedules
        });
    } catch (err: any) {
        console.error('Get Payment Schedule Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Update a payment schedule (mark as paid, update amount, etc.)
 * @route PUT /api/project/:projectId/payment-schedule/:scheduleId
 * @access Private
 */
export const updatePaymentSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, scheduleId } = req.params;
        const updateData = req.body;

        // Load existing schedule first so we can detect status transitions
        const existingSchedule = await PaymentScheduleModel.findOne({ _id: scheduleId, projectId });

        if (!existingSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Payment schedule not found'
            });
        }

        // If marking as paid, set paidDate if not provided
        if (updateData.status === 'paid' && !updateData.paidDate) {
            updateData.paidDate = new Date();
        }

        // Apply updates to the existing schedule document
        Object.assign(existingSchedule, updateData);
        await existingSchedule.save();

        // Keep project payment history in sync with paid schedules.
        if (existingSchedule.status === 'paid') {
            const project = await Project.findById(projectId);
            if (project) {
                const paymentHistoryEntry = {
                    amount: Number(updateData.amount ?? existingSchedule.amount) || 0,
                    paidBy: updateData.paidByName
                        || existingSchedule.paidByName
                        || project.clientName
                        || 'Client',
                    phoneNumber: updateData.payerPhone
                        || existingSchedule.payerPhone
                        || project.clientPhone
                        || '',
                    paymentMethod: updateData.paymentMethod
                        || existingSchedule.paymentMethod
                        || 'Other',
                    paymentDate: updateData.paidDate
                        || existingSchedule.paidDate
                        || new Date(),
                    notes: existingSchedule.description
                        ? `From schedule: ${existingSchedule.description}`
                        : 'From payment schedule',
                    sourceScheduleId: existingSchedule._id
                } as any;

                const payments = Array.isArray(project.payments) ? project.payments : [];
                const existingHistory = payments.find((payment: any) => {
                    return String(payment?.sourceScheduleId || '') === String(existingSchedule._id);
                });

                if (existingHistory) {
                    Object.assign(existingHistory, paymentHistoryEntry);
                } else {
                    project.payments.push(paymentHistoryEntry);
                }

                await project.save();
            }
        }

        res.status(200).json({
            success: true,
            data: existingSchedule,
            message: 'Payment milestone updated successfully'
        });
    } catch (err: any) {
        console.error('Update Payment Schedule Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Delete a payment schedule
 * @route DELETE /api/project/:projectId/payment-schedule/:scheduleId
 * @access Private
 */
export const deletePaymentSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId, scheduleId } = req.params;

        const schedule = await PaymentScheduleModel.findOneAndDelete({
            _id: scheduleId,
            projectId
        });

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Payment schedule not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment milestone deleted successfully'
        });
    } catch (err: any) {
        console.error('Delete Payment Schedule Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Get overdue and upcoming payment totals for a user
 * @route GET /api/project/payment-schedule-summary
 * @access Private
 */
export const getPaymentScheduleSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const now = new Date();

        const schedules = await PaymentScheduleModel.find({
            createdBy: userId,
            status: { $ne: 'paid' }
        }).lean();

        let overdueTotal = 0;
        let upcomingTotal = 0;

        schedules.forEach(schedule => {
            if (new Date(schedule.dueDate) < now) {
                overdueTotal += schedule.amount;
            } else {
                upcomingTotal += schedule.amount;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                overduePayments: overdueTotal,
                upcomingPayments: upcomingTotal,
                overdueCount: schedules.filter(s => new Date(s.dueDate) < now).length,
                upcomingCount: schedules.filter(s => new Date(s.dueDate) >= now).length
            }
        });
    } catch (err: any) {
        console.error('Payment Schedule Summary Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};
/**
 * @desc Sync payment milestones from the latest accepted quotation
 * @route POST /api/project/:projectId/sync-milestones
 * @access Private
 */
export const syncProjectMilestones = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const userId = req.user!._id;

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Find the latest accepted quotation for this project's lead or client email
        let quotation = null;
        if (project.sourceLeadId) {
            quotation = await QuotationModel.findOne({
                leadId: project.sourceLeadId,
                status: 'accepted'
            }).sort({ updatedAt: -1 });
        } else {
            // Fallback to client email if sourceLeadId is not set
            quotation = await QuotationModel.findOne({
                clientEmail: project.clientEmail,
                status: 'accepted'
            }).sort({ updatedAt: -1 });
        }

        if (!quotation || !quotation.paymentMilestones || quotation.paymentMilestones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No accepted quotation with milestones found for this project.'
            });
        }

        // 1. Delete existing unpaid/overdue schedules for this project
        await PaymentScheduleModel.deleteMany({
            projectId,
            status: { $in: ['pending', 'overdue'] }
        });

        // 2. Insert new ones from the quotation
        const newSchedules = quotation.paymentMilestones.map((m: any) => ({
            projectId,
            description: m.description,
            amount: m.amount,
            dueDate: m.dueDate,
            status: new Date(m.dueDate) < new Date() ? 'overdue' : 'pending',
            createdBy: userId
        }));

        await PaymentScheduleModel.insertMany(newSchedules);

        res.status(200).json({
            success: true,
            message: 'Payment milestones synced successfully from quotation',
            data: newSchedules
        });

    } catch (err: any) {
        console.error('Sync Milestones Error:', err);
        res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * @desc Release equipment back to inventory when project is completed
 * @route POST /api/project/:projectId/release-equipment
 * @access Private
 */
export const releaseEquipment = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;

        // Find the project
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }


        // Check if equipment has already been released
        if (!project.assignedEquipment || project.assignedEquipment.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No equipment assigned to this project or equipment already released'
            });
        }

        const { itemIds } = req.body; // Optional array of item IDs to release specifically
        const releaseAll = !itemIds || !Array.isArray(itemIds) || itemIds.length === 0;

        const releasedItems: any[] = [];
        const errors: any[] = [];

        // Identify which items to process
        const itemsToProcess = releaseAll
            ? project.assignedEquipment
            : project.assignedEquipment.filter((eq: any) => itemIds.includes(eq.id.toString()));

        if (itemsToProcess.length === 0) {
            return res.status(400).json({
                success: false,
                message: releaseAll ? 'No equipment assigned' : 'None of the specified items are assigned to this project'
            });
        }

        // Loop through identified equipment and return to inventory
        for (const equipmentItem of itemsToProcess) {
            try {
                const equipmentId = equipmentItem.id;
                const quantity = equipmentItem.quantity || 1;

                // Find inventory item
                const inventoryItem = await InventoryModel.findById(equipmentId);

                if (!inventoryItem) {
                    errors.push({
                        equipmentId,
                        error: 'Inventory item not found'
                    });
                    continue;
                }

                // 1. Remove this project from the assignments array
                inventoryItem.assignedTo = inventoryItem.assignedTo.filter(
                    (a: any) => a.projectId && a.projectId.toString() !== projectId.toString()
                ) as any;

                // 2. Recalculate available count robustly
                const totalAssigned = inventoryItem.assignedTo.reduce(
                    (sum: number, a: any) => sum + (a.quantity || 0), 0
                );

                inventoryItem.available = Math.max(0, inventoryItem.quantity - totalAssigned);

                // 3. Safety check: ensure available doesn't exceed total quantity
                if (inventoryItem.available > inventoryItem.quantity) {
                    inventoryItem.available = inventoryItem.quantity;
                }

                await inventoryItem.save();

                releasedItems.push({
                    id: equipmentId.toString(),
                    itemName: inventoryItem.itemName,
                    category: inventoryItem.category,
                    quantityReleased: quantity,
                    newAvailable: inventoryItem.available,
                    total: inventoryItem.quantity
                });

            } catch (itemError: any) {
                errors.push({
                    equipmentId: equipmentItem.id,
                    error: itemError.message
                });
            }
        }

        // Update assigned equipment in project
        const releasedIds = releasedItems.map(item => item.id);
        const remainingEquipment = project.assignedEquipment.filter(
            (eq: any) => !releasedIds.includes(eq.id.toString())
        );
        project.set('assignedEquipment', remainingEquipment);

        await project.save();

        // Add timeline entry for equipment release
        project.progressTimeline.push({
            title: 'Equipment Released',
            description: releaseAll
                ? `All assigned equipment has been returned to inventory (${releasedItems.length} items)`
                : `Selected equipment has been returned to inventory (${releasedItems.length} items)`,
            completedAt: new Date(),
            status: project.assignedEquipment.length === 0 ? 'Completed' : project.projectStatus
        });
        await project.save();

        return res.status(200).json({
            success: true,
            message: 'Equipment released successfully',
            data: {
                releasedItems,
                errors: errors.length > 0 ? errors : undefined,
                totalReleased: releasedItems.length,
                totalErrors: errors.length
            }
        });

    } catch (err: any) {
        console.error('Release Equipment Error:', err);
        return res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`
        });
    }
};

/**
 * Get Today's Tasks (Follow-ups, Events, Payments)
 * Used by the Dashboard to efficiently load just today's items
 */
export const getTodaysTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;

    // Get start and end of today strictly in IST (Asia/Kolkata)
    const now = new Date();
    const nowISTstr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const nowIST = new Date(nowISTstr);

    const year = nowIST.getFullYear();
    const month = (nowIST.getMonth() + 1).toString().padStart(2, "0");
    const day = nowIST.getDate().toString().padStart(2, "0");

    // Construct ISO strings for strictly 00:00:00 and 23:59:59+05:30 on that target day
    const startOfToday = new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
    const endOfToday = new Date(`${year}-${month}-${day}T23:59:59.999+05:30`);

    // 1. Fetch Today's Calendar Events (including multi-day overlaps)
    const calEvents =
      (await CalenderEventModel.find({
        createdBy: userId,
        $or: [
          { start: { $lte: endOfToday }, end: { $gte: startOfToday } },
          { start: { $gte: startOfToday, $lte: endOfToday }, end: { $exists: false } },
          { start: { $gte: startOfToday, $lte: endOfToday }, end: null }
        ]
      }).lean()) || [];

    // 2. Fetch Projects active today (including multi-day overlaps)
    const projEvents =
      (await Project.find({
        createdBy: userId,
        $or: [
          { startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday } },
          { startDate: { $gte: startOfToday, $lte: endOfToday }, endDate: { $exists: false } },
          { startDate: { $gte: startOfToday, $lte: endOfToday }, endDate: null }
        ]
      })
        .select(
          "_id projectTitle startDate endDate projectDescription location clientName",
        )
        .lean()) || [];

    // 3. Fetch Today's Follow-Ups
    const followUps =
      (await FollowUpModel.find({
        userId: userId,
        date: { $gte: startOfToday, $lte: endOfToday },
      })
        .populate("leadId", "name")
        .populate("clientId", "clientName")
        .lean()) || [];

    // 4. Fetch Today's Unpaid Payments (and synthetics)
    // Reusing the same logic from paymentController but tightly bound to today
    const payments =
      (await PaymentScheduleModel.find({
        createdBy: new mongoose.Types.ObjectId(userId),
        dueDate: { $gte: startOfToday, $lte: endOfToday }, // Only today
      })
        .populate(
          "projectId",
          "projectTitle endDate clientName projectAmount budget",
        )
        .lean()) || [];

    // === Map the data to Dashboard's expected format ({ id, name, desc, time, overdue, originalEvent }) ===
    const formatTime = (dateInput: Date | string) => {
      return new Date(dateInput).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    const todaysEvents: any[] = [];
    const todaysFollowups: any[] = [];
    const todaysReminders: any[] = [];
    const todaysPayments: any[] = [];

    // Map Calendar Events -> Events
    calEvents.forEach((evt) => {
      todaysEvents.push({
        id: (evt as any)._id,
        name: (evt as any).title,
        desc: (evt as any).description || "No details",
        time: formatTime((evt as any).start),
        overdue: false,
        originalEvent: evt,
      });
    });

    // Map Project Events -> Events
    projEvents.forEach((evt) => {
      todaysEvents.push({
        id: (evt as any)._id,
        name: (evt as any).projectTitle,
        desc: (evt as any).projectDescription || "No details",
        time: null,
        overdue: false,
        originalEvent: evt,
      });
    });

    // Map Follow-ups -> Follow-ups or Reminders
    followUps.forEach((evt: any) => {
      const leadObj = evt.leadId;
      const clientObj = evt.clientId;
      const targetName =
        leadObj?.name || clientObj?.clientName || evt.leadName || "Unknown";

      const mapped = {
        id: evt._id,
        name: targetName,
        desc: evt.reason || evt.notes || "No details",
        time: formatTime(evt.date),
        overdue: false, // Since it's exactly today
        originalEvent: {
          ...evt,
          type: "followup", // Required by frontend router logic
        },
      };

      if (clientObj) {
        todaysReminders.push(mapped);
      } else {
        todaysFollowups.push(mapped);
      }
    });

    // Map Payments -> Payments
    // Assuming strict scheduled logic here
    payments.forEach((due: any) => {
      todaysPayments.push({
        id: due._id,
        name: due.projectId?.projectTitle || "Unknown Project",
        desc: `${due.description} — ₹${(due.amount || 0).toLocaleString("en-IN")}`,
        time: due.status === "paid" ? "Paid" : "Due Today",
        overdue: false,
        done: due.status === "paid",
        originalPayment: due,
      });
    });

    res.status(200).json({
      success: true,
      data: {
        followups: todaysFollowups,
        reminders: todaysReminders,
        events: todaysEvents,
        payments: todaysPayments,
      },
    });
  } catch (err) {
    console.error("❌ getTodaysTasks error:", err);
    res.status(500).json({ success: false, message: `Server Error: ${err}` });
  }
};
