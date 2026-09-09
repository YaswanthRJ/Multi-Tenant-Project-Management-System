import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type DataTableColumn } from "../../components/table/DataTable";
import { PermissionGate } from "../../auth/PermissionGate";
import { useAuth } from "../../auth/AuthProvider";
import { ApiError } from "../../api/api";
import { listUsers, disableUser } from "../../api/users.api";
import { listTenants } from "../../api/tenants.api";
import type { Tenant } from "../../types/tenant";
import type { User } from "../../types/user";

type UserRole = User["roleName"];

const ROLE_STYLES: Record<"ADMIN" | "AGENT", string> = {
  ADMIN: "bg-blue-100 text-blue-700",
  AGENT: "bg-purple-100 text-purple-700",
};

function RoleBadge({ role }: { role: UserRole }) {
  if (role !== "ADMIN" && role !== "AGENT") {
    return <span className="text-xs text-gray-500">{role}</span>;
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${ROLE_STYLES[role]}`}>
      {role}
    </span>
  );
}

function StatusBadge({ isDisabled }: { isDisabled: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        isDisabled ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
      }`}
    >
      {isDisabled ? "Disabled" : "Active"}
    </span>
  );
}

/** Business rule: who can be edited/disabled by the current user, regardless of raw permission flags. */
function canManageTarget(
  currentRole: string | undefined,
  targetRole: UserRole
): boolean {
  if (currentRole === "SUPER_ADMIN") {
    return targetRole !== "SUPER_ADMIN";
  }
  if (currentRole === "ADMIN") {
    return targetRole === "AGENT";
  }
  return false;
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [usersData, tenantsData] = await Promise.all([
          listUsers(),
          isSuperAdmin ? listTenants() : Promise.resolve<Tenant[]>([]),
        ]);

        if (!cancelled) {
          setUsers(usersData);
          setTenants(tenantsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const tenantNameById = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach((tenant) => map.set(tenant.id, tenant.name));
    return map;
  }, [tenants]);

  async function handleToggleDisabled(targetUser: User) {
    const action = targetUser.isDisabled ? "enable" : "disable";
    const confirmed = window.confirm(`Are you sure you want to ${action} ${targetUser.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      const updated = await disableUser(targetUser.id, !targetUser.isDisabled);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${action} user`);
    }
  }

  const columns: DataTableColumn<User>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (targetUser) => <RoleBadge role={targetUser.roleName} />,
    },
    ...(isSuperAdmin
      ? [
          {
            key: "tenant",
            header: "Tenant",
            render: (targetUser: User) =>
              targetUser.tenantId ? tenantNameById.get(targetUser.tenantId) ?? "—" : "—",
          } satisfies DataTableColumn<User>,
        ]
      : []),
    {
      key: "status",
      header: "Status",
      render: (targetUser) => <StatusBadge isDisabled={targetUser.isDisabled} />,
    },
    {
      key: "actions",
      header: "",
      render: (targetUser) => {
        const manageable = canManageTarget(currentUser?.role, targetUser.roleName);
        if (!manageable) {
          return null;
        }

        return (
          <div className="flex items-center gap-3">
            <PermissionGate permission="users.update">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/users/${targetUser.id}/edit`);
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Edit
              </button>
            </PermissionGate>

            <PermissionGate permission="users.disable">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleDisabled(targetUser);
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {targetUser.isDisabled ? "Enable" : "Disable"}
              </button>
            </PermissionGate>

            <PermissionGate permission="permissions.manage">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/users/${targetUser.id}/permissions`);
                }}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Permissions
              </button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage users and their access</p>
        </div>

        <div className="flex items-center gap-3">
          <PermissionGate permission="users.create">
            <>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => navigate("/users/new/admin")}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Create Admin
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate("/users/new/agent")}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Create Agent
              </button>
            </>
          </PermissionGate>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
    </div>
  );
}
