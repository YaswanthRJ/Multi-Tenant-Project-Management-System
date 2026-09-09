import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { create, disable, list, update } from "./user.controller.js";
import {
  getUserPermissions,
  setUserPermissions
} from "../permissions/permission.controller.js";

const router = Router();

router.get("/", requireAuth, requirePermission("users.read"), list);
router.post("/", requireAuth, requirePermission("users.create"), create);
router.put("/:id", requireAuth, requirePermission("users.update"), update);
router.patch(
  "/:id/disable",
  requireAuth,
  requirePermission("users.disable"),
  disable
);
router.put(
  "/:id/permissions",
  requireAuth,
  requirePermission("permissions.manage"),
  setUserPermissions
);
router.get(
  "/:id/permissions",
  requireAuth,
  requirePermission("permissions.manage"),
  getUserPermissions
);

export default router;