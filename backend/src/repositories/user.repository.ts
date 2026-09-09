import { query } from "../config/db.js";
import type { RoleName } from "../types/auth.js";
import type {
  User,
  UserInput,
  UserUpdateInput
} from "../types/user.js";

export type UserWithPassword = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role_id: number;
  role_name: RoleName;
  tenant_id: string | null;
  is_disabled: boolean;
};

const userColumns = `
  u.id,
  u.name,
  u.email,
  u.role_id,
  r.name AS role_name,
  u.tenant_id,
  u.is_disabled,
  u.created_at,
  u.updated_at
`;

const userReturningColumns = `
  u.id,
  u.name,
  u.email,
  u.role_id,
  (SELECT roles.name FROM roles WHERE roles.id = u.role_id) AS role_name,
  u.tenant_id,
  u.is_disabled,
  u.created_at,
  u.updated_at
`;

export async function findUserById(
  userId: string
): Promise<UserWithPassword | null> {
  const result = await query<UserWithPassword>(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.password_hash,
      u.role_id,
      r.name AS role_name,
      u.tenant_id,
      u.is_disabled
    FROM users u
    JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(
  email: string
): Promise<UserWithPassword | null> {
  const result = await query<UserWithPassword>(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.password_hash,
      u.role_id,
      r.name AS role_name,
      u.tenant_id,
      u.is_disabled
    FROM users u
    JOIN roles r
      ON r.id = u.role_id
    WHERE LOWER(u.email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  role_id: number;
  role_name: RoleName;
  tenant_id: string | null;
  is_disabled: boolean;
  created_at: Date;
  updated_at: Date;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.role_id,
    roleName: row.role_name,
    tenantId: row.tenant_id,
    isDisabled: row.is_disabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}



export async function findAll(): Promise<User[]> {
  const result = await query<UserRow>(
    `
    SELECT ${userColumns}
    FROM users u
    JOIN roles r ON r.id = u.role_id
    ORDER BY u.created_at DESC
    `
  );

  return result.rows.map(mapUser);
}

export async function findAllByTenantId(tenantId: string): Promise<User[]> {
  const result = await query<UserRow>(
    `
    SELECT ${userColumns}
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.tenant_id = $1
    ORDER BY u.created_at DESC
    `,
    [tenantId]
  );

  return result.rows.map(mapUser);
}

export async function create(
  input: UserInput,
  passwordHash: string,
  tenantId: string
): Promise<User> {
  const inserted = await query<{ id: string }>(
    `
    INSERT INTO users (name, email, password_hash, role_id, tenant_id)
    SELECT $1, $2, $3, r.id, $5
    FROM roles r
    WHERE r.name = $4
    RETURNING id
    `,
    [input.name, input.email, passwordHash, input.role, tenantId]
  );

  const insertedId = inserted.rows[0]?.id;

  if (!insertedId) {
    throw new Error("User creation returned no row");
  }

  const result = await query<UserRow>(
    `
    SELECT ${userReturningColumns}
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    `,
    [insertedId]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error("Created user could not be loaded");
  }

  return mapUser(row);
}

export async function updateById(
  userId: string,
  input: UserUpdateInput,
  passwordHash?: string
): Promise<User | null> {
  const result = await query<UserRow>(
    `
    UPDATE users u
    SET name = COALESCE($1, u.name),
      email = COALESCE($2, u.email),
      role_id = COALESCE((SELECT id FROM roles WHERE name = $3), u.role_id),
        password_hash = COALESCE($4, u.password_hash),
        tenant_id = COALESCE($5, u.tenant_id),
        updated_at = NOW()
    WHERE u.id = $6
    RETURNING ${userReturningColumns}
    `,
    [
      input.name,
      input.email,
      input.role,
      passwordHash ?? null,
      input.tenantId ?? null,
      userId
    ]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateByIdAndTenantId(
  userId: string,
  tenantId: string,
  input: UserUpdateInput,
  passwordHash?: string
): Promise<User | null> {
  const result = await query<UserRow>(
    `
    UPDATE users u
    SET name = COALESCE($1, u.name),
      email = COALESCE($2, u.email),
      role_id = COALESCE((SELECT id FROM roles WHERE name = $3), u.role_id),
        password_hash = COALESCE($4, u.password_hash),
        updated_at = NOW()
    WHERE u.id = $5 AND u.tenant_id = $6
    RETURNING ${userReturningColumns}
    `,
    [input.name, input.email, input.role, passwordHash ?? null, userId, tenantId]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function disableById(
  userId: string,
  disabled: boolean
): Promise<User | null> {
  const result = await query<UserRow>(
    `
    UPDATE users u
    SET is_disabled = $1, updated_at = NOW()
    WHERE u.id = $2
    RETURNING ${userReturningColumns}
    `,
    [disabled, userId]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function disableByIdAndTenantId(
  userId: string,
  tenantId: string,
  disabled: boolean
): Promise<User | null> {
  const result = await query<UserRow>(
    `
    UPDATE users u
    SET is_disabled = $1, updated_at = NOW()
    WHERE u.id = $2 AND u.tenant_id = $3
    RETURNING ${userReturningColumns}
    `,
    [disabled, userId, tenantId]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}