import express from "express"
import { Verify } from "../../core/middleware"
// import {
//   createTicket,
//   getMyTickets,
// } from "./ticketController"
import { createTicket ,getMyTickets} from "./ticketController"

const ticketRouter = express.Router()

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
ticketRouter.post(
  "/",
  Verify,
  createTicket
)

/**
 * @swagger
 * /tickets/my-tickets:
 *   get:
 *     summary: Get my tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's tickets
 */
ticketRouter.get(
  "/my-tickets",
  Verify,
  getMyTickets
)

export default ticketRouter
