import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/authorize.js";
import { create, get, list, remove, update } from "./project.controller.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requirePermission("projects.create"),
  create
);
router.get(
  "/",
  requireAuth,
  requirePermission("projects.read"),
  list
);
router.get(
  "/:id",
  requireAuth,
  requirePermission("projects.read"),
  get
);
router.put(
  "/:id",
  requireAuth,
  requirePermission("projects.update"),
  update
);
router.delete(
  "/:id",
  requireAuth,
  requirePermission("projects.delete"),
  remove
);

export default router;