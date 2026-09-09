import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/api";
import { listProjects } from "../../api/projects.api";
import { PermissionGate } from "../../auth/PermissionGate";
import { type DataTableColumn, DataTable } from "../../components/table/DataTable";
import type { ProjectStatus, Project } from "../../types/project";


const STATUS_STYLES: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
  DRAFT: "bg-yellow-100 text-yellow-700",
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoading(true);
      setError(null);

      try {
        const data = await listProjects();
        if (!cancelled) {
          setProjects(data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Failed to load projects");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns: DataTableColumn<Project>[] = [
    { key: "name", header: "Name" },
    { key: "address", header: "Address" },
    { key: "useCase", header: "Use Case" },
    {
      key: "status",
      header: "Status",
      render: (project) => <StatusBadge status={project.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (project) => (
        <PermissionGate permission="projects.update">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/projects/${project.id}/edit`);
            }}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Edit
          </button>
        </PermissionGate>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">Manage your projects</p>
        </div>

        <PermissionGate permission="projects.create">
          <button
            type="button"
            onClick={() => navigate("/projects/new")}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Create Project
          </button>
        </PermissionGate>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        emptyMessage="No projects found"
        onRowClick={(project) => navigate(`/projects/${project.id}`)}
      />
    </div>
  );
}
