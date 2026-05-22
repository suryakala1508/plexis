import express from "express";
import {
    saveQuotationDraft,
    getQuotationById,
    getQuotationsByLead,
    updateQuotation,
    updateQuotationDueDate,
    exportQuotationToPdf,
    getPdfStatus,
    sendQuotation,
    deleteQuotation,
    setQuotationSeen,
    setQuotationStatus,
    downloadQuotationPdf,
    autoSaveQuotationDraft,
    autoUpdateQuotation
} from "./quotationController";
import { Verify } from "../../core/middleware";

const quotationRouter = express.Router();

/**
 * @swagger
 * /quotation/draft:
 *   post:
 *     summary: Save quotation draft
 *     tags: [Quotation]
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
 *         description: Quotation draft saved successfully
 */
quotationRouter.post("/draft",Verify, saveQuotationDraft);

/**
 * @swagger
 * /quotation/auto-draft:
 *   post:
 *     summary: Silently auto-save quotation draft without PDF gen
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 */
quotationRouter.post("/auto-draft",Verify, autoSaveQuotationDraft);

/**
 * @swagger
 * /quotation/{quotationId}:
 *   get:
 *     summary: Get quotation by ID (Protected)
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation details
 *       404:
 *         description: Quotation not found
 */
quotationRouter.get("/:quotationId",Verify, getQuotationById);

/**
 * @swagger
 * /quotation/public/{quotationId}:
 *   get:
 *     summary: Get quotation by ID (Public)
 *     tags: [Quotation]
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation details
 */
quotationRouter.get("/public/:quotationId", getQuotationById);

/**
 * @swagger
 * /quotation/lead/{leadId}:
 *   get:
 *     summary: Get quotations by lead ID
 *     tags: [Quotation]
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
 *         description: List of quotations for the lead
 */
quotationRouter.get("/lead/:leadId",Verify, getQuotationsByLead);

/**
 * @swagger
 * /quotation/{quotationId}:
 *   put:
 *     summary: Update quotation
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
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
 *         description: Quotation updated successfully
 */
quotationRouter.put("/:quotationId",Verify, updateQuotation);

/**
 * @swagger
 * /quotation/{quotationId}/auto-update:
 *   put:
 *     summary: Silently update quotation without PDF gen
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 */
quotationRouter.put("/:quotationId/auto-update",Verify, autoUpdateQuotation);

// Lightweight PATCH for updating only the due date / valid until
quotationRouter.patch("/:quotationId/due-date", Verify, updateQuotationDueDate);

/**
 * @swagger
 * /quotation/{quotationId}/export-pdf:
 *   post:
 *     summary: Export quotation to PDF
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: useCache
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Return cached PDF when available. By default export regenerates a fresh PDF.
 *     responses:
 *       200:
 *         description: PDF generated successfully
 */

quotationRouter.post("/:quotationId/export-pdf", Verify, exportQuotationToPdf);
quotationRouter.get("/:quotationId/pdf-status", Verify, getPdfStatus);

/**
 * @swagger
 * /quotation/{quotationId}/download:
 *   get:
 *     summary: Download quotation PDF
 *     tags: [Quotation]
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to PDF URL
 *       404:
 *         description: Quotation or PDF not found
 */
quotationRouter.get("/:quotationId/download", downloadQuotationPdf);

/**
 * @swagger
 * /quotation/{quotationId}/send:
 *   post:
 *     summary: Send quotation
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation sent successfully
 */
quotationRouter.post("/:quotationId/send",Verify, sendQuotation);

/**
 * @swagger
 * /quotation/{quotationId}:
 *   delete:
 *     summary: Delete quotation
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation deleted successfully
 */
quotationRouter.delete("/:quotationId",Verify, deleteQuotation);

/**
 * @swagger
 * /quotation/{id}/seen:
 *   get:
 *     summary: Mark quotation as seen
 *     tags: [Quotation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation marked as seen
 */
quotationRouter.get("/:id/seen", setQuotationSeen);

/**
 * @swagger
 * /quotation/{id}/updatestatus:
 *   get:
 *     summary: Update quotation status
 *     tags: [Quotation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation status updated
 */
quotationRouter.get("/:id/updatestatus", setQuotationStatus);

export default quotationRouter;
