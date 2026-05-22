
import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { PaymentScheduleModel } from "../../models/paymentScheduleModel";
import { Project } from "../../models/projectModel";
import mongoose from "mongoose";

export const getPaymentDues = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const { projectId, startDate, endDate, crossedDue } = req.query;

        // Base query — exclude paid schedules entirely
        let query: any = {
            createdBy: new mongoose.Types.ObjectId(userId),
            status: { $ne: 'paid' }, // Never return paid schedules
        };

        // Filter by Project
        if (projectId) {
            query.projectId = new mongoose.Types.ObjectId(projectId as string);
        }

        // Filter by Date Range (Due Date)
        if (startDate || endDate) {
            query.dueDate = {};
            if (startDate) query.dueDate.$gte = new Date(startDate as string);
            if (endDate) query.dueDate.$lte = new Date(endDate as string);
        }

        // "Crossed Due Dates" filter (overdue & unpaid)
        if (crossedDue === 'true') {
            query.dueDate = { ...query.dueDate, $lt: new Date() };
        }

        const dues = await PaymentScheduleModel.find(query)
            .populate('projectId', 'projectTitle startDate endDate clientName projectAmount budget')
            .sort({ dueDate: 1 })
            .lean();

        // --- Unscheduled Balance Logic ---
        // For each unique project, check if projectAmount > sum of ALL its schedules (paid or unpaid).
        // If there's a gap, add a synthetic row for the unscheduled balance.

        // Collect unique project IDs from the dues result (or from filter if a specific project was requested)
        const projectIdsInDues = [...new Set(dues.map((d: any) => d.projectId?._id?.toString()).filter(Boolean))];
        // Fetch ALL projects by this user to catch zero-schedule projects
        const allUserProjects = await Project.find({
            createdBy: new mongoose.Types.ObjectId(userId),
        }).select('_id').lean();

        const allUserProjectIds = allUserProjects.map((p: any) => p._id.toString());

        // Merge with existing projectIdsInDues (no duplicates)
        for (const id of allUserProjectIds) {
            if (!projectIdsInDues.includes(id)) {
                projectIdsInDues.push(id);
            }
        }

        // If filtering by a specific project that might have no dues yet, include it too
        if (projectId && !projectIdsInDues.includes(projectId as string)) {
            projectIdsInDues.push(projectId as string);
        }

        let syntheticRows: any[] = [];

        if (projectIdsInDues.length > 0) {
            // Fetch ALL schedules (paid + unpaid) for these projects to compute the total scheduled amount
            const allSchedulesForProjects = await PaymentScheduleModel.find({
                createdBy: new mongoose.Types.ObjectId(userId),
                projectId: { $in: projectIdsInDues.map(id => new mongoose.Types.ObjectId(id)) },
            }).lean();

            // Fetch project documents to get projectAmount
            const projectDocs = await Project.find({
                _id: { $in: projectIdsInDues.map(id => new mongoose.Types.ObjectId(id)) },
            }).select('projectTitle clientName projectAmount budget endDate payments').lean();

            for (const proj of projectDocs) {
                const projId = (proj._id as mongoose.Types.ObjectId).toString();

                // Total agreed amount with client
                const projectAmount = (proj as any).projectAmount || parseFloat((proj as any).budget || '0') || 0;
                if (!projectAmount) continue; // No budget set, skip

                const projectSchedules = allSchedulesForProjects
                    .filter((s: any) => s.projectId?.toString() === projId);

                const totalScheduledAllStatuses = projectSchedules
                    .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

                // Backward compatibility: if a project has no schedule records yet,
                // fallback to legacy project.payments to avoid overstating due amount.
                const legacyPaid = ((proj as any).payments || [])
                    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

                // Payments made from paid schedules are already counted in totalScheduledAllStatuses.
                // Only subtract payments that exist outside of any payment schedule (direct payments).
                const paidFromSchedules = projectSchedules
                    .filter((s: any) => s.status === 'paid')
                    .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
                const directPayments = Math.max(0, legacyPaid - paidFromSchedules);

                const unscheduledBalance = projectSchedules.length > 0
                    ? (projectAmount - totalScheduledAllStatuses - directPayments)
                    : (projectAmount - legacyPaid);

                if (unscheduledBalance > 0.01) {
                    // There's money not assigned to any schedule — surface it as a due row
                    syntheticRows.push({
                        _id: `unscheduled_${projId}`,
                        projectId: {
                            _id: proj._id,
                            projectTitle: (proj as any).projectTitle,
                            clientName: (proj as any).clientName,
                        },
                        description: 'Remaining Payment',
                        amount: unscheduledBalance,
                        dueDate: proj.endDate, // No specific due date
                        status: 'pending',
                        isSynthetic: true, // Flag so the client can style it differently
                    });
                }
            }
        }

        const allRows = [...dues, ...syntheticRows];
        const totalAmount = allRows.reduce((sum, item) => sum + (item.amount || 0), 0);

        res.status(200).json({
            success: true,
            data: allRows,
            meta: {
                totalCount: allRows.length,
                totalAmount,
            }
        });

    } catch (err) {
        console.error("❌ getPaymentDues error:", err);
        res.status(500).send(`Server Error :${err}`);
    }
};



export const projectNames = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const projects = await Project.find({
            createdBy: new mongoose.Types.ObjectId(userId),
        }).select('projectTitle').sort({createdAt: -1}).lean();
        res.status(200).json({
            success: true,
            data: projects,
        });
    }
    catch(err){
        console.error("❌ projectNames error:", err);
        res.status(500).send(`Server Error :${err}`);
    }
}