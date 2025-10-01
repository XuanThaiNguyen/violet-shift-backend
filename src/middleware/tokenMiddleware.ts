import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "./type";
import RedisService from "../services/redis";

import type { Request, Response, NextFunction, Handler } from "express";

export const requireAuth: Handler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const redis = RedisService.getInstance();
    const key = `token:auth_temp:${token}`;
    const userId = await redis.get(key);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as AuthRequest).userId = userId;
    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid token",
    });
  }
};
