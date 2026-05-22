import express from "express";
import { leadform, submitLeadForm, getLeads, getLeadById, updateLead, deleteLead, getLeadStats } from "./leadController";
import { Verify } from "../../core/middleware";

const leadRouter = express.Router();

/**
 * @swagger
 * /lead:
 *   get:
 *     summary: Get all leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all leads
 *       401:
 *         description: Unauthorized
 */
leadRouter.get("/", Verify, getLeads);

/**
 * @swagger
 * /lead/stats:
 *   get:
 *     summary: Get lead statistics
 *     tags: [Leads]
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
 *         description: Lead statistics
 */
leadRouter.get("/stats", Verify, getLeadStats);

/**
 * @swagger
 * /lead/{id}/leadform:
 *   get:
 *     summary: Get lead form
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lead form retrieved successfully
 */
leadRouter.get("/:id/leadform", leadform);

/**
 * @swagger
 * /lead/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Leads]
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
 *         description: Lead details
 *       404:
 *         description: Lead not found
 */
leadRouter.get("/:id", Verify, getLeadById);
/**
 * @swagger
 * /lead/submit:
 *   post:
 *     summary: Submit lead form (Public)
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Lead submitted successfully
 *       400:
 *         description: Bad request
 */
leadRouter.post("/submit", submitLeadForm);
/**
 * @swagger
 * /lead/create:
 *   post:
 *     summary: Create lead from CRM
 *     tags: [Leads]
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
 *         description: Lead created successfully
 */
leadRouter.post("/create", Verify, submitLeadForm);

/**
 * @swagger
 * /lead/{id}:
 *   put:
 *     summary: Update lead
 *     tags: [Leads]
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
 *         description: Lead updated successfully
 */
leadRouter.put("/:id", Verify, updateLead);

/**
 * @swagger
 * /lead/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Leads]
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
 *         description: Lead deleted successfully
 */
leadRouter.delete("/:id", Verify, deleteLead);



export default leadRouter;