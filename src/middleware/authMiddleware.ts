import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/sendResponse";
import { AuthRequest } from "./type";
import { logger as winstonLogger } from "../utils/logger";
import User from "../models/userModel";
import { AUTH_ERROR_CODE } from "../constants/errorCode";
import type { Handler, NextFunction, Request, Response } from "express";

const middlewareLogger = winstonLogger.child({
  middleware: "authMiddleware",
});

export const requireAuth: Handler = (req: Request, res: Response, next: NextFunction) => {
  const logger = middlewareLogger.child({
    function: "requireAuth",
  });
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Unauthenticated",
        code: AUTH_ERROR_CODE.UNAUTHENTICATED,
      });
    }
    const token = header.slice("Bearer ".length);
    const secret = process.env.JWT_SECRET as string;
    if (!secret)
      return sendResponse({
        res,
        statusCode: 500,
        message: "JWT secret missing",
        code: AUTH_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });

    const payload = jwt.verify(token, secret) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 401,
      message: "Invalid token",
      code: AUTH_ERROR_CODE.UNAUTHENTICATED,
    });
  }
};

export const isInRoles = (roles: string[]): Handler => {
  const logger = middlewareLogger.child({
    function: "isInRoles",
  });
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById((req as AuthRequest).userId).lean();
      if (!user || !roles.includes(user?.role.toString())) {
        return sendResponse({
          res,
          statusCode: 403,
          message: "Unauthorized",
          code: AUTH_ERROR_CODE.UNAUTHORIZED,
        });
      }
      next();
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error.message, error.stack);
      } else {
        logger.error("Unknown error", error);
      }
      return sendResponse({
        res,
        statusCode: 500,
        message: "Internal server error",
        code: AUTH_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

type CheckMyResource = (req: Request) => boolean | Promise<boolean>;
export const isInRolesOrSelf = (roles: string[], checkMyResource: CheckMyResource): Handler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById((req as AuthRequest).userId);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 403,
        message: "Unauthorized",
        code: AUTH_ERROR_CODE.UNAUTHORIZED,
      });
    }
    if (roles.includes(user?.role.toString() as string)) {
      next();
    } else {
      const isMine = await checkMyResource(req);
      if (isMine) {
        next();
      } else {
        return sendResponse({
          res,
          statusCode: 403,
          message: "Unauthorized",
          code: AUTH_ERROR_CODE.UNAUTHORIZED,
        });
      }
    }
  };
};
