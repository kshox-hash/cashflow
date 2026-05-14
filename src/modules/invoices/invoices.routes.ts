import { Router } from "express";
import { InvoicesDueController } from "./invoices.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", InvoicesDueController.getAll);
router.get("/summary", InvoicesDueController.getSummary);
router.post("/", InvoicesDueController.create);
router.delete("/:id", InvoicesDueController.delete);

export default router;