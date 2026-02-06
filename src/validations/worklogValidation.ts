import { endOfDay, endOfToday, startOfDay, startOfToday, subDays } from "date-fns";
import Joi from "joi";

export interface IQueryStaffWorklog {
  from: number;
  to: number;
  ruleId?: string;
}

export const validateQueryStaffWorklog = (data: IQueryStaffWorklog) => {
  const schema = Joi.object<IQueryStaffWorklog>({
    from: Joi.number().label("From").default(startOfToday().getTime()),
    to: Joi.number().label("To").default(endOfToday().getTime()),
    ruleId: Joi.string().hex().length(24).optional().label("Rule ID"),
  });
  return schema.validate(data, { stripUnknown: true });
};

export interface IQueryWorklogSummary {
  from: number;
  to: number;
}

export const validateQueryWorklogSummary = (data: IQueryWorklogSummary) => {
  const defaultFrom = startOfDay(subDays(new Date(), 13)).getTime();
  const defaultTo = endOfDay(new Date()).getTime();
  const schema = Joi.object<IQueryWorklogSummary>({
    from: Joi.number().label("From").default(defaultFrom),
    to: Joi.number().label("To").default(defaultTo),
  });
  return schema.validate(data, { stripUnknown: true });
};
