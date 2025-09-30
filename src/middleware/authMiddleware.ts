import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/sendResponse";

export interface AuthRequest extends Request {
  userId: string;
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = header.slice("Bearer ".length);
    const secret = process.env.JWT_SECRET as string;
    if (!secret) return res.status(500).json({ message: "JWT secret missing" });

    const payload = jwt.verify(token, secret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid token",
    });
  }
};
