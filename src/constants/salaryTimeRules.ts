import { ITimeRuleObj } from "../models/payrolls/timeRules";
import { WeekdaysEnum } from "./weekdays";

export const TIME_RULES_IDS = {
  ORDINARY: "690a15a7f2b1c94123d7e077",
  NIGHTLY: "690a15a7f2b1c94123d7e078",
  OVERNIGHT: "690a15a7f2b1c94123d7e079",
  SATURDAY: "690a15a7f2b1c94123d7e07a",
  SUNDAY: "690a15a7f2b1c94123d7e07b",
  HOLIDAY: "690a15a7f2b1c94123d7e07c",
} as const;

// Remember: Change time rules may affect the worklog calculation in test cases
export const TIME_RULES_DATA: Record<string, ITimeRuleObj> = {
  [TIME_RULES_IDS.ORDINARY]: {
    name: "Ordinary",
    fromTime: 360,
    toTime: 1200,
    weekdays: WeekdaysEnum.WEEKDAYS,
    rate: 1,
    priority: 1,
    effectiveDate: new Date(),
    isActive: true,
  },
  [TIME_RULES_IDS.NIGHTLY]: {
    name: "Nightly",
    fromTime: 1200,
    toTime: 1440,
    weekdays: WeekdaysEnum.WEEKDAYS,
    rate: 1.25,
    priority: 2,
    effectiveDate: new Date(),
    isActive: true,
  },
  [TIME_RULES_IDS.OVERNIGHT]: {
    name: "Overnight",
    fromTime: 0,
    toTime: 360,
    weekdays: WeekdaysEnum.WEEKDAYS,
    rate: 1.5,
    priority: 2.5,
    effectiveDate: new Date(),
    isActive: true,
  },
  [TIME_RULES_IDS.SATURDAY]: {
    name: "Saturday",
    fromTime: 0,
    toTime: 1440,
    weekdays: WeekdaysEnum.SATURDAY,
    rate: 2,
    priority: 3,
    effectiveDate: new Date(),
    isActive: true,
  },
  [TIME_RULES_IDS.SUNDAY]: {
    name: "Sunday",
    fromTime: 0,
    toTime: 1440,
    weekdays: WeekdaysEnum.SUNDAY,
    rate: 2,
    priority: 3,
    effectiveDate: new Date(),
    isActive: true,
  },
  [TIME_RULES_IDS.HOLIDAY]: {
    name: "Holiday",
    fromTime: 0,
    toTime: 1440,
    weekdays: WeekdaysEnum.HOLIDAYS,
    rate: 3,
    priority: 4,
    effectiveDate: new Date(),
    isActive: true,
  },
};
