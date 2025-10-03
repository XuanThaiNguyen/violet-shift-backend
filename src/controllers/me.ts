import { Request, Response } from "express";
import { AuthRequest } from "../middleware/type";
import User from "../models/userModel";
import { sendResponse } from "../utils/sendResponse";
import { ME_ERROR_CODE } from "../constants/errorCode";
import { validateUpdateUser } from "../validations/userValidation";

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as AuthRequest).userId, {
      __v: 0,
      password: 0,
    });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        code: ME_ERROR_CODE.USER_NOT_FOUND,
        message: "User not found",
      });
    }
    const userInfo = user.toObject({ virtuals: true });
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

export const updateMe = async (req: Request, res: Response) => {
  try {
    const { error, value: userData } = validateUpdateUser(req.body);
    userData.id = (req as AuthRequest).userId;
    const updatedUser = await User.findOneAndUpdate(
      { _id: userData.id },
      userData,
      { projection: { password: 0 } }
    );
    if (!updatedUser) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: ME_ERROR_CODE.USER_NOT_FOUND,
      });
    }
    const userInfo = updatedUser?.toObject({ virtuals: true }) || {};
    return sendResponse({
      res,
      statusCode: 200,
      message: "User updated successfully",
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
