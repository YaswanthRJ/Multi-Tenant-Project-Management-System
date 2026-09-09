import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { PermissionGate } from "../../auth/PermissionGate";

const USER_MANAGEMENT_PERMISSIONS = [
  "users.read",
  "users.create",
  "users.update",
  "users.disable",
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2.5",
    "text-sm font-medium transition-colors",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export function Sidebar() {
  const { user } = useAuth();

  const canAccessUsers = user?.permissions.some((permission) =>
    USER_MANAGEMENT_PERMISSIONS.includes(permission)
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <div className="text-base font-semibold tracking-tight text-slate-900">
            Project Management
          </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          <NavLink to="/" end className={navLinkClass}>
            <DashboardIcon />
            <span>Dashboard</span>
          </NavLink>

          <PermissionGate permission="projects.read">
            <NavLink to="/projects" className={navLinkClass}>
              <ProjectsIcon />
              <span>Projects</span>
            </NavLink>
          </PermissionGate>

          {canAccessUsers && (
            <NavLink to="/users" className={navLinkClass}>
              <UsersIcon />
              <span>Users</span>
            </NavLink>
          )}

          {user?.role === "SUPER_ADMIN" && (
            <NavLink to="/tenants" className={navLinkClass}>
              <TenantsIcon />
              <span>Tenants</span>
            </NavLink>
          )}

          <PermissionGate permission="permissions.manage">
            <NavLink to="/permissions" className={navLinkClass}>
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>Permissions</span>
            </NavLink>
          </PermissionGate>
        </div>
      </nav>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 7h6l2 2h10v10H3V7Z" />
      <path d="M3 7V5h7l2 2" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M18 14.2a6 6 0 0 1 3 5.2" />
    </svg>
  );
}

function TenantsIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M4 21V5l8-2v18" />
      <path d="M12 8h8v13" />
      <path d="M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2" />
    </svg>
  );
}