import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { login, logout } from "./auth.controller.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." }
});

router.post("/login", loginLimiter, login);
router.post("/logout", logout);

export default router;