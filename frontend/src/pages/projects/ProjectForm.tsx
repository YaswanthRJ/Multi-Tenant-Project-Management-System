import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/api";
import { createProject, getProject, updateProject } from "../../api/projects.api";
import { PermissionGate } from "../../auth/PermissionGate";
import { useAuth } from "../../auth/AuthProvider";
import { TenantSelect } from "../../components/tenant/TenantSelect";
import type { ProjectStatus } from "../../types/project";

type ProjectFormMode = "create" | "edit";

type ProjectFormProps = {
  mode: ProjectFormMode;
};

const projectStatuses: ProjectStatus[] = ["ACTIVE", "INACTIVE", "DRAFT"];

export function ProjectForm({ mode }: ProjectFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [useCase, setUseCase] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("DRAFT");
  const [tenantId, setTenantId] = useState("");
  const [loadingProject, setLoadingProject] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !id) {
      return;
    }

    let cancelled = false;
    setLoadingProject(true);

    getProject(id)
      .then((project) => {
        if (cancelled) {
          return;
        }

        setName(project.name);
        setAddress(project.address);
        setUseCase(project.useCase);
        setStatus(project.status);
        setTenantId(project.tenantId);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load project");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingProject(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSuperAdmin && !tenantId) {
      setError("Please select a tenant");
      return;
    }

    if (mode === "edit" && !id) {
      setError("Project not found");
      return;
    }

    setSaving(true);

    try {
      const input = {
        name,
        address,
        useCase,
        status,
        ...(isSuperAdmin ? { tenantId } : {}),
      };

      if (mode === "edit") {
        await updateProject(id!, input);
      } else {
        await createProject(input);
      }

      navigate("/projects");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  if (loadingProject) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  const isEditing = mode === "edit";
  const heading = isEditing ? "Edit Project" : "Create Project";
  const description = isEditing ? "Update project details" : "Create a new project";
  const permission = isEditing ? "projects.update" : "projects.create";

  return (
    <PermissionGate permission={permission}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{heading}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-xl rounded-lg border border-gray-200 bg-white p-6"
        >
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="project-name" className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="project-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="project-address" className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="project-address"
              type="text"
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="project-use-case" className="mb-1 block text-sm font-medium text-gray-700">
              Use Case
            </label>
            <input
              id="project-use-case"
              type="text"
              required
              value={useCase}
              onChange={(event) => setUseCase(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="project-status" className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="project-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              {projectStatuses.map((projectStatus) => (
                <option key={projectStatus} value={projectStatus}>
                  {projectStatus}
                </option>
              ))}
            </select>
          </div>

          {isSuperAdmin && (
            <div className="mb-6">
              <label htmlFor="tenant" className="mb-1 block text-sm font-medium text-gray-700">
                Tenant
              </label>
              <TenantSelect
                value={tenantId}
                onChange={setTenantId}
                required
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? (isEditing ? "Saving..." : "Creating...") : isEditing ? "Save" : "Create Project"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </PermissionGate>
  );
}
