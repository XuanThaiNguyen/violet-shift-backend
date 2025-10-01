import type { Handler, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/sendResponse";

export interface AuthRequest extends Request {
  userId: string;
}

export const requireAuth: Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Unauthorized",
      });
    }
    const token = header.slice("Bearer ".length);
    const secret = process.env.JWT_SECRET as string;
    if (!secret)
      return sendResponse({
        res,
        statusCode: 500,
        message: "JWT secret missing",
      });

    const payload = jwt.verify(token, secret) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid token",
    });
  }
};
