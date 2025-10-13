import Joi from "joi";

export interface IQueryStaffSchedules {
  staffId: string;
}

export const validateQueryStaffSchedules = (data: IQueryStaffSchedules) => {
  const schema = Joi.object<IQueryStaffSchedules>({
    staffId: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};