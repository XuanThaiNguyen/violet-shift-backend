import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { sendResponse } from "../utils/sendResponse";
import { validateLoginUser } from "../validations/authValidation";
import { API_STATUS } from "../constants/apiStatus";

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value: userData } = validateLoginUser(req.body);
    if (error)
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
      });

    const user = await User.findOne({ email: userData.email });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect) {
      return sendResponse({
        res,
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    const { password, ...userInfo } = user.toObject();

    const token = jwt.sign(
      { userId: String(user._id), email: user.email },
      process.env["JWT_SECRET"] as string,
      {
        expiresIn: "7d",
      }
    );

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      data: {
        token,
        user: userInfo,
      },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    console.log("Logout successfully!");

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
    });
  } catch (err) {
    console.error("Logout error:", err);
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

export default { login, logout };
