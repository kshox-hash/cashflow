import { Router } from "express";
import { BillsController } from "./bills.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", BillsController.getAll);
router.get("/summary", BillsController.getSummary);
router.post("/", BillsController.create);
router.delete("/:id", BillsController.delete);

export default router;