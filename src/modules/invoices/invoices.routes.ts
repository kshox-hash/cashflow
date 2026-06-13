import { Router } from "express";
import { InvoicesDueController } from "./invoices.controller";

const router = Router();

router.get("/", InvoicesDueController.getAll);
router.get("/summary", InvoicesDueController.getSummary);
router.post("/", InvoicesDueController.create);
router.delete("/:id", InvoicesDueController.delete);

export default router;
