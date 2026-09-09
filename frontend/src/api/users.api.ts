import { get, patch, post, put } from "./api";
import type {
  CreateUserInput,
  UpdateUserInput,
  User,
} from "../types/user";

export function listUsers(): Promise<User[]> {
  return get<User[]>("/users");
}

export function createUser(
  input: CreateUserInput
): Promise<User> {
  return post<User>("/users", input);
}

export function updateUser(
  id: string,
  input: UpdateUserInput
): Promise<User> {
  return put<User>(`/users/${id}`, input);
}

export function disableUser(
  id: string,
  disabled: boolean
): Promise<User> {
  return patch<User>(`/users/${id}/disable`, {
    disabled,
  });
}