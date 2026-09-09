import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { list, setAdminPermissions } from "./permission.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requirePermission("permissions.manage"),
  list
);
router.put(
  "/admin",
  requireAuth,
  requirePermission("permissions.manage"),
  setAdminPermissions
);

export default router;