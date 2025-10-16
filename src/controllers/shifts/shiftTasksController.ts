import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import ShiftTask from "../../models/shifts/shiftTaskModel";

export const getTasksByShiftId = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const tasks = await ShiftTask.find({ shift: shiftId });
    return sendResponse({
      res,
      statusCode: 200,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
