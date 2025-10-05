import Joi from "joi";

export interface IQueryStaff {
  query: string;
  page: number;
  perPage: number;
  order: "asc" | "desc";
  sort: "email" | "createdAt" | "joinedAt";
  roles?: string[];
  employmentTypes?: string[];
}

export interface IInviteStaff {
  email: string;
  role: string;
}

export interface IAcceptInvitation {
  token: string;
}

export const validateQueryStaff = (data: IQueryStaff) => {
  const schema = Joi.object<IQueryStaff>({
    query: Joi.string().optional().allow(""),
    page: Joi.number().default(1),
    perPage: Joi.number().default(10).max(100),
    order: Joi.string().default("asc").valid("asc", "desc"),
    sort: Joi.string().default("createdAt").valid("email", "createdAt", "joinedAt"),
    roles: Joi.array().items(Joi.string()).optional(),
    employmentTypes: Joi.array().items(Joi.string()).optional(),
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

export const validateAcceptInvitation = (data: IAcceptInvitation) => {
  const schema = Joi.object<IAcceptInvitation>({
    token: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};
