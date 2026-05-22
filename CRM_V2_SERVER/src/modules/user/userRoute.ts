import express from "express";
import { getUser, deleteAccount } from "./userController";

const userRouter = express.Router();

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       401:
 *         description: Unauthorized
 */
userRouter.get("/",getUser);

/**
 * @swagger
 * /user/delete-account:
 *   post:
 *     summary: Delete user account and all associated data
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for account deletion
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
userRouter.post("/delete-account", deleteAccount);

export default userRouter;