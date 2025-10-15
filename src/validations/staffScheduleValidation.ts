import Joi from "joi";

export interface IQueryStaffSchedules {
  from: number;
  to: number;
}

export const validateQueryStaffSchedules = (data: IQueryStaffSchedules) => {
  const today = new Date().getTime();
  const tomorrow = today + 1000 * 60 * 60 * 24;
  const last2Months = today - 1000 * 60 * 60 * 24 * 61;
  const schema = Joi.object<IQueryStaffSchedules>({
    from: Joi.number().default(today).min(last2Months),
    to: Joi.number().default(tomorrow).optional().allow(0),
  });
  return schema.validate(data, { stripUnknown: true });
};
