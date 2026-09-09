import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { me, stats } from "./modules/auth/auth.controller.js";
import authRoutes from "./modules/auth/auth.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import tenantRoutes from "./modules/tenants/tenant.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import permissionRoutes from "./modules/permissions/permission.routes.js";

export const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);

app.use(express.json());

app.use(cookieParser());

app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.use("/auth", authRoutes);

app.use("/projects", projectRoutes);

app.use("/tenants", tenantRoutes);

app.use("/users", userRoutes);

app.use("/permissions", permissionRoutes);

app.get("/me", requireAuth, me);

app.get("/dashboard/stats", requireAuth, stats);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok"
  });
});
