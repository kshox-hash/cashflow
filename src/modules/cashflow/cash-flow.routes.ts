import { Router } from "express";
import { CashFlowController } from "./cash-flow.controller";

const router = Router();

router.get("/summary", CashFlowController.getSummary);
router.get("/movements", CashFlowController.getMovements);
router.post("/movements", CashFlowController.createMovement);
router.delete("/movements/:id", CashFlowController.deleteMovement);

export default router;
