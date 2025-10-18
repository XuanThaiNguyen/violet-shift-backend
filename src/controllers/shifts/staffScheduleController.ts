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
import Shift from "../../models/shifts/shiftModel";
import { addMonths } from "date-fns";
import { AuthRequestWithSchedule } from "./type";
import { validateClockOut } from "../../validations/shiftClockValidation";

// middleware to check if the user is assigned to the shift
export const isAssignedToSchedule = async (req: Request) => {
  try {
    const scheduleId = req.params.scheduleId;
    const userId = (req as AuthRequestWithSchedule).userId;

    const schedule = await StaffSchedule.findOne({ _id: scheduleId, user: userId }, undefined, { lean: true, virtuals: true });
    if (!schedule) {
      return false;
    }
    (req as AuthRequestWithSchedule)["schedule"] = schedule;
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
    const schedule = await StaffSchedule.findById(scheduleId, undefined, { lean: true, virtuals: true });
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
    const _staffSchedules = await StaffSchedule.find(
      {
        staff: Types.ObjectId.createFromHexString(staffId),
        timeFrom: { $gte: queryData.from, $lte: clampTo },
      },
      undefined,
      {
        populate: [
          {
            path: "shift",
            select: ["shiftType", "address", "unitNumber"],
          },
        ],
        lean: true,
        virtuals: false,
      },
    );
    const staffSchedules = _staffSchedules.map((staffSchedule) => {
      staffSchedule.id = staffSchedule._id;
      return staffSchedule;
    });
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
    const schedules = await StaffSchedule.find({ shift: shiftId }, undefined, { lean: true });
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

export const clockIn = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const scheduleId = req.params.scheduleId;
    const userId = (req as AuthRequest).userId;
    const schedule = await StaffSchedule.findOne({
      _id: scheduleId,
      staff: userId,
      shift: shiftId,
    });
    if (!schedule) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Staff schedule not found or happened in some other time or already clocked in",
        code: SHIFT_ERROR_CODE.STAFF_SCHEDULE_NOT_FOUND,
      });
    }

    if (schedule.clocksInAt) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Staff already clocked in",
        code: SHIFT_ERROR_CODE.STAFF_ALREADY_CLOCKED_IN,
      });
    }

    if (schedule.timeFrom > Date.now()) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Shift has not started yet",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_STARTED,
      });
    }

    if (schedule.timeTo < Date.now()) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Shift has ended",
        code: SHIFT_ERROR_CODE.SHIFT_ENDED,
      });
    }

    schedule.clocksInAt = Date.now();
    await schedule.save();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Clock in successfully",
      data: schedule!.toObject({ virtuals: true }),
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

export const clockOut = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const scheduleId = req.params.scheduleId;
    const userId = (req as AuthRequest).userId;
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }

    const { error, value: clockOutData } = validateClockOut(req.body, {
      staffSignatureRequired: shift.staffClockOutRequired,
      clientSignatureRequired: shift.clientClockOutRequired,
    });
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const schedule = await StaffSchedule.findOne(
      {
        _id: scheduleId,
        staff: userId,
        shift: shiftId,
      },
    );
    if (!schedule) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Staff schedule not found or not clocked in yet",
        code: SHIFT_ERROR_CODE.STAFF_SCHEDULE_NOT_FOUND,
      });
    }
    if (schedule.clocksOutAt) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Staff has already clocked out",
        code: SHIFT_ERROR_CODE.STAFF_ALREADY_CLOCKED_OUT,
      });
    }
    if (!schedule.clocksInAt) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Staff has not clocked in yet",
        code: SHIFT_ERROR_CODE.STAFF_NOT_CLOCKED_IN,
      });
    }
    // allow late clock out. Uncomment if you want to prevent late clock out
    // if (schedule.timeTo < Date.now()) {
    //   return sendResponse({
    //     res,
    //     statusCode: 400,
    //     message: "Shift has ended",
    //     code: SHIFT_ERROR_CODE.SHIFT_ENDED,
    //   });
    // }

    schedule.clocksOutAt = Date.now();
    await schedule.save();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Clock out successfully",
      data: schedule!.toObject({ virtuals: true }),
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
