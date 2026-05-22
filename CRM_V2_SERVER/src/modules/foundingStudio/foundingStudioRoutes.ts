import express from "express";
import { submitFoundingStudioForm } from "./foundingStudioController";

const foundingStudioRouter = express.Router();

/**
 * @swagger
 * /foundingStudio/submit:
 *   post:
 *     summary: Submit founding studio onboard form
 *     tags: [Founding Studio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studioName
 *               - email
 *               - phone
 *             properties:
 *               studioName:
 *                 type: string
 *                 description: Name of the studio
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *               phone:
 *                 type: string
 *                 description: 10-digit phone number
 *               location:
 *                 type: string
 *                 description: Studio location (optional)
 *               instagramHandle:
 *                 type: string
 *                 description: Instagram handle (optional)
 *               demoCallOptIn:
 *                 type: boolean
 *                 description: Whether interested in demo call
 *     responses:
 *       200:
 *         description: Form submitted successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
foundingStudioRouter.post("/submit", submitFoundingStudioForm);

export default foundingStudioRouter;
