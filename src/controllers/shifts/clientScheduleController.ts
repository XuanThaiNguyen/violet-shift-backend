import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import ClientSchedule from "../../models/shifts/clientScheduleModel";

export const getSchedulesByShiftId = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const schedules = await ClientSchedule.find(
      { shift: shiftId },
      {},
      {
        populate: [
          {
            path: "client",
            select: ["firstName", "lastName", "middleName", "preferredName"],
          },
        ],
      },
    );
    return sendResponse({
      res,
      statusCode: 200,
      message: "Schedules fetched successfully",
      data: schedules,
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
