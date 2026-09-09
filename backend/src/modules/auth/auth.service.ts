import type { AuthenticatedUser } from "../../types/auth.js";
import {
  findUserByEmail,
  findUserById
} from "../../repositories/user.repository.js";
import { getEffectivePermissions } from "../../repositories/permission.repository.js";
import { verifyPassword } from "../../utils/password.js";

type DbUser = NonNullable<Awaited<ReturnType<typeof findUserById>>>;

export class AccountDisabledError extends Error {}

async function toAuthenticatedUser(
  user: DbUser
): Promise<AuthenticatedUser> {
  const permissions = await getEffectivePermissions(
    user.id,
    user.role_id
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleId: user.role_id,
    roleName: user.role_name,
    tenantId: user.tenant_id,
    permissions
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.is_disabled) {
    throw new AccountDisabledError();
  }

  if (!(await verifyPassword(password, user.password_hash))) {
    return null;
  }

  return toAuthenticatedUser(user);
}

export async function loadAuthenticatedUser(
  userId: string
): Promise<AuthenticatedUser | null> {
  const user = await findUserById(userId);

  if (!user || user.is_disabled) {
    return null;
  }

  return toAuthenticatedUser(user);
}