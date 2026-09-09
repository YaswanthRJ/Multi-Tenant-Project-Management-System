import { useEffect, useState } from "react";
import { ApiError } from "../../api/api";
import { createTenant, listTenants } from "../../api/tenants.api";
import type { Tenant } from "../../types/tenant";

type TenantSelectProps = {
  value: string;
  onChange: (tenantId: string) => void;
  allowCreate?: boolean;
  required?: boolean;
  disabled?: boolean;
};

export function TenantSelect({
  value,
  onChange,
  allowCreate = false,
  required = false,
  disabled = false,
}: TenantSelectProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listTenants()
      .then((data) => {
        if (!cancelled) {
          setTenants(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load tenants");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateTenant() {
    const trimmedName = newTenantName.trim();

    if (!trimmedName) {
      return;
    }

    setError(null);
    setCreating(true);

    try {
      const tenant = await createTenant({ name: trimmedName });
      setTenants((currentTenants) => [...currentTenants, tenant]);
      onChange(tenant.id);
      setNewTenantName("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create tenant");
    } finally {
      setCreating(false);
    }
  }

  function handleCancelCreate() {
    setNewTenantName("");
    setError(null);
    setShowCreate(false);
  }

  return (
    <div>
      <select
        id="tenant"
        required={required}
        disabled={loading || disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
      >
        <option value="" disabled>
          {loading ? "Loading tenants..." : "Select a tenant"}
        </option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      {allowCreate && !disabled && !showCreate && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreate(true);
          }}
          className="mt-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          + Create new tenant
        </button>
      )}

      {allowCreate && !disabled && showCreate && (
        <div className="mt-3 rounded-md border border-gray-200 p-3">
          <label
            htmlFor="new-tenant-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            New tenant name
          </label>
          <input
            id="new-tenant-name"
            type="text"
            value={newTenantName}
            onChange={(event) => setNewTenantName(event.target.value)}
            className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          />

          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateTenant}
              disabled={creating || !newTenantName.trim()}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create tenant"}
            </button>
            <button
              type="button"
              onClick={handleCancelCreate}
              disabled={creating}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showCreate && error && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
