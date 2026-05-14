import { Router } from "express";
import { PeopleCostsController } from "./people-costs.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", PeopleCostsController.getAll);
router.get("/summary", PeopleCostsController.getSummary);
router.post("/", PeopleCostsController.create);
router.delete("/:id", PeopleCostsController.delete);

export default router;