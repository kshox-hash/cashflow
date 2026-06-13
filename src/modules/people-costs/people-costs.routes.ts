import { Router } from "express";
import { PeopleCostsController } from "./people-costs.controller";

const router = Router();

router.get("/", PeopleCostsController.getAll);
router.get("/summary", PeopleCostsController.getSummary);
router.post("/", PeopleCostsController.create);
router.delete("/:id", PeopleCostsController.delete);

export default router;
