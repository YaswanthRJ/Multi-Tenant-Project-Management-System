import type { NextFunction, Request, Response } from "express";

import { loadAuthenticatedUser } from "../modules/auth/auth.service.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.access_token;

  if (typeof token !== "string") {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const { userId } = verifyAccessToken(token);
    const user = await loadAuthenticatedUser(userId);

    if (!user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Authentication required" });
  }
}