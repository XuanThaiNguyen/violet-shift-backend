import { startOfDay, endOfDay, isValid, isSameDay, format, addDays, differenceInCalendarDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { Weekday, WeekdaysEnum } from "../constants/weekdays";

export interface TimeSegment {
  ruleId: string;
  from: number;
  to: number;
  duration: number;
  timezone: string;
}

export interface BaseTimeRule {
  id: string;
  fromTime: number; // minutes (0–1439)
  toTime: number; // minutes (0–1439)
  weekdays: Weekday;
}

export const toMinuteOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
export const minutesToTime = (minutes: number): [number, number] => {
  return [Math.floor(minutes / 60), minutes % 60];
};
export const toWeekday = (date: Date): Weekday => {
  const day = date.getDay();
  switch (day) {
    case 0:
      return WeekdaysEnum.SUNDAY;
    case 6:
      return WeekdaysEnum.SATURDAY;
    default:
      return WeekdaysEnum.WEEKDAYS;
  }
};

/**
 * Break work log into segments in non-public holidays
 * 
 * @param startTime - start time in timezone
 * @param endTime - end time in timezone
 * @param baseTimeRules - base time rules
 * @param overlappedHolidays - overlapped holidays
 * @returns time segments
 */
export function breakWorkLogIntoSegments(
  startTime: TZDate,
  endTime: TZDate,
  baseTimeRules: BaseTimeRule[],
  overlappedHolidays: TZDate[] = [],
): TimeSegment[] {

  if (!isValid(startTime) || !isValid(endTime)) {
    throw new Error("Start time and end time must be valid dates");
  }

  if (startTime.getTime() > endTime.getTime()) {
    throw new Error("Start time is greater than end time");
  }

  const holidayMap = overlappedHolidays.reduce((acc, holiday) => {
    const date = format(holiday, "yyyy-MM-dd");
    acc[date] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const diffDays = differenceInCalendarDays(endTime, startTime);

  if (diffDays === 0) {
    const isInHoliday = holidayMap[format(startTime, "yyyy-MM-dd")];
    return breakWorkLogWithinSameDay(startTime, endTime, baseTimeRules, isInHoliday);
  }

  const segments = Array.from({ length: diffDays + 1 }).reduce((acc: TimeSegment[], _, i) => {

    if (i === 0) {
      const isInHoliday = holidayMap[format(startTime, "yyyy-MM-dd")];
      const end = endOfDay(startTime);

      const _segments = breakWorkLogWithinSameDay(startTime, end, baseTimeRules, isInHoliday);
      return [...acc, ..._segments];
    }

    if (i === diffDays) {
      const isInHoliday = holidayMap[format(endTime, "yyyy-MM-dd")];
      const start = startOfDay(endTime);
      const _segments = breakWorkLogWithinSameDay(start, endTime, baseTimeRules, isInHoliday);
      return [...acc, ..._segments];
    }

    const start = startOfDay(addDays(startTime, i)) as TZDate;
    const end = endOfDay(start) as TZDate;
    const isInHoliday = holidayMap[format(start, "yyyy-MM-dd")];
    const _segments = breakWorkLogWithinSameDay(start, end, baseTimeRules, isInHoliday);
    return [...acc, ..._segments];
  }, []);
  return segments;
}

// ⬇️ helper for breaking segments within same day
export function breakWorkLogWithinSameDay(
  startTime: TZDate,
  endTime: TZDate,
  baseTimeRules: BaseTimeRule[],
  isHoliday: boolean = false,
): TimeSegment[] {

  if (endTime.getTime() < startTime.getTime()) {
    throw new Error("End time is less than start time");
  }

  if (endTime.getTime() === startTime.getTime()) {
    return [];
  }

  if (!isSameDay(startTime, endTime)) {
    throw new Error("Start time and end time must be the same day");
  }
  const startMinute = Math.round(toMinuteOfDay(startTime));
  const endMinute = Math.round(toMinuteOfDay(endTime));
  const weekday = isHoliday ? WeekdaysEnum.HOLIDAYS : toWeekday(startTime);
  const timezone = startTime.timeZone;
  const ruleGroups = baseTimeRules.reduce((acc, rule) => {
    const prev = acc[rule.weekdays] || [];
    prev.push(rule);
    acc[rule.weekdays] = prev;
    return acc;
  }, {} as Record<Weekday, BaseTimeRule[]>);

  const segments: TimeSegment[] = [];
  const ruleGroup = ruleGroups[weekday] ?? [];

  for (const rule of ruleGroup) {

    const from = Math.max(startMinute, rule.fromTime);
    const to = Math.min(endMinute, rule.toTime);

    if (from <= to) {
      const [fromHour, fromMinute] = minutesToTime(from);
      const [toHour, toMinute] = minutesToTime(to);

      const fromUnix = new TZDate(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), fromHour, fromMinute, timezone).getTime();
      const toUnix = to === 1440 ? startOfDay(addDays(startTime, 1)).getTime() : new TZDate(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), toHour, toMinute, timezone).getTime();
      const duration = toUnix - fromUnix;
      segments.push({
        ruleId: rule.id,
        from: fromUnix,
        to: toUnix,
        duration,
        timezone: timezone || process.env.TZ || "Australia/Sydney",
      });
    }
  }

  // Sort by time sequence
  segments.sort((a, b) => a.from - b.from);

  return segments;
}
