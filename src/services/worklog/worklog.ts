import { logger as winstonLogger } from "../../utils/logger";
import { TimeRuleService } from "../time-rule/time-rule-service";
import { breakWorkLogIntoSegments } from "../../utils/worklog";
import { TZDate } from "@date-fns/tz";
import mongoose from "mongoose";
import WorkLog from "../../models/payrolls/workLogs";
import { WorkLogSegment } from "../../models/payrolls/workLogSegments";

interface IWorklog {
  staff: string;
  shift: string;
  startTime: number;
  endTime: number;
  timezone: string;
}

export class WorklogService {
  private logger = winstonLogger.child({
    service: "WorklogService",
  });
  private timeruleService = new TimeRuleService();

  async logWork(worklog: IWorklog): Promise<void> {
    const logger = this.logger.child({
      worklog,
    });
    try {
      const timeRules = await this.timeruleService.getTimeRules();
      const baseTimeRules = timeRules.map((rule) => ({
        id: rule._id,
        shift: worklog.shift,
        fromTime: rule.fromTime,
        toTime: rule.toTime,
        weekdays: rule.weekdays,
      }));
      const startTime = new TZDate(worklog.startTime, worklog.timezone);
      const endTime = new TZDate(worklog.endTime, worklog.timezone);
      const segments = breakWorkLogIntoSegments(startTime, endTime, baseTimeRules);

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const worklogDoc = await WorkLog.insertOne({
            staff: worklog.staff,
            shift: worklog.shift,
            startedAt: worklog.startTime,
            endedAt: worklog.endTime,
            hours: ((worklog.endTime - worklog.startTime) / 3600000).toFixed(2),
          }, { session });

          if (!worklogDoc._id) {
            throw new Error("Failed to create worklog");
          }

          const worklogId = (worklogDoc._id as mongoose.Types.ObjectId).toString();
          const worklogSegments = segments.map((segment) => {
            return {
              staff: worklog.staff,
              shift: worklog.shift,
              workLog: worklogId,
              rule: segment.ruleId,
              startedAt: segment.from,
              endedAt: segment.to,
              hours: (segment.duration / 3600000).toFixed(2),
            }
          });
          await WorkLogSegment.insertMany(worklogSegments, { session });
          logger.info(`Worklog ${worklogId} and its segments in shift ${worklog.shift} logged successfully`);
        });
      } catch (error) {
        logger.error("Error logging work:", error);
        try {
          await session.abortTransaction();
        } catch { }
      } finally {
        session.endSession();
      }
      
    } catch (error) {
      logger.error("Error logging work:", error);
    }
  }
}

const worklogService = new WorklogService();
export default worklogService;
