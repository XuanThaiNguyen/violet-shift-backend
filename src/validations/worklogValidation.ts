import { endOfToday, startOfToday } from "date-fns";
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
    ruleId: Joi.string().optional().label("Rule ID"),
  });
  return schema.validate(data, { stripUnknown: true });
};
