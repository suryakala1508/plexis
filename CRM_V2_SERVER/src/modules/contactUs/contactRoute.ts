import express from "express";
import { sendMessage } from "./contactController";

const contactRouter = express.Router();

/**
 * @swagger
 * /contactus/send-message:
 *   post:
 *     summary: Send contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
contactRouter.post("/send-message", sendMessage);

export default contactRouter;

