import express from 'express';
import multer from 'multer';
import {getExpenses,addExpense,updateExpense,deleteExpense,getExpenseOptions, getExpenseSummary, uploadExpenseScreenshots} from "./expensesController"


const ExpenseRouter = express.Router();

const screenshotUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: Get all expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all expenses
 */
ExpenseRouter.post('/upload-screenshots', screenshotUpload.array('screenshots', 20), uploadExpenseScreenshots);
ExpenseRouter.get('/',getExpenses);
ExpenseRouter.get('/summary', getExpenseSummary);

/**
 * @swagger
 * /expenses/options:
 *   get:
 *     summary: Get project and crew options for expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects and crew
 */
ExpenseRouter.get('/options', getExpenseOptions);

/**
 * @swagger
 * /expenses/addExpense:
 *   post:
 *     summary: Add new expense
 *     tags: [Expenses]
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
 *         description: Expense added successfully
 */
ExpenseRouter.post('/addExpense',addExpense);

/**
 * @swagger
 * /expenses/updateExpense/{id}:
 *   post:
 *     summary: Update expense
 *     tags: [Expenses]
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
 *         description: Expense updated successfully
 */
ExpenseRouter.post('/updateExpense/:id',updateExpense);

/**
 * @swagger
 * /expenses/deleteExpense/{id}:
 *   post:
 *     summary: Delete expense
 *     tags: [Expenses]
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
 *         description: Expense deleted successfully
 */
ExpenseRouter.post('/deleteExpense/:id',deleteExpense);


export default ExpenseRouter;