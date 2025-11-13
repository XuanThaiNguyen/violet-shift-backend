import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { API_STATUS } from "../../constants/apiStatus";
import { WORKLOG_ERROR_CODE } from "../../constants/errorCode";
import { logger as winstonLogger } from "../../utils/logger";
import { IQueryStaffWorklog, validateQueryStaffWorklog } from "../../validations/worklogValidation";
import { WorkLogSegment } from "../../models/payrolls/workLogSegments";
import { Types } from "mongoose";
import { addMonths } from "date-fns";

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
  const maxTo = addMonths(from, 1).getTime();
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
  try {
    const worklogSegments = await WorkLogSegment.find(
      {
        staff: staffId,
        startedAt: { $gte: from, $lte: clampTo },
        ...(ruleId ? { rule: Types.ObjectId.createFromHexString(ruleId) } : {}),
      },
      { __v: 0 },
      { lean: true },
    );

    return sendResponse({
      res,
      statusCode: 200,
      status: API_STATUS.OK,
      message: "Worklog segments fetched successfully",
      data: worklogSegments,
    });
  } catch (error) {
    logger.error(`Error fetching worklog segments for staff ${staffId} with query ${JSON.stringify(queryData)}`, error);
    return sendResponse({
      res,
      statusCode: 500,
      code: WORKLOG_ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  }
};
