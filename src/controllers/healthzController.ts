import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";

export const healthz = async (req: Request, res: Response) => {
  console.log("🚀 ~ healthz:")
  return sendResponse({
    res,
    statusCode: 200,
    message: "OK",
  });
};