import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel";
import { sendResponse } from "../utils/sendResponse";
import {
  validateLoginUser,
  validateNewPassword,
  validateUpdatePassword,
  validateForgotPassword,
} from "../validations/authValidation";
import { API_STATUS } from "../constants/apiStatus";
import { AuthRequest } from "../middleware/type";
import { LOGIN_ERROR_CODE, ME_ERROR_CODE } from "../constants/errorCode";
import { nanoid } from "nanoid";
import RedisService from "../services/redis";
import { logger as winstonLogger } from "../utils/logger";

const controllerLogger = winstonLogger.child({
  controller: "authController",
});

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value: userData } = validateLoginUser(req.body);
    if (error)
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
      });

    const user = await User.findOne({ email: userData.email }, { __v: 0 }, { lean: true });
    if (!user?.password) {
      return sendResponse({
        res,
        statusCode: 401,
        code: LOGIN_ERROR_CODE.INVALID_REQUEST,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(userData.password, user.password);
    if (!isPasswordCorrect) {
      return sendResponse({
        res,
        statusCode: 401,
        code: LOGIN_ERROR_CODE.INVALID_REQUEST,
        message: "Invalid credentials",
      });
    }

    const { password, ...userInfo } = user;

    const token = jwt.sign(
      { userId: String(user._id), email: user.email },
      process.env["JWT_SECRET"] as string,
      {
        expiresIn: "7d",
      },
    );

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: {
        token,
        user: {
          id: user._id,
          ...userInfo,
        },
      },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const newPassword = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "newPassword",
  });
  try {
    const { error, value: passwordData } = validateNewPassword(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const user = await User.findById((req as AuthRequest).userId, { password: 0 });
    if (!user)
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: ME_ERROR_CODE.USER_NOT_FOUND,
      });

    user.password = await bcrypt.hash(passwordData.password, 10);
    await user.save();

    const token = jwt.sign(
      { userId: String(user._id), email: user.email },
      process.env["JWT_SECRET"] as string,
      {
        expiresIn: "7d",
      },
    );

    const tempToken = req.headers["authorization"];
    const redis = RedisService.getInstance();
    redis.del(`token:auth_temp:${tempToken}`);

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Password updated successfully",
      data: {
        token,
        user: user.toObject({ virtuals: true }),
      },
    });
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
      code: ME_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const { error, value: passwordData } = validateUpdatePassword(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const user = await User.findById((req as AuthRequest).userId);
    if (!user)
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: ME_ERROR_CODE.USER_NOT_FOUND,
      });

    const isPasswordCorrect = await bcrypt.compare(passwordData.currentPassword, user.password);
    if (!isPasswordCorrect) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
        code: LOGIN_ERROR_CODE.INVALID_CURRENT_PASSWORD,
      });
    }

    user.password = await bcrypt.hash(passwordData.password, 10);
    await user.save();

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Password updated successfully",
      data: 'OK',
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "forgotPassword",
  });
  try {
    const { error, value: userData } = validateForgotPassword(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: LOGIN_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: LOGIN_ERROR_CODE.USER_NOT_FOUND,
      });
    }

    const token = nanoid(10);

    const redis = RedisService.getInstance();
    redis.setex(`token:auth_temp:${token}`, 60 * 60 * 0.5, user.id);
    const resetUrl = `${process.env.APP_URL}/auth/new-password?token=${token}`;
    // TODO: Send email to user
    logger.info(`Reset URL: ${resetUrl}`);

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: API_STATUS.OK,
      message: "Password reset email sent successfully",
    });
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
      code: LOGIN_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "logout",
  });
  try {
    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};
