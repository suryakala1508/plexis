import express from "express";
import multer from "multer";
import { uploadToRefnoFolder } from "../../core/services/upload";
import { AuthRequest } from "../../core/middleware";
import {
    getAllProjects,
    addProject,
    editProject,
    deleteProject,
    addTimeline,
    getProjectById,
    getProjectStats,
    getDashboardSummary,
    getTodaysTasks,
    getTurnoverStats,
    getRecentActivity,
    getProjectCountStats,
    getProfitLossStats,
    getFinancialInsights,
    deleteTimelineEntry,
    addPayment,
    getPayments,
    updatePayment,
    deletePayment,
    addPaymentSchedule,
    getPaymentSchedule,
    updatePaymentSchedule,
    deletePaymentSchedule,
    getPaymentScheduleSummary,
    syncProjectMilestones,
    updateTimelineEntry,
    releaseEquipment,
    addInHouseTask,
    getInHouseTasks,
    updateInHouseTaskStatus,
    updateInHouseTask,
    deleteInHouseTask,

} from './projectController';
import eventRouter from "../event/eventRoute";


const projectRouter = express.Router();

const screenshotUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 20 },
    fileFilter: (_req, file, cb) => {
        if (/^image\//.test(file.mimetype)) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

// Upload payment screenshots to refno/ folder
projectRouter.post('/upload-screenshots', screenshotUpload.array('screenshots', 20), async (req: AuthRequest, res: express.Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }
        const urls = await Promise.all(files.map((f: Express.Multer.File) => uploadToRefnoFolder(f)));
        return res.status(200).json({ success: true, data: { urls } });
    } catch (err: any) {
        console.error("❌ Error uploading payment screenshots:", err);
        return res.status(500).json({ success: false, message: "Server Error", error: err.message });
    }
});

// Move PDF routes before Verify middleware to allow iframe access (iframes don't support headers)
// These routes still use projectId for some level of security
import { getProjectQuotationPdf, getProjectContractPdf } from './projectController_pdf';
projectRouter.get("/:projectId/quotation/pdf", getProjectQuotationPdf);
projectRouter.get("/:projectId/contract/pdf", getProjectContractPdf);

/**
 * @swagger
 * /project:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all projects
 */
projectRouter.get("/", getAllProjects);
/**
 * @swagger
 * /project/stats:
 *   get:
 *     summary: Get project stats for dashboard
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *     responses:
 *       200:
 *         description: Project statistics
 */
projectRouter.get("/stats", getProjectStats);

/**
 * @swagger
 * /project/summary:
 *   get:
 *     summary: Get dashboard summary stats
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
projectRouter.get("/summary", getDashboardSummary);

/**
 * @swagger
 * /project/todays-tasks:
 *   get:
 *     summary: Get today's tasks for dashboard
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's tasks (followups, reminders, events, payments)
 */
projectRouter.get("/todays-tasks", getTodaysTasks);

/**
 * @swagger
 * /project/turnover:
 *   get:
 *     summary: Get turnover stats
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turnover stats
 */
projectRouter.get("/turnover", getTurnoverStats);

/**
 * @swagger
 * /project/recent-activity:
 *   get:
 *     summary: Get recent dashboard activity
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity feed
 */
projectRouter.get("/recent-activity", getRecentActivity);

/**
 * @swagger
 * /project/count-stats:
 *   get:
 *     summary: Get project count statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *     responses:
 *       200:
 *         description: Project count statistics
 */
projectRouter.get("/count-stats", getProjectCountStats);
projectRouter.get("/profit-loss-stats", getProfitLossStats);
projectRouter.get("/financial-insights", getFinancialInsights);

// In-house crew APIs (tasks)
projectRouter.get("/:projectId/inhouse/tasks", getInHouseTasks);
projectRouter.post("/:projectId/inhouse/tasks", addInHouseTask);
projectRouter.post(
    "/:projectId/inhouse/tasks/:taskId/status",
    updateInHouseTaskStatus
);
projectRouter.put("/:projectId/inhouse/tasks/:taskId", updateInHouseTask);
projectRouter.delete("/:projectId/inhouse/tasks/:taskId", deleteInHouseTask);


/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 */
projectRouter.get("/:id", getProjectById);

/**
 * @swagger
 * /project/add:
 *   post:
 *     summary: Add new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Project created successfully
 */
projectRouter.post("/add", addProject);

/**
 * @swagger
 * /project/update/{id}:
 *   post:
 *     summary: Update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Project updated successfully
 */
projectRouter.post("/update/:id", editProject);

/**
 * @swagger
 * /project/delete/{id}:
 *   post:
 *     summary: Delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project deleted successfully
 */
projectRouter.post("/delete/:id", deleteProject);

/**
 * @swagger
 * /project/addTimeline/{id}:
 *   post:
 *     summary: Add timeline to project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Timeline added successfully
 */
projectRouter.post("/addTimeline/:id", addTimeline);

/**
 * @swagger
 * /project/{projectId}/timeline/{entryIndex}:
 *   put:
 *     summary: Update a timeline entry in project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entryIndex
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Timeline entry updated successfully
 */
projectRouter.put("/:projectId/timeline/:entryIndex", updateTimelineEntry);

/**
 * @swagger
 * /project/deleteTimeline/{projectId}:
 *   post:
 *     summary: Delete a timeline entry from project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Timeline entry deleted successfully
 */
projectRouter.post("/deleteTimeline/:projectId", deleteTimelineEntry);

// Payment routes
projectRouter.post("/:projectId/payments", addPayment);
projectRouter.get("/:projectId/payments", getPayments);
projectRouter.put("/:projectId/payments/:paymentId", updatePayment);
projectRouter.delete("/:projectId/payments/:paymentId", deletePayment);

// Payment Schedule (Milestones) routes
projectRouter.get("/payment-schedule-summary", getPaymentScheduleSummary);
projectRouter.post("/:projectId/payment-schedule", addPaymentSchedule);
projectRouter.get("/:projectId/payment-schedule", getPaymentSchedule);
projectRouter.put("/:projectId/payment-schedule/:scheduleId", updatePaymentSchedule);
projectRouter.delete("/:projectId/payment-schedule/:scheduleId", deletePaymentSchedule);
projectRouter.post("/:projectId/sync-milestones", syncProjectMilestones);

// PDF routes (Already defined above)
// projectRouter.get("/:projectId/quotation/pdf", getProjectQuotationPdf);
// projectRouter.get("/:projectId/contract/pdf", getProjectContractPdf);

// Equipment release route
projectRouter.post("/:projectId/release-equipment", releaseEquipment);

projectRouter.use("/event", eventRouter);

export default projectRouter;