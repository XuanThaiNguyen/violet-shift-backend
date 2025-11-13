const WEEKDAYS = ["holidays", "weekdays", "saturday", "sunday"]

export type Weekday = (typeof WEEKDAYS)[number];

export enum WeekdaysEnum {
  HOLIDAYS = "holidays",
  WEEKDAYS = "weekdays",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
};

export default WEEKDAYS;