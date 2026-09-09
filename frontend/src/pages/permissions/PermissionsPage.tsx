import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { ApiError } from "../../api/api";
import { listPermissions, updateAdminPermissions } from "../../api/permissions.api";
import { PermissionGate } from "../../auth/PermissionGate";
import type { Permission } from "../../types/permission";

export function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPermissions() {
      setLoading(true);
      setError(null);

      try {
        const data = await listPermissions();
        if (!cancelled) {
          setPermissions(data);
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
  }, []);

  function togglePermission(permissionName: string) {
    setSuccess(null);
    setPermissions((current) =>
      current.map((permission) =>
        permission.name === permissionName
          ? { ...permission, assignedToAdmin: !permission.assignedToAdmin }
          : permission
      )
    );
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const selectedPermissions = permissions
        .filter((permission) => permission.assignedToAdmin)
        .map((permission) => permission.name);

      await updateAdminPermissions(selectedPermissions);
      setSuccess("Admin permissions saved successfully.");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save Admin permissions"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGate permission="permissions.manage">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Permissions</h1>
          <p className="text-sm text-slate-500">
            Manage permissions available to the Admin role.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" aria-hidden="true" />
            {success}
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading permissions...</p>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-slate-500">No permissions found.</p>
          ) : (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <label
                  key={permission.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 transition-colors hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={permission.assignedToAdmin}
                    onChange={() => togglePermission(permission.name)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {permission.name}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {permission.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving..." : "Save permissions"}
          </button>
        </div>
      </div>
    </PermissionGate>
  );
}
