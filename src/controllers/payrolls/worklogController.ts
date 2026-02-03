import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { API_STATUS } from "../../constants/apiStatus";
import { WORKLOG_ERROR_CODE } from "../../constants/errorCode";
import { logger as winstonLogger } from "../../utils/logger";
import {
  IQueryStaffWorklog,
  IQueryWorklogSummary,
  validateQueryStaffWorklog,
  validateQueryWorklogSummary,
} from "../../validations/worklogValidation";
import { WorkLogSegment } from "../../models/payrolls/workLogSegments";
import { Types } from "mongoose";
import { addDays } from "date-fns";
import WorkLog from "../../models/payrolls/workLogs";

const PAY_PERIOD_DAYS = 14;

const controllerLogger = winstonLogger.child({
  controller: "worklogController",
});

export const getByStaff = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "getByStaff",
  });
  const { error, value: queryData } = validateQueryStaffWorklog(
    req.query as unknown as IQueryStaffWorklog,
  );
  const { from, to, ruleId } = queryData;
  const maxTo = addDays(from, PAY_PERIOD_DAYS).getTime();
  const clampTo = Math.min(Math.max(to, from + 1000 * 60 * 60 * 24), maxTo);
  const staffId = req.params.staffId;
  if (error) {
    return sendResponse({
      res,
      statusCode: 400,
      code: WORKLOG_ERROR_CODE.INVALID_REQUEST,
      message: error.details[0].message,
    });
  }

  if (!Types.ObjectId.isValid(staffId)) {
    return sendResponse({
      res,
      statusCode: 400,
      code: WORKLOG_ERROR_CODE.INVALID_REQUEST,
      message: "Invalid staffId",
    });
  }
  try {
    const filter: Record<string, any> = {
      staff: new Types.ObjectId(staffId),
      startedAt: { $gte: from, $lte: clampTo },
    };
    if (ruleId) {
      filter.rule = new Types.ObjectId(ruleId);
    }

    const worklogSegments = await WorkLogSegment.find(filter as any)
      .select({ __v: 0 })
      .lean()
      .exec();

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Worklog segments fetched successfully",
      data: worklogSegments,
    });
  } catch (error) {
    logger.error(
      `Error fetching worklog segments for staff ${staffId} with query ${JSON.stringify(queryData)}`,
      error,
    );
    return sendResponse({
      res,
      statusCode: 500,
      code: WORKLOG_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const summaryByStaff = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "summaryByStaff",
  });

  const { error, value: queryData } = validateQueryWorklogSummary(
    req.query as unknown as IQueryWorklogSummary,
  );

  if (error) {
    return sendResponse({
      res,
      statusCode: 400,
      code: WORKLOG_ERROR_CODE.INVALID_REQUEST,
      message: error.details[0].message,
    });
  }

  const { from, to } = queryData;

  try {
    const summary = await WorkLogSegment.aggregate([
      {
        $match: {
          startedAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$staff",
          totalHours: { $sum: { $toDouble: "$hours" } },
          segments: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          staffId: { $toString: "$_id" },
          totalHours: 1,
          segments: 1,
        },
      },
    ]).exec();

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Worklog summary fetched successfully",
      data: summary,
    });
  } catch (err) {
    logger.error(`Error fetching worklog summary with query ${JSON.stringify(queryData)}`, err);
    return sendResponse({
      res,
      statusCode: 500,
      code: WORKLOG_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};

export const shiftLogsByStaff = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "isLoggedByStaff",
  });
  const shiftId = req.params.shiftId;
  const staffId = req.params.staffId;

  try {
    const logs = await WorkLog.find({
      staff: staffId,
      shift: shiftId,
    });

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Worklog segments fetched successfully",
      data: logs,
    });
  } catch (error) {
    logger.error(
      `Error fetching worklog segments for staff ${staffId} with query shift ${shiftId}`,
      error,
    );
    return sendResponse({
      res,
      statusCode: 500,
      code: WORKLOG_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
