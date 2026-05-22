
import express from "express";
import { Verify } from "../../core/middleware";
import { getPaymentDues, projectNames } from "./paymentController";

const router = express.Router();

// Get all payment dues
router.get("/dues", Verify, getPaymentDues);

// Get all project names
router.get("/projectNames", Verify, projectNames);

export default router;
