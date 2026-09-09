export type Permission = {
  id: number;
  name: string;
  description: string;
  assignedToAdmin: boolean;
};

export type UpdatePermissionsInput = {
  permissions: string[];
};