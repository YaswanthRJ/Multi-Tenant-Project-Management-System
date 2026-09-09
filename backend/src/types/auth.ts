export type RoleName = "SUPER_ADMIN" | "ADMIN" | "AGENT";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  roleId: number;
  roleName: RoleName;
  tenantId: string | null;
  permissions: string[];
};

export type DashboardStats = {
  projects?: number;
  tenants?: number;
  users?: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}