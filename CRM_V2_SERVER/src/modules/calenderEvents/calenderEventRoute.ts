import express from 'express';
import { createCalenderEvent, getCalenderEvents, updateCalenderEvent, deleteCalenderEvent } from './calenderEventController';


const calenderEventRouter = express.Router();

/**
 * @swagger
 * /events/calendar:
 *   get:
 *     summary: Get all calendar events
 *     tags: [Calendar Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all calendar events
 */
calenderEventRouter.get('/', getCalenderEvents);

/**
 * @swagger
 * /events/calendar/addCalendarEvent:
 *   post:
 *     summary: Create calendar event
 *     tags: [Calendar Events]
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
 *         description: Calendar event created successfully
 */
calenderEventRouter.post('/addCalendarEvent', createCalenderEvent);

/**
 * @swagger
 * /events/calendar/updateCalendarEvent/{id}:
 *   post:
 *     summary: Update calendar event
 *     tags: [Calendar Events]
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
 *         description: Calendar event updated successfully
 */
calenderEventRouter.post('/updateCalendarEvent/:id', updateCalenderEvent);

/**
 * @swagger
 * /events/calendar/deleteCalendarEvent/{id}:
 *   post:
 *     summary: Delete calendar event
 *     tags: [Calendar Events]
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
 *         description: Calendar event deleted successfully
 */
calenderEventRouter.post('/deleteCalendarEvent/:id', deleteCalenderEvent);


export default calenderEventRouter;