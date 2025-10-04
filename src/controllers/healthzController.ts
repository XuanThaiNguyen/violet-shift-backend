import { Request, Response } from "express";
import { sendResponse } from "../utils/sendResponse";

export const healthz = async (req: Request, res: Response) => {
  return sendResponse({
    res,
    statusCode: 200,
    message: "OK",
  });
};
