import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import {
  requireAdminOrSuperAdmin,
  requirePermission
} from "../../middleware/authorize.js";
import { create, disable, list, update } from "./user.controller.js";
import {
  getUserPermissions,
  setUserPermissions
} from "../permissions/permission.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("users.read"),
  list
);
router.post(
  "/",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("users.create"),
  create
);
router.put(
  "/:id",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("users.update"),
  update
);
router.patch(
  "/:id/disable",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("users.disable"),
  disable
);
router.put(
  "/:id/permissions",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("permissions.manage"),
  setUserPermissions
);
router.get(
  "/:id/permissions",
  requireAuth,
  requireAdminOrSuperAdmin,
  requirePermission("permissions.manage"),
  getUserPermissions
);

export default router;