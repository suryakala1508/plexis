import express from "express";
import { getAdminDash, loginAdmin, updateUserSubscription, createStudio, updateTicket, getUpgradeRequests, getAllTickets, getTicketById, sendTicketEmail, getStudioDetails, updateStudioPlanByAdmin, deleteStudioByAdmin } from "./adminController";
import { getStudioSubscription, updateStudioFeatureOverrides, resetFeatureOverrides, listStudiosWithSubscriptions } from "./adminSubscriptionController";
import { AdminVerify } from "../../core/middleware";



const adminRouter = express.Router();

/**
 * @swagger
 * /superadmin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */
adminRouter.get("/dashboard", AdminVerify, getAdminDash);

adminRouter.post("/studios", AdminVerify, createStudio);
adminRouter.delete("/studios/:studioId", AdminVerify, deleteStudioByAdmin);

// Export routes
import { exportStudioLeads, exportStudioClients, exportStudioGallery } from "./adminController";
adminRouter.get("/studios/:refNo/export/leads", AdminVerify, exportStudioLeads);
adminRouter.get("/studios/:refNo/export/clients", AdminVerify, exportStudioClients);
adminRouter.get("/studios/:refNo/export/gallery", AdminVerify, exportStudioGallery);


/**
 * @swagger
 * /superadmin/update-user-subscription:
 *   put:
 *     summary: Update user subscription (storage and validity)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refNo
 *             properties:
 *               refNo:
 *                 type: string
 *                 description: User reference number
 *                 example: user1234567890
 *               additionalStorage:
 *                 type: number
 *                 description: Additional storage to add in MB/GB
 *                 example: 5000
 *               extendDays:
 *                 type: number
 *                 description: Number of days to extend subscription
 *                 example: 30
 *     responses:
 *       200:
 *         description: User subscription updated successfully
 *       404:
 *         description: User or Studio not found
 *       500:
 *         description: Server error
 */
adminRouter.put("/update-user-subscription", AdminVerify, updateUserSubscription);
adminRouter.put("/update-studio-plan", AdminVerify, updateStudioPlanByAdmin);


adminRouter.put("/update-ticket", AdminVerify, updateTicket);
adminRouter.get("/upgrade-requests", AdminVerify, getUpgradeRequests);
adminRouter.get("/tickets", AdminVerify, getAllTickets);
adminRouter.get("/tickets/:ticketId", AdminVerify, getTicketById);
adminRouter.post("/tickets/:ticketId/send-email", AdminVerify, sendTicketEmail);

// Subscription management routes (admin only)
adminRouter.get("/studios", AdminVerify, listStudiosWithSubscriptions);
adminRouter.get("/studios/:refNo/details", AdminVerify, getStudioDetails);
adminRouter.get("/studios/:studioId/subscription", AdminVerify, getStudioSubscription);
adminRouter.patch("/studios/:studioId/subscription/features", AdminVerify, updateStudioFeatureOverrides);
adminRouter.post("/studios/:studioId/subscription/features/reset", AdminVerify, resetFeatureOverrides);

export default adminRouter;