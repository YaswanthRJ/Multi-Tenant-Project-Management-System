import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getUserPermissions,
  listPermissions,
  updateUserPermissions,
} from "../../api/permissions.api";
import { ApiError } from "../../api/api";
import { listUsers } from "../../api/users.api";
import { PermissionGate } from "../../auth/PermissionGate";
import type { Permission } from "../../types/permission";
import type { User } from "../../types/user";

export function ManagePermissions() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPermissions() {
      setLoading(true);
      setError(null);

      try {
        if (!id) {
          throw new Error("User not found");
        }

        const [users, data, assignedPermissions] = await Promise.all([
          listUsers(),
          listPermissions(),
          getUserPermissions(id),
        ]);
        const targetUser = users.find((candidate) => candidate.id === id);

        if (!targetUser) {
          throw new Error("User not found");
        }

        if (!cancelled) {
          setUser(targetUser);
          setPermissions(data);
          setSelectedPermissions(assignedPermissions);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load permissions"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPermissions();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function togglePermission(permission: string) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    try {
      if (!id) {
        throw new Error("User not found");
      }

      await updateUserPermissions(id, selectedPermissions);
      navigate("/users");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update permissions"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGate permission="permissions.manage">
      <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">
          Manage Permissions
        </h1>
        <p className="text-sm text-gray-500">
          {user ? `Additional permissions for ${user.name}` : "Loading user..."}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading permissions...</p>
      ) : (
        <div className="space-y-3">
          {permissions.map((permission) => (
            <label
              key={permission.id}
              className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission.name)}
                onChange={() => togglePermission(permission.name)}
                className="mt-1"
              />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {permission.name}
                </p>
                <p className="text-sm text-gray-500">
                  {permission.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/users")}
          disabled={saving}
          className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      </div>
    </PermissionGate>
  );
}