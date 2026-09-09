export type Permission = {
  id: number;
  name: string;
  description: string;
};

export type UpdatePermissionsInput = {
  permissions: string[];
};