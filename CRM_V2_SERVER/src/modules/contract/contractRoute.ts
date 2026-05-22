import express from "express";
import {
    createContractFromQuotation,
    exportContractToPdf,
    saveContractDraft,
    getContractById,
    getContractsByLead,
    updateContract,
    deleteContract,
    sendContract
} from "./contractController";
import { Verify } from "../../core/middleware";

const contractRouter = express.Router();

// Contract CRUD operations
contractRouter.post("/draft", Verify, saveContractDraft);
contractRouter.get("/lead/:leadId", Verify, getContractsByLead);   // ← must be before /:contractId
contractRouter.get("/:contractId", Verify, getContractById);
contractRouter.put("/:contractId", Verify, updateContract);
contractRouter.delete("/:contractId", Verify, deleteContract);

contractRouter.post("/:contractId/export-pdf", Verify, exportContractToPdf);
contractRouter.post("/:contractId/send", Verify, sendContract);

// Legacy/existing routes
contractRouter.post("/from-quotation/:quotationId", Verify, createContractFromQuotation);
contractRouter.post("/export-pdf", Verify, exportContractToPdf);

export default contractRouter;
