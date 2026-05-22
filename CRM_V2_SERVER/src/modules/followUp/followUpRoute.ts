import express from "express";
import { addFollowUp, getFollowUps, updateFollowUp, deleteFollowUp, markFollowUpCompleted } from "./followUpController";

const followUpRouter = express.Router();

/**
 * @swagger
 * /followup/lead/{leadId}:
 *   post:
 *     summary: Add follow-up for a lead
 *     tags: [Follow-Up]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
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
 *       201:
 *         description: Follow-up added successfully
 */
followUpRouter.post("/lead/:leadId", addFollowUp);
followUpRouter.post("/client/:clientId", addFollowUp);

/**
 * @swagger
 * /followup/lead/{leadId}:
 *   get:
 *     summary: Get all follow-ups for a lead
 *     tags: [Follow-Up]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of follow-ups
 */
followUpRouter.get("/lead/:leadId", getFollowUps);
followUpRouter.get("/client/:clientId", getFollowUps);

/**
 * @swagger
 * /followup/{followUpId}:
 *   put:
 *     summary: Update follow-up
 *     tags: [Follow-Up]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
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
 *         description: Follow-up updated successfully
 */
followUpRouter.put("/:followUpId", updateFollowUp);

/**
 * @swagger
 * /followup/{followUpId}:
 *   delete:
 *     summary: Delete follow-up
 *     tags: [Follow-Up]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up deleted successfully
 */
followUpRouter.delete("/:followUpId", deleteFollowUp);

/**
 * @swagger
 * /followup/{followUpId}/mark:
 *   post:
 *     summary: Mark follow-up as completed
 *     tags: [Follow-Up]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: followUpId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow-up marked as completed
 */
followUpRouter.post("/:followUpId/mark", markFollowUpCompleted);

export default followUpRouter;