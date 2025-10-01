import Joi from "joi";

export interface IQueryStaff {
  query: string;
  page: number;
  perPage: number;
  sort: "asc" | "desc";
  sortBy: "email" | "createdAt";
  role?: string;
}

export interface IInviteStaff {
  email: string;
  role: string;
}

export const validateQueryStaff = (data: IQueryStaff) => {
  const schema = Joi.object<IQueryStaff>({
    query: Joi.string(),
    page: Joi.number().default(1),
    perPage: Joi.number().default(10),
    sort: Joi.string().default("asc").valid("asc", "desc"),
    sortBy: Joi.string().default("createdAt").valid("email", "createdAt"),
    role: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateInviteStaff = (data: IInviteStaff) => {
  const schema = Joi.object<IInviteStaff>({
    email: Joi.string().email().required(),
    role: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};
