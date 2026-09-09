import type { RoleName } from "./auth.js";

export type User = {
  id: string;
  name: string;
  email: string;
  roleId: number;
  roleName: RoleName;
  tenantId: string | null;
  isDisabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserInput = {
  name: string;
  email: string;
  role: Exclude<RoleName, "SUPER_ADMIN">;
  tenantId?: string;
  password?: string;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  role?: Exclude<RoleName, "SUPER_ADMIN">;
  password?: string;
  tenantId?: string;
};