export type Role = "SUPER_ADMIN" | "ADMIN" | "AGENT";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
  permissions: string[];
};

export type DashboardStats = {
  users?: number;
  projects?: number;
  tenants?: number;
};