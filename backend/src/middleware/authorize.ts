import type { NextFunction, Request, RequestHandler, Response } from "express";

export function requirePermission(
  permission: string
): RequestHandler {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    next();
  };
}

export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required"
    });
    return;
  }

  if (
    req.user.roleName !== "SUPER_ADMIN" ||
    req.user.tenantId !== null
  ) {
    res.status(403).json({
      message: "Forbidden"
    });
    return;
  }

  next();
}