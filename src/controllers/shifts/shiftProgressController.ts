import type { Request, Response } from "express";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import Shift from "../../models/shifts/shiftModel";
import ShiftProgress from "../../models/shifts/shiftProgressModel";
import { sendResponse } from "../../utils/sendResponse";
import { validateShiftProgress } from "../../validations/shiftValidation";

export const addProgress = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const { error, value: progressData } = validateShiftProgress(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const shiftExists = await Shift.exists({ _id: shiftId, isDeleted: false });
    if (!shiftExists) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }

    const existingShiftProgress = await ShiftProgress.findOne({
      shift: shiftId,
      client: progressData.client,
      shiftProgressType: progressData.shiftProgressType,
    });

    if (existingShiftProgress) {
      return sendResponse({
        res,
        statusCode: 400,
        message: `Client already has a progress entry of type "${progressData.shiftProgressType}" for this shift.`,
        code: SHIFT_ERROR_CODE.DUPLICATE_PROGRESS_TYPE,
      });
    }

    const progress = await ShiftProgress.create({
      ...progressData,
      shift: shiftId,
    });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Shift progress created successfully",
      data: progress,
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProgresses = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const progresses = await ShiftProgress.find({ shift: shiftId }, undefined, {
      lean: true,
    })
      .populate("client", "firstName lastName preferredName middleName salutation")
      .sort({ createdAt: -1 });

    return sendResponse({
      res,
      statusCode: 200,
      message: "Progresses fetched successfully",
      data: progresses,
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getProgress = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const progressId = req.params.progressId;
    const progress = await ShiftProgress.findOne({ _id: progressId, shift: shiftId }, undefined, {
      lean: true,
    }).populate("client", "firstName lastName preferredName middleName salutation");

    if (!progress) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift progress not found",
        code: SHIFT_ERROR_CODE.SHIFT_PROGRESS_NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: "Progress fetched successfully",
      data: progress,
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateProgress = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const progressId = req.params.progressId;
    const { error, value: progressData } = validateShiftProgress(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const existingProgress = await ShiftProgress.findOne({
      _id: { $ne: progressId },
      shift: shiftId,
      client: progressData.client,
      shiftProgressType: progressData.shiftProgressType,
    });
    if (existingProgress) {
      return sendResponse({
        res,
        statusCode: 400,
        message: `A progress with type '${progressData.shiftProgressType}' already exists for this client in this shift.`,
        code: SHIFT_ERROR_CODE.DUPLICATE_PROGRESS_TYPE,
      });
    }

    const updatedProgress = await ShiftProgress.findByIdAndUpdate(
      progressId,
      { $set: { ...progressData, updatedAt: new Date() } },
      { new: true },
    ).populate("client", "firstName lastName preferredName middleName salutation");

    return sendResponse({
      res,
      statusCode: 200,
      message: "Progress updated successfully",
      data: updatedProgress,
    });
  } catch (err) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
