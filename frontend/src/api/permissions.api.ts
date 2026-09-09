import { get, put } from "./api";
import type { Permission } from "../types/permission";

type MessageResponse = {
  message: string;
};

export function listPermissions(): Promise<Permission[]> {
  return get<Permission[]>("/permissions");
}

export function updateAdminPermissions(
  permissions: string[]
): Promise<MessageResponse> {
  return put<MessageResponse>("/permissions/admin", {
    permissions,
  });
}

export function updateUserPermissions(
  userId: string,
  permissions: string[]
): Promise<MessageResponse> {
  return put<MessageResponse>(
    `/users/${userId}/permissions`,
    {
      permissions,
    }
  );
}