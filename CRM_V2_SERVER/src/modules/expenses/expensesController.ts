import { Response } from "express";
import { AuthRequest } from "../../core/middleware"
import { ExpenseModel } from "../../models/expenseModel";
import { Project } from "../../models/projectModel";
import { Crew } from "../../models/crewModel";
import { uploadToRefnoFolder } from "../../core/services/upload";

export const getExpenseOptions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        
        // Fetch active projects only (exclude completed/cancelled so past projects don't block the dropdown)
        const projects = await Project.find({
            createdBy: userId,
            projectStatus: { $nin: ['Completed', 'Cancelled'] }
        }).select('_id projectTitle');
        
        // Fetch crew: just _id and name
        const crew = await Crew.find({ crewToStudio: userId }).select('_id name');
        
        return res.status(200).json({ success: true, data: { projects, crew } });
    } catch (err: any) {
        console.error("❌ Error fetching expense options:", err);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}


export const getExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const expenses = await ExpenseModel.find({ createdBy: req.user?._id })
            .populate('projectId', 'projectTitle')
            .populate('assignedCrew', 'name')
            .sort({ date: -1 });
        return res.status(200).json({ success: true, data: expenses });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const getExpenseSummary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const [allExpenses, recentExpenses] = await Promise.all([
            ExpenseModel.find({ createdBy: userId }).lean(),
            ExpenseModel.find({ createdBy: userId })
                .populate('projectId', 'projectTitle')
                .populate('assignedCrew', 'name')
                .sort({ date: -1 })
                .limit(5)
                .lean()
        ]);

        const weekLabels = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
        const monthLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        const yearLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const weekTrend = new Map(weekLabels.map((label) => [label, 0]));
        const monthTrend = new Map(monthLabels.map((label) => [label, 0]));
        const yearTrend = new Map(yearLabels.map((label) => [label, 0]));

        let totalAllTime = 0;
        let thisMonth = 0;
        let lastMonth = 0;
        let count = 0;
        const categoryTotals = new Map<string, number>();

        allExpenses.forEach((expense: any) => {
            const amount = Number(expense?.amount) || 0;
            const expenseDate = expense?.date ? new Date(expense.date) : null;

            totalAllTime += amount;
            count += 1;

            if (expense?.category) {
                categoryTotals.set(expense.category, (categoryTotals.get(expense.category) || 0) + amount);
            }

            if (!expenseDate || Number.isNaN(expenseDate.getTime())) {
                return;
            }

            if (expenseDate >= startOfMonth) {
                thisMonth += amount;
            }

            if (expenseDate >= startOfLastMonth && expenseDate <= endOfLastMonth) {
                lastMonth += amount;
            }

            if (expenseDate >= startOfWeek && expenseDate <= endOfWeek) {
                const label = weekLabels[expenseDate.getDay()];
                weekTrend.set(label, (weekTrend.get(label) || 0) + amount);
            }

            if (expenseDate >= startOfMonth && expenseDate < new Date(now.getFullYear(), now.getMonth() + 1, 1)) {
                const weekIndex = Math.min(3, Math.floor((expenseDate.getDate() - 1) / 7));
                const label = monthLabels[weekIndex];
                monthTrend.set(label, (monthTrend.get(label) || 0) + amount);
            }

            if (expenseDate >= startOfYear && expenseDate <= endOfYear) {
                const label = yearLabels[expenseDate.getMonth()];
                yearTrend.set(label, (yearTrend.get(label) || 0) + amount);
            }
        });

        const categoryBreakdown = Array.from(categoryTotals.entries())
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 10);

        const summary = {
            total: totalAllTime,
            count,
            thisMonth,
            lastMonth,
            recentExpenses,
            categoryBreakdown,
            trends: {
                year: yearLabels.map((month) => ({
                    month,
                    amount: yearTrend.get(month) || 0
                })),
                month: monthLabels.map((week) => ({
                    month: week,
                    amount: monthTrend.get(week) || 0
                })),
                week: weekLabels.map((day) => ({
                    month: day,
                    amount: weekTrend.get(day) || 0
                }))
            }
        };

        return res.status(200).json({ success: true, data: summary });
    } catch (err: any) {
        console.error("❌ Error fetching expense summary:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
}

export const uploadExpenseScreenshots = async (req: AuthRequest, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }
        const urls = await Promise.all(files.map(f => uploadToRefnoFolder(f)));
        return res.status(200).json({ success: true, data: { urls } });
    } catch (err: any) {
        console.error("❌ Error uploading expense screenshots:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
};

export const addExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { amount, description, date, category, customCategory, projectId, assignedCrew, screenshots } = req.body;

        // Ensure empty strings are treated as null for ObjectId fields to prevent Mongoose cast errors
        const cleanProjectId = (projectId && projectId !== "" && projectId !== "undefined") ? projectId : null;
        const cleanAssignedCrew = (assignedCrew && assignedCrew !== "" && assignedCrew !== "undefined") ? assignedCrew : null;

        const newExpense = new ExpenseModel({
            amount,
            description,
            date,
            category,
            customCategory,
            projectId: cleanProjectId,
            assignedCrew: cleanAssignedCrew,
            createdBy: req.user?._id,
            screenshots: Array.isArray(screenshots) ? screenshots : []
        });
        await newExpense.save();
        
        // Populate the new expense before returning so frontend can easily use it
        await newExpense.populate([
            { path: 'projectId', select: 'projectTitle' },
            { path: 'assignedCrew', select: 'name' }
        ]);

        return res.status(201).json({ success: true, data: newExpense });
    } catch (err: any) {
        console.error("❌ Error adding expense:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
    try {
        const expenseId = req.params.id;
        const { amount, description, date, category, customCategory, projectId, assignedCrew, screenshots } = req.body;

        // Ensure empty strings are treated as null for ObjectId fields
        const cleanProjectId = (projectId && projectId !== "" && projectId !== "undefined") ? projectId : null;
        const cleanAssignedCrew = (assignedCrew && assignedCrew !== "" && assignedCrew !== "undefined") ? assignedCrew : null;

        const expense = await ExpenseModel.findOneAndUpdate(
            { _id: expenseId, createdBy: req.user?._id },
            {
                amount,
                description,
                date,
                category,
                customCategory,
                projectId: cleanProjectId,
                assignedCrew: cleanAssignedCrew,
                screenshots: Array.isArray(screenshots) ? screenshots : []
            },
            { new: true }
        ).populate([
            { path: 'projectId', select: 'projectTitle' },
            { path: 'assignedCrew', select: 'name' }
        ]);
        
        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }
        return res.status(200).json({ success: true, data: expense });
    } catch (err: any) {
        console.error("❌ Error updating expense:", err);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const expenseId = req.params.id;
        const expense = await ExpenseModel.findOneAndDelete({ _id: expenseId, createdBy: req.user?._id });
        if (!expense) {
            return res.status(404).json({ success: false, message: "Expense not found" });
        }
        return res.status(200).json({ success: true, message: "Expense deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};