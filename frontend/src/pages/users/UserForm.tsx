import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { createUser, listUsers, updateUser } from "../../api/users.api";
import { ApiError } from "../../api/api";
import { TenantSelect } from "../../components/tenant/TenantSelect";

type UserFormMode = "create" | "edit";

type UserFormProps = {
  mode: UserFormMode;
  /** Fixed role for create flows ("Create Admin" / "Create Agent"). Ignored in edit mode. */
  fixedRole?: "ADMIN" | "AGENT";
};

export function UserForm({ mode, fixedRole }: UserFormProps) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "AGENT">(fixedRole ?? "AGENT");
  const [tenantId, setTenantId] = useState("");

  const [loadingUser, setLoadingUser] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbiddenReason, setForbiddenReason] = useState<string | null>(
    mode === "create" && fixedRole === "ADMIN" && !isSuperAdmin
      ? "You do not have permission to create an Admin user."
      : null
  );

  // Tenant selection is only relevant for Super Admin.
  const showTenantField = isSuperAdmin;
  // Role is only editable by Super Admin, when editing an existing user.
  const showRoleField = mode === "edit" && isSuperAdmin;

  useEffect(() => {
    if (mode !== "edit" || !id) {
      return;
    }

    let cancelled = false;
    setLoadingUser(true);

    listUsers()
      .then((users) => {
        if (cancelled) {
          return;
        }
        const existing = users.find((candidate) => candidate.id === id);
        if (!existing) {
          setError("User not found");
          return;
        }
        if (existing.roleName === "SUPER_ADMIN") {
          setForbiddenReason("This user cannot be edited here.");
          return;
        }
        if (!isSuperAdmin && existing.roleName === "ADMIN") {
          setForbiddenReason("You do not have permission to edit this user.");
          return;
        }
        setName(existing.name);
        setEmail(existing.email);
        setRole(existing.roleName === "ADMIN" ? "ADMIN" : "AGENT");
        setTenantId(existing.tenantId ?? "");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load user");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingUser(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, id]);

  const heading =
    mode === "edit" ? "Edit User" : fixedRole === "ADMIN" ? "Create Admin" : "Create Agent";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (mode === "create") {
        await createUser({
          name,
          email,
          password,
          role: fixedRole ?? "AGENT",
          tenantId: isSuperAdmin ? tenantId || undefined : undefined,
        });
      } else if (id) {
        await updateUser(id, {
          name,
          email,
          password: password || undefined,
          role: isSuperAdmin ? role : undefined,
          tenantId: isSuperAdmin ? tenantId || undefined : undefined,
        });
      }

      navigate("/users");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  if (loadingUser) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  if (forbiddenReason) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {forbiddenReason}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{heading}</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md rounded-lg border border-gray-200 bg-white p-6"
      >
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password{mode === "edit" && " (leave blank to keep current)"}
          </label>
          <input
            id="password"
            type="password"
            required={mode === "create"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>

        {showRoleField && (
          <div className="mb-4">
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as "ADMIN" | "AGENT")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="AGENT">AGENT</option>
            </select>
          </div>
        )}

        {showTenantField && (
          <div className="mb-6">
            <label htmlFor="tenant" className="mb-1 block text-sm font-medium text-gray-700">
              Tenant
            </label>
            <TenantSelect
              value={tenantId}
              onChange={setTenantId}
              required
              allowCreate={mode === "create" && isSuperAdmin}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? (mode === "create" ? "Creating..." : "Saving...") : "Save"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/users")}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
