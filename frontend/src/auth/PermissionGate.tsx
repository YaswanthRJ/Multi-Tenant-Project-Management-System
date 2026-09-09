import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

type PermissionGateProps = {
  permission: string;
  children: ReactNode;
};

export function PermissionGate({
  permission,
  children,
}: PermissionGateProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (!user.permissions.includes(permission)) {
    return null;
  }

  return children;
}