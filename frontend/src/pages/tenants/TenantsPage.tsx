import { useEffect, useState } from "react";
import { listTenants } from "../../api/tenants.api";
import { ApiError } from "../../api/api";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/table/DataTable";
import type { Tenant } from "../../types/tenant";

export function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTenants() {
      setLoading(true);
      setError(null);

      try {
        const data = await listTenants();

        if (!cancelled) {
          setTenants(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load tenants"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTenants();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (tenant) =>
        new Date(tenant.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Tenants
        </h1>

        <p className="text-sm text-gray-500">
          Manage your tenants
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={tenants}
        loading={loading}
        emptyMessage="No tenants found"
      />
    </div>
  );
}