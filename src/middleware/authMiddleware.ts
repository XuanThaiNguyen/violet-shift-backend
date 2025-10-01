import type { Handler, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "./type";
import User from "../models/userModel";
import { AUTH_ERROR_CODE } from "../constants/errorCode";

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
        message: "Unauthenticated",
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

export const isInRoles = (roles: string[]): Handler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById((req as AuthRequest).userId);
    if (!user || !roles.includes(user?.role.toString())) {
      return sendResponse({
        res,
        statusCode: 403,
        message: "Unauthorized",
        code: AUTH_ERROR_CODE.UNAUTHORIZED,
      });
    }
    next();
  };
};
