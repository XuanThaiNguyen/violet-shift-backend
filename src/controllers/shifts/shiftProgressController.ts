import type { Request, Response } from "express";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import { AuthRequest } from "../../middleware/type";
import Shift from "../../models/shifts/shiftModel";
import ShiftProgressEvent from "../../models/shifts/shiftProgressEventModel";
import ShiftProgress from "../../models/shifts/shiftProgressModel";
import { sendResponse } from "../../utils/sendResponse";
import { validateShiftProgress } from "../../validations/shiftValidation";

export const addProgress = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const userId = (req as AuthRequest).userId;

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

    ShiftProgressEvent.create({
      progress: progress._id,
      shift: shiftId,
      shiftProgressType: progress.shiftProgressType,
      client: progress.client,
      action: "created",
      createdBy: userId,
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
    const userId = (req as AuthRequest).userId;

    const { error, value: progressData } = validateShiftProgress(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const currentProgress = await ShiftProgress.findById(progressId);
    if (!currentProgress) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Progress not found",
        code: SHIFT_ERROR_CODE.SHIFT_PROGRESS_NOT_FOUND,
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

    const changes: Record<string, any> = {};
    Object.keys(progressData).forEach((key) => {
      const oldValue = currentProgress[key as keyof typeof currentProgress];
      const newValue = progressData[key as keyof typeof progressData];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    const updatedProgress = await ShiftProgress.findByIdAndUpdate(
      progressId,
      { $set: { ...progressData, updatedAt: new Date() } },
      { new: true },
    ).populate("client", "firstName lastName preferredName middleName salutation");

    if (Object.keys(changes).length > 0) {
      ShiftProgressEvent.create({
        progress: progressId,
        shift: shiftId,
        shiftProgressType: currentProgress.shiftProgressType,
        client: currentProgress.client,
        action: "updated",
        changes,
        createdBy: userId,
      });
    }

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

export const getProgressEvents = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;

    const events = await ShiftProgressEvent.find({ shift: shiftId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName preferredName middleName salutation")
      .populate("client", "firstName lastName preferredName middleName salutation")
      .lean();

    return sendResponse({
      res,
      statusCode: 200,
      message: "Progress events fetched successfully",
      data: events,
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
