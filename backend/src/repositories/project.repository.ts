import { query } from "../config/db.js";
import type {
  Project,
  ProjectInput,
  ProjectUpdateInput
} from "../types/project.js";

type ProjectRow = {
  id: string;
  name: string;
  address: string;
  use_case: string;
  status: Project["status"];
  tenant_id: string;
  created_at: Date;
  updated_at: Date;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    useCase: row.use_case,
    status: row.status,
    tenantId: row.tenant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const projectColumns = `
  id,
  name,
  address,
  use_case,
  status,
  tenant_id,
  created_at,
  updated_at
`;

export async function findAll(): Promise<Project[]> {
  const result = await query<ProjectRow>(
    `SELECT ${projectColumns} FROM projects ORDER BY created_at DESC`
  );

  return result.rows.map(mapProject);
}

export async function findAllByTenantId(tenantId: string): Promise<Project[]> {
  const result = await query<ProjectRow>(
    `SELECT ${projectColumns} FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows.map(mapProject);
}

export async function findById(id: string): Promise<Project | null> {
  const result = await query<ProjectRow>(
    `SELECT ${projectColumns} FROM projects WHERE id = $1 LIMIT 1`,
    [id]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function findByIdAndTenantId(
  id: string,
  tenantId: string
): Promise<Project | null> {
  const result = await query<ProjectRow>(
    `SELECT ${projectColumns} FROM projects WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
    [id, tenantId]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function create(
  tenantId: string,
  input: ProjectInput
): Promise<Project> {
  const result = await query<ProjectRow>(
    `
    INSERT INTO projects (name, address, use_case, status, tenant_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${projectColumns}
    `,
    [input.name, input.address, input.useCase, input.status, tenantId]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Project creation returned no row");
  }

  return mapProject(row);
}

export async function updateById(
  id: string,
  input: ProjectUpdateInput
): Promise<Project | null> {
  const result = await query<ProjectRow>(
    `
    UPDATE projects
    SET name = $1, address = $2, use_case = $3, status = $4,
      tenant_id = COALESCE($5, tenant_id), updated_at = NOW()
    WHERE id = $6
    RETURNING ${projectColumns}
    `,
    [input.name, input.address, input.useCase, input.status, input.tenantId ?? null, id]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function updateByIdAndTenantId(
  id: string,
  tenantId: string,
  input: ProjectInput
): Promise<Project | null> {
  const result = await query<ProjectRow>(
    `
    UPDATE projects
    SET name = $1, address = $2, use_case = $3, status = $4, updated_at = NOW()
    WHERE id = $5 AND tenant_id = $6
    RETURNING ${projectColumns}
    `,
    [input.name, input.address, input.useCase, input.status, id, tenantId]
  );

  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function deleteById(id: string): Promise<boolean> {
  const result = await query("DELETE FROM projects WHERE id = $1", [id]);
  return result.rowCount === 1;
}

export async function deleteByIdAndTenantId(
  id: string,
  tenantId: string
): Promise<boolean> {
  const result = await query(
    "DELETE FROM projects WHERE id = $1 AND tenant_id = $2",
    [id, tenantId]
  );

  return result.rowCount === 1;
}

export async function tenantExists(tenantId: string): Promise<boolean> {
  const result = await query<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM tenants WHERE id = $1) AS exists",
    [tenantId]
  );

  return result.rows[0]?.exists === true;
}