import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "./type";
import RedisService from "../services/redis";
import { AUTH_ERROR_CODE } from "../constants/errorCode";

import type { Request, Response, NextFunction, Handler } from "express";

export const requireToken: Handler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const redis = RedisService.getInstance();
    const key = `token:auth_temp:${token}`;
    const userId = await redis.get(key);
    if (!userId) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Unauthorized",
        code: AUTH_ERROR_CODE.UNAUTHENTICATED,
      });
    }

    (req as AuthRequest).userId = userId;
    next();
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid token",
      code: AUTH_ERROR_CODE.UNAUTHENTICATED,
    }); 
  }
};
