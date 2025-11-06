import { differenceInDays, endOfDay, isValid } from "date-fns";

export interface TimeSegment {
  ruleId: string;
  from: number;
  to: number;
  duration: number;
}

export interface BaseTimeRule {
  id: string;
  fromTime: number; // minutes (0–1439)
  toTime: number; // minutes (0–1439)
}

export function breakWorkLogIntoSegments(
  startTime: Date | number | string,
  endTime: Date | number | string,
  baseTimeRules: BaseTimeRule[],
  timezone?: string = "Australia/Sydney",
): TimeSegment[] {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (!isValid(start)) {
    throw new Error("Invalid start or end time");
  }

  if (!isValid(end)) {
    throw new Error("Invalid end time");
  }
  if (start.getTime() > end.getTime()) {
    throw new Error("Start time is greater than end time");
  }

  const days = differenceInDays(end, start);
  const segments: [number, number] = Array.from({ length: days + 1 }, (_, i) => {
    if (i === 0) {
      return [start.getTime(), endOfDay(start).getTime()];
    }
    return [start.getTime() + i * 24 * 60 * 60 * 1000, start.getTime() + (i + 1) * 24 * 60 * 60 * 1000];
  });
}

// ⬇️ helper for breaking segments within same day
function breakWithinSameDay(
  startTime: Date | number | string,
  endTime: Date | number | string,
  baseTimeRules: BaseTimeRule[],
): TimeSegment[] {
  const startMinute = toMinuteOfDay(startTime);
  const endMinute = toMinuteOfDay(endTime);
  const weekday = startTime.getDay(); // 0..6

  const segments: TimeSegment[] = [];

  for (const ruleId in TIME_RULES_DATA) {
    const rule = TIME_RULES_DATA[ruleId];

    // Skip rule if weekday doesn't match
    if (!rule.weekdays.includes(weekday)) continue;

    const from = Math.max(startMinute, rule.fromTime);
    const to = Math.min(endMinute, rule.toTime);

    if (from <= to) {
      segments.push({
        ruleId,
        ruleName: rule.name,
        from,
        to,
        duration: to - from,
        date: startTime,
      });
    }
  }

  // Sort by time sequence
  segments.sort((a, b) => a.from - b.from);

  return segments;
}
