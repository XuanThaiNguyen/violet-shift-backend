import { Request, Response } from "express";
import { AuthRequest } from "../middleware/type";
import User from "../models/user.model";
import { sendResponse } from "../utils/sendResponse";
import { ME_ERROR_CODE } from "../constants/errorCode";

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as AuthRequest).userId);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        code: ME_ERROR_CODE.USER_NOT_FOUND,
        message: "User not found",
      });
    }
    const { password, ...userInfo } = user.toObject();
    return sendResponse({
      res,
      statusCode: 200,
      message: "User fetched successfully",
      data: userInfo,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: ME_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};