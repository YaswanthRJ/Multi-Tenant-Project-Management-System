import {
  findAllPermissions,
  findPermissionIdsByNames,
  replaceRolePermissions,
  replaceUserPermissions
} from "../../repositories/permission.repository.js";
import { findUserById } from "../../repositories/user.repository.js";
import type { AuthenticatedUser } from "../../types/auth.js";
import type { Permission } from "../../repositories/permission.repository.js";

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roleName === "SUPER_ADMIN" && user.tenantId === null;
}

export async function listPermissions(): Promise<Permission[]> {
  return findAllPermissions();
}

export async function setAdminRolePermissions(
  names: string[]
): Promise<boolean> {
  const uniqueNames = [...new Set(names)];
  const permissionIds = await findPermissionIdsByNames(uniqueNames);

  if (permissionIds.length !== uniqueNames.length) {
    return false;
  }

  await replaceRolePermissions("ADMIN", permissionIds);
  return true;
}

export async function setUserPermissions(
  user: AuthenticatedUser,
  targetUserId: string,
  names: string[]
): Promise<boolean | null> {
  const target = await findUserById(targetUserId);

  if (
    !target ||
    (!isSuperAdmin(user) && target.tenant_id !== user.tenantId)
  ) {
    return null;
  }

  const uniqueNames = [...new Set(names)];
  const permissionIds = await findPermissionIdsByNames(uniqueNames);

  if (permissionIds.length !== uniqueNames.length) {
    return false;
  }

  await replaceUserPermissions(targetUserId, permissionIds);
  return true;
}