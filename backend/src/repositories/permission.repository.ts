import { pool, query } from "../config/db.js";

export type Permission = {
  id: number;
  name: string;
  description: string | null;
};

export async function findAllPermissions(): Promise<Permission[]> {
  const result = await query<Permission>(
    "SELECT id, name, description FROM permissions ORDER BY id"
  );

  return result.rows;
}

export async function findPermissionIdsByNames(
  names: string[]
): Promise<number[]> {
  const result = await query<{ id: number }>(
    "SELECT id FROM permissions WHERE name = ANY($1::text[])",
    [names]
  );

  return result.rows.map((row) => row.id);
}

export async function replaceUserPermissions(
  userId: string,
  permissionIds: number[]
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM user_permissions WHERE user_id = $1", [
      userId
    ]);

    if (permissionIds.length > 0) {
      await client.query(
        `
        INSERT INTO user_permissions (user_id, permission_id)
        SELECT $1, unnest($2::integer[])
        `,
        [userId, permissionIds]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getEffectivePermissions(
  userId: string,
  roleId: number
): Promise<string[]> {
  const result = await query<{ name: string }>(
    `
    SELECT DISTINCT p.name
    FROM permissions p
    WHERE p.id IN (
      SELECT permission_id
      FROM role_permissions
      WHERE role_id = $1

      UNION

      SELECT permission_id
      FROM user_permissions
      WHERE user_id = $2
    )
    ORDER BY p.name
    `,
    [roleId, userId]
  );

  return result.rows.map((row) => row.name);
}

export async function replaceRolePermissions(
  roleName: string,
  permissionIds: number[]
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `
      DELETE FROM role_permissions
      WHERE role_id = (SELECT id FROM roles WHERE name = $1)
      `,
      [roleName]
    );

    if (permissionIds.length > 0) {
      await client.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, unnest($2::integer[])
        FROM roles r
        WHERE r.name = $1
        `,
        [roleName, permissionIds]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}