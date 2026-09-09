import { get, post } from "./api";
import type {
  CreateTenantInput,
  Tenant,
} from "../types/tenant";

export function listTenants(): Promise<Tenant[]> {
  return get<Tenant[]>("/tenants");
}

export function createTenant(
  input: CreateTenantInput
): Promise<Tenant> {
  return post<Tenant>("/tenants", input);
}