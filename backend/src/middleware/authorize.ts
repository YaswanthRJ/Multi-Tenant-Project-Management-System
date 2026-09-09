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

export function requireAdminOrSuperAdmin(
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

  const isSuperAdmin =
    req.user.roleName === "SUPER_ADMIN" && req.user.tenantId === null;
  const isTenantAdmin =
    req.user.roleName === "ADMIN" && req.user.tenantId !== null;

  if (!isSuperAdmin && !isTenantAdmin) {
    res.status(403).json({
      message: "Forbidden"
    });
    return;
  }

  next();
}