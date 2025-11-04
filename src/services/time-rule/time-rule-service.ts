import TimeRule from "../../models/payrolls/timeRules";
import RedisService from "../redis";

import { ITimeRuleObj } from "../../models/payrolls/timeRules";

export class TimeRuleService {
  async getTimeRules(): Promise<ITimeRuleObj[]> {
    try {
      const redisService = RedisService.getInstance();
      const cached = await redisService.get("time-rules");
      if (cached) {
        return JSON.parse(cached);
      }
      const timeRules: ITimeRuleObj[] = await TimeRule.find({ isActive: true }, null, {
        sort: { priority: 1 },
        lean: true,
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
