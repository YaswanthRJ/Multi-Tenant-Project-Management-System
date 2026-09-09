import type { Request, Response } from "express";

import {
  listPermissions,
  setAdminRolePermissions,
  setUserPermissions as updateUserPermissions
} from "./permission.service.js";

export async function list(_req: Request, res: Response) {
  return res.status(200).json(await listPermissions());
}

export async function setUserPermissions(req: Request, res: Response) {
  const id = req.params.id;
  const permissions = req.body?.permissions;

  if (
    typeof id !== "string" ||
    !Array.isArray(permissions) ||
    !permissions.every((permission: unknown) => typeof permission === "string")
  ) {
    return res.status(400).json({
      message: "permissions must be an array of names"
    });
  }

  const result = await updateUserPermissions(
    req.user!,
    id,
    permissions
  );

  if (result === null) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!result) {
    return res.status(400).json({
      message: "One or more permissions do not exist"
    });
  }

  return res.status(200).json({ message: "Permissions updated" });
}

export async function setAdminPermissions(req: Request, res: Response) {
  const permissions = req.body?.permissions;

  if (
    !Array.isArray(permissions) ||
    !permissions.every((permission: unknown) => typeof permission === "string")
  ) {
    return res.status(400).json({
      message: "permissions must be an array of names"
    });
  }

  if (!(await setAdminRolePermissions(permissions))) {
    return res.status(400).json({
      message: "One or more permissions do not exist"
    });
  }

  return res.status(200).json({ message: "Admin permissions updated" });
}