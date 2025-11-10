import TimeRule from "../../models/payrolls/timeRules";
import RedisService from "../redis";

import { ITimeRuleObj } from "../../models/payrolls/timeRules";

export type TimeRule = Omit<ITimeRuleObj, "_id"> & {
  _id: string;
};
export class TimeRuleService {
  async getTimeRules(): Promise<TimeRule[]> {
    try {
      const redisService = RedisService.getInstance();
      const cached = await redisService.get("time-rules");
      if (cached) {
        return JSON.parse(cached);
      }
      const timeRules: TimeRule[] = await TimeRule.find({ isActive: true }, null, {
        sort: { priority: 1 },
        lean: true,
        virtuals: true,
      });
      await redisService.set("time-rules", JSON.stringify(timeRules));
      return timeRules;
    } catch (error) {
      return [];
    }
  }
}

const timeRuleService = new TimeRuleService();
export default timeRuleService;
