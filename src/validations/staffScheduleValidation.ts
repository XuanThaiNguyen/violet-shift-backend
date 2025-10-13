import Joi from "joi";

export interface IQueryStaffSchedules {
  from: number;
  to: number;
}

export const validateQueryStaffSchedules = (data: IQueryStaffSchedules) => {
  const today = new Date().getTime();
  const tomorrow = today + 1000 * 60 * 60 * 24;
  const yesterday = today - 1000 * 60 * 60 * 24;
  const schema = Joi.object<IQueryStaffSchedules>({
    from: Joi.number().default(today).min(yesterday),
    to: Joi.number().default(tomorrow).min(today),
  });
  return schema.validate(data, { stripUnknown: true });
};
