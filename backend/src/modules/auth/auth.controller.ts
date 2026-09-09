import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { signAccessToken } from "../../utils/jwt.js";
import { authenticateUser, dashboardStats } from "./auth.service.js";
import { AccountDisabledError } from "./auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 24 * 60 * 60 * 1000
};

const clearCookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/"
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required" });
  }

  let user;

  try {
    user = await authenticateUser(email.trim(), password);
  } catch (error) {
    if (error instanceof AccountDisabledError) {
      return res.status(403).json({ message: "Account disabled" });
    }

    throw error;
  }

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  res.cookie(
    "access_token",
    signAccessToken(user.id),
    cookieOptions
  );

  return res.json({
    message: "Login successful"
  });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie("access_token", clearCookieOptions);

  return res.json({
    message: "Logout successful"
  });
}

export function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  return res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.roleName,
    tenantId: req.user.tenantId,
    permissions: req.user.permissions
  });
}

export async function stats(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  return res.json(await dashboardStats(req.user));
}