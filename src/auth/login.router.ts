import { Router } from "express";

import {
  loginController,
} from "../auth/login.controller";

const router = Router();

router.post("/login", loginController);

export default router;