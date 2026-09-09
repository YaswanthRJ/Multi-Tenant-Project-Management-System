import * as tenantRepository from "../../repositories/tenant.repository.js";
import type { Tenant } from "../../types/tenant.js";

export async function listTenants(): Promise<Tenant[]> {
  return tenantRepository.findAll();
}

export async function createTenant(name: string): Promise<Tenant> {
  return tenantRepository.create(name);
}