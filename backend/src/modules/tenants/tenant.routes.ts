import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { requireSuperAdmin } from "../../middleware/authorize.js";
import { create, list } from "./tenant.controller.js";

const router = Router();

router.get("/", requireAuth, requireSuperAdmin, list);
router.post("/", requireAuth, requireSuperAdmin, create);

export default router;