import * as projectRepository from "../../repositories/project.repository.js";
import type { AuthenticatedUser } from "../../types/auth.js";
import type {
  Project,
  ProjectInput,
  ProjectUpdateInput
} from "../../types/project.js";

function isSuperAdmin(user: AuthenticatedUser): boolean {
  return user.tenantId === null;
}

type CreateProjectInput = ProjectInput & {
  tenantId?: string;
};

export async function listProjects(
  user: AuthenticatedUser
): Promise<Project[]> {
  if (isSuperAdmin(user)) {
    return projectRepository.findAll();
  }

  return projectRepository.findAllByTenantId(user.tenantId!);
}

export async function getProject(
  user: AuthenticatedUser,
  id: string
): Promise<Project | null> {
  if (isSuperAdmin(user)) {
    return projectRepository.findById(id);
  }

  return projectRepository.findByIdAndTenantId(id, user.tenantId!);
}

export async function createProject(
  user: AuthenticatedUser,
  input: CreateProjectInput
): Promise<Project> {
  const tenantId = user.tenantId ?? input.tenantId;

  if (!tenantId) {
    throw new Error("Tenant is required");
  }

  return projectRepository.create(tenantId, input);
}

export async function updateProject(
  user: AuthenticatedUser,
  id: string,
  input: ProjectUpdateInput
): Promise<Project | null> {
  if (isSuperAdmin(user)) {
    return projectRepository.updateById(id, input);
  }

  return projectRepository.updateByIdAndTenantId(
    id,
    user.tenantId!,
    input
  );
}

export async function deleteProject(
  user: AuthenticatedUser,
  id: string
): Promise<boolean> {
  if (isSuperAdmin(user)) {
    return projectRepository.deleteById(id);
  }

  return projectRepository.deleteByIdAndTenantId(
    id,
    user.tenantId!
  );
}