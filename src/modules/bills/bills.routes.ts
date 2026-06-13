import { Router } from "express";
import { BillsController } from "./bills.controller";

const router = Router();

router.get("/", BillsController.getAll);
router.get("/summary", BillsController.getSummary);
router.post("/", BillsController.create);
router.delete("/:id", BillsController.delete);

export default router;
