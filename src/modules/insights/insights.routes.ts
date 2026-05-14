import { Router } from "express";
import { InsightsController } from "./insights.controller";

const router = Router();

router.get("/", InsightsController.getAll);

export default router;