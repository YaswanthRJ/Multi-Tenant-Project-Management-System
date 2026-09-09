import type { AuthenticatedUser, DashboardStats } from "../../types/auth.js";
import {
  findUserByEmail,
  findUserById
} from "../../repositories/user.repository.js";
import * as userRepository from "../../repositories/user.repository.js";
import * as projectRepository from "../../repositories/project.repository.js";
import * as tenantRepository from "../../repositories/tenant.repository.js";
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

export async function dashboardStats(
  user: AuthenticatedUser
): Promise<DashboardStats> {
  if (user.roleName === "SUPER_ADMIN") {
    const [users, projects, tenants] = await Promise.all([
      userRepository.countAll(),
      projectRepository.countAll(),
      tenantRepository.count()
    ]);

    return { users, projects, tenants };
  }

  if (user.roleName === "ADMIN") {
    const [users, projects] = await Promise.all([
      userRepository.countByTenantId(user.tenantId!),
      projectRepository.countByTenantId(user.tenantId!)
    ]);

    return { users, projects };
  }

  return {
    projects: await projectRepository.countByTenantId(user.tenantId!)
  };
}