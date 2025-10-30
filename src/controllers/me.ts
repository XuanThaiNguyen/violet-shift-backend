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
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: ME_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const userId = (req as AuthRequest).userId;
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId},
      [{
        $set: {
          ...userData,
          fullName: {
            $concat: [
              userData.firstName ? userData.firstName : { $ifNull: ["$firstName", ""] },
              userData.firstName ? " " :{ $cond: [{ $gt: [{$ifNull: ["$firstName", ""]}, ""] }, " ", ""] },
              userData.middleName ? userData.middleName : { $ifNull: ["$middleName", ""] },
              userData.middleName ? " " : { $cond: [{ $gt: [{$ifNull: ["$middleName", ""]}, ""] }, " ", ""] },
              userData.lastName ? userData.lastName : { $ifNull: ["$lastName", ""] },
            ],
          },
          hasSetProfile: true,
        },
      }],
      {
        projection: { password: 0 },
        new: true,
        lean: true,
      },
    );
    if (!updatedUser) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "User not found",
        code: ME_ERROR_CODE.USER_NOT_FOUND,
      });
    }
    return sendResponse({
      res,
      statusCode: 200,
      message: "User updated successfully",
      data: {
        id: updatedUser._id,
        ...updatedUser,
      },
    });
  } catch (error) {
    console.log("🚀 ~ error:", error)
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: ME_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
