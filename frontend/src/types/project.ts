export type ProjectStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type Project = {
  id: string;
  name: string;
  address: string;
  useCase: string;
  status: ProjectStatus;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  name: string;
  address: string;
  useCase: string;
  status: ProjectStatus;
  tenantId?: string;
};