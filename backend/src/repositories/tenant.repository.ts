import { query } from "../config/db.js";
import type { Tenant } from "../types/tenant.js";

type TenantRow = {
  id: string;
  name: string;
  created_at: Date;
};

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.created_at
  };
}

export async function findAll(): Promise<Tenant[]> {
  const result = await query<TenantRow>(
    `
    SELECT id, name, created_at
    FROM tenants
    ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapTenant);
}

export async function findById(id: string): Promise<Tenant | null> {
  const result = await query<TenantRow>(
    `
    SELECT id, name, created_at
    FROM tenants
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ? mapTenant(result.rows[0]) : null;
}

export async function create(name: string): Promise<Tenant> {
  const result = await query<TenantRow>(
    `
    INSERT INTO tenants (name)
    VALUES ($1)
    RETURNING id, name, created_at
    `,
    [name]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Tenant creation returned no row");
  }

  return mapTenant(row);
}