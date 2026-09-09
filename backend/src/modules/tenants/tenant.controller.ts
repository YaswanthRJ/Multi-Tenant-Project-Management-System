import type { Request, Response } from "express";

import { createTenant, listTenants } from "./tenant.service.js";

export async function list(_req: Request, res: Response) {
  const tenants = await listTenants();
  return res.status(200).json(tenants);
}

export async function create(req: Request, res: Response) {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Tenant name is required"
    });
  }

  const tenant = await createTenant(name.trim());
  return res.status(201).json(tenant);
}