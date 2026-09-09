export type ProjectStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type Project = {
  id: string;
  name: string;
  address: string;
  useCase: string;
  status: ProjectStatus;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectInput = {
  name: string;
  address: string;
  useCase: string;
  status: ProjectStatus;
};

export type ProjectUpdateInput = ProjectInput & {
  tenantId?: string;
};