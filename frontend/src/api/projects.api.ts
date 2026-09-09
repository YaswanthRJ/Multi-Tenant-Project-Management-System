import { del, get, post, put } from "./api";
import type {
  Project,
  ProjectInput,
} from "../types/project";

export function listProjects(): Promise<Project[]> {
  return get<Project[]>("/projects");
}

export function getProject(id: string): Promise<Project> {
  return get<Project>(`/projects/${id}`);
}

export function createProject(
  input: ProjectInput
): Promise<Project> {
  return post<Project>("/projects", input);
}

export function updateProject(
  id: string,
  input: ProjectInput
): Promise<Project> {
  return put<Project>(`/projects/${id}`, input);
}

export function deleteProject(id: string): Promise<void> {
  return del<void>(`/projects/${id}`);
}