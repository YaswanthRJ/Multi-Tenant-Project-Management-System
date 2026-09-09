import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import {
  requirePermission,
  requireSuperAdmin
} from "../../middleware/authorize.js";
import { list, setAdminPermissions } from "./permission.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireSuperAdmin,
  requirePermission("permissions.manage"),
  list
);
router.put(
  "/admin",
  requireAuth,
  requireSuperAdmin,
  requirePermission("permissions.manage"),
  setAdminPermissions
);

export default router;