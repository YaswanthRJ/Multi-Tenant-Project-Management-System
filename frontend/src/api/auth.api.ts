import type { AuthenticatedUser, DashboardStats } from "../types/auth";
import { get, post } from "./api";

type LoginResponse = {
  message: string;
};

type LogoutResponse = {
  message: string;
};

export function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return post<LoginResponse>("/auth/login", {
    email,
    password,
  });
}

export function logout(): Promise<LogoutResponse> {
  return post<LogoutResponse>("/auth/logout", {});
}

export function getMe(): Promise<AuthenticatedUser> {
  return get<AuthenticatedUser>("/me");
}

export function getDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>("/dashboard/stats");
}