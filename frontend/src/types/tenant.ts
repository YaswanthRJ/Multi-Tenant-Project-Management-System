export type Tenant = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantInput = {
  name: string;
};