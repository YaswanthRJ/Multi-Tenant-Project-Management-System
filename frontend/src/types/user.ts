import type { Role } from "./auth";

export type User = {
  id: string;
  name: string;
  email: string;
  roleId: number;
  roleName: Role;
  tenantId: string | null;
  isDisabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "AGENT";
  tenantId?: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: "ADMIN" | "AGENT";
  tenantId?: string;
};