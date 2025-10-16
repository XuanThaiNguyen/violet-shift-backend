import type { Request, Response } from "express";
import { AuthRequest } from "../../middleware/type";
import { sendResponse } from "../../utils/sendResponse";
import { Types } from "mongoose";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import StaffSchedule, { IStaffSchedule } from "../../models/shifts/staffScheduleModel";
import {
  IQueryStaffSchedules,
  validateQueryStaffSchedules,
} from "../../validations/staffScheduleValidation";
import { addMonths } from "date-fns";

type AuthRequestWithSchedule = AuthRequest & {
  schedule: IStaffSchedule;
};
// middleware to check if the user is assigned to the shift
export const isAssignedToSchedule = async (req: Request) => {
  try {
    const scheduleId = req.params.scheduleId;
    const userId = (req as AuthRequestWithSchedule).userId;

    const schedule = await StaffSchedule.findOne({ _id: scheduleId, user: userId });
    if (!schedule) {
      return false;
    }
    (req as AuthRequestWithSchedule)["schedule"] = schedule?.toObject({ virtuals: true });
    return true;
  } catch (error) {
    return false;
  }
};
export const getStaffSchedule = async (req: Request, res: Response) => {
  if ((req as AuthRequestWithSchedule)["schedule"]) {
    return sendResponse({
      res,
      statusCode: 200,
      message: "Staff schedule fetched successfully",
      data: (req as AuthRequestWithSchedule)["schedule"],
    });
  }

  try {
    const scheduleId = req.params.scheduleId;
    const schedule = await StaffSchedule.findById(scheduleId);
    if (!schedule) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Staff schedule not found",
        code: SHIFT_ERROR_CODE.STAFF_SCHEDULE_NOT_FOUND,
      });
    }
    return sendResponse({
      res,
      statusCode: 200,
      message: "Staff schedule fetched successfully",
      data: schedule?.toObject({ virtuals: true }),
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

export const getStaffSchedules = async (req: Request, res: Response) => {
  try {
    const staffId = req.params.staffId;
    const { error, value: queryData } = validateQueryStaffSchedules(
      req.query as unknown as IQueryStaffSchedules,
    );
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const maxTo = addMonths(queryData.from, 1).getTime();
    const clampTo = Math.min(Math.max(queryData.to, queryData.from + 1000 * 60 * 60 * 24), maxTo);
    const staffSchedules = await StaffSchedule.find(
      {
        staff: Types.ObjectId.createFromHexString(staffId),
        timeFrom: { $gte: queryData.from, $lte: clampTo },
      },
      undefined,
      {
        populate: [{
          path: "shift",
          select: ["shiftType", "address", "unitNumber"],
        }]
      }
    );
    return sendResponse({
      res,
      statusCode: 200,
      message: "Staff schedules fetched successfully",
      data: staffSchedules,
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

export const getSchedulesByShiftId = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const schedules = await StaffSchedule.find({ shift: shiftId });
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
