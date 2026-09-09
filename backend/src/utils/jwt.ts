import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

export type JwtPayload = {
  userId: string;
};

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const payload = jwt.verify(token, env.jwtSecret);

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof payload.userId !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return { userId: payload.userId };
}