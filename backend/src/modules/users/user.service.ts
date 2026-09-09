import * as userRepository from "../../repositories/user.repository.js";
import type { AuthenticatedUser } from "../../types/auth.js";
import type {
  User,
  UserInput,
  UserUpdateInput
} from "../../types/user.js";
import { hashPassword } from "../../utils/password.js";

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.roleName === "SUPER_ADMIN" && user.tenantId === null;
}

function isTenantAdmin(user: AuthenticatedUser): boolean {
  return user.roleName === "ADMIN" && user.tenantId !== null;
}

export async function listUsers(
  user: AuthenticatedUser
): Promise<User[]> {
  if (isSuperAdmin(user)) {
    return userRepository.findAll();
  }

  return userRepository.findAllByTenantId(user.tenantId!);
}

export async function createUser(
  user: AuthenticatedUser,
  input: UserInput
): Promise<User> {
  if (!isSuperAdmin(user) && input.role !== "AGENT") {
    throw new Error("FORBIDDEN");
  }

  const tenantId = isSuperAdmin(user)
    ? input.tenantId
    : user.tenantId;

  if (!tenantId) {
    throw new Error("Tenant is required");
  }

  const passwordHash = await hashPassword(input.password!);

  return userRepository.create(
    input,
    passwordHash,
    tenantId
  );
}

export async function updateUser(
  user: AuthenticatedUser,
  id: string,
  input: UserUpdateInput
): Promise<User | null> {
  const target = await userRepository.findUserById(id);

  if (!target || (!isSuperAdmin(user) && target.tenant_id !== user.tenantId)) {
    return null;
  }

  if (
    target.role_name === "SUPER_ADMIN" ||
    (isTenantAdmin(user) && target.role_name !== "AGENT")
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!isSuperAdmin(user)) {
    if (input.role && input.role !== "AGENT") {
      throw new Error("FORBIDDEN");
    }

    if (input.tenantId !== undefined) {
      throw new Error("FORBIDDEN");
    }
  }

  const passwordHash = input.password
    ? await hashPassword(input.password)
    : undefined;

  if (isSuperAdmin(user)) {
    return userRepository.updateById(
      id,
      input,
      passwordHash
    );
  }

  return userRepository.updateByIdAndTenantId(
    id,
    user.tenantId!,
    input,
    passwordHash
  );
}

export async function disableUser(
  user: AuthenticatedUser,
  id: string,
  disabled: boolean
): Promise<User | null> {
  const target = await userRepository.findUserById(id);

  if (!target || (!isSuperAdmin(user) && target.tenant_id !== user.tenantId)) {
    return null;
  }

  if (
    target.role_name === "SUPER_ADMIN" ||
    (isTenantAdmin(user) && target.role_name !== "AGENT")
  ) {
    throw new Error("FORBIDDEN");
  }

  if (isSuperAdmin(user)) {
    return userRepository.disableById(id, disabled);
  }

  return userRepository.disableByIdAndTenantId(
    id,
    user.tenantId!,
    disabled
  );
}
