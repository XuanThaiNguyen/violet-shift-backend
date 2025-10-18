import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import ShiftTask from "../../models/shifts/shiftTaskModel";
import { validateTaskStatus } from "../../validations/shiftTaskValidation";

export const getTasksByShiftId = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const _tasks = await ShiftTask.find({ shift: shiftId }, undefined, { lean: true })
    const tasks = _tasks.map((task) => {
      task.id = task._id;
      return task;
    });
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

export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const taskId = req.params.taskId;
    const shiftId = req.params.shiftId;
    const { error, value: taskData } = validateTaskStatus(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const updatedTask = await ShiftTask.updateOne(
      { _id: taskId, shift: shiftId },
      { $set: { isCompleted: taskData.isCompleted }, isNew: true },
    );
    if (!updatedTask) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Task not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }
    return sendResponse({
      res,
      statusCode: 200,
      message: "Task status updated successfully",
      data: "ok",
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
