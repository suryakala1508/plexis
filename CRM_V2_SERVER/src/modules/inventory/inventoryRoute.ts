import express from  "express";
import { getInventoryItems,addInventoryItem,updateInventoryItem,assignInventoryItem,deleteInventoryItem, batchAssignInventory } from "./inventoryController";

const InventoryRouter= express.Router();

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inventory items
 */
InventoryRouter.get("/",getInventoryItems);

/**
 * @swagger
 * /inventory/add:
 *   post:
 *     summary: Add new inventory item
 *     tags: [Inventory]
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
 *         description: Inventory item added successfully
 */
InventoryRouter.post("/add",addInventoryItem);

/**
 * @swagger
 * /inventory/assign:
 *   post:
 *     summary: Assign inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Inventory item assigned successfully
 */
InventoryRouter.post("/assign",assignInventoryItem);
InventoryRouter.post("/batch-assign", batchAssignInventory);

/**
 * @swagger
 * /inventory/update:
 *   post:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 */
InventoryRouter.post("/update",updateInventoryItem);

/**
 * @swagger
 * /inventory/delete:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 */
InventoryRouter.delete("/delete/:itemId",deleteInventoryItem);


export default InventoryRouter;