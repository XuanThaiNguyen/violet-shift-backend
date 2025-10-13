import type { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import { API_STATUS } from "../../constants/apiStatus";
import { sendResponse } from "../../utils/sendResponse";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";


export const getStaffSchedules = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryStaffSchedules(req.query as unknown as IQueryStaffSchedules);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }
  }
};

export const getScheduleByShiftId = async (req: Request, res: Response) => {
  try {
    const { error, value: queryData } = validateQueryStaffSchedules(req.query as unknown as IQueryStaffSchedules);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }
  }
};