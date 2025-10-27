import Joi from "joi";

export interface IQueryStaffs {
  query: string;
  page: number;
  perPage: number;
  order: "asc" | "desc";
  sort: "email" | "createdAt" | "joinedAt";
  "roles[]"?: string[];
  "employmentTypes[]"?: string[];
}
export interface IQueryStaff {
  staffId: string;
}
export interface IInviteStaff {
  avatar: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  role: string;
  salutation: string;
  mobileNumber: string;
  phoneNumber: string;
  address: string;
  gender: string;
  birthdate: Date;
  employmentType: string;
}

export interface IAcceptInvitation {
  token: string;
}

export interface IUpdateStaff {
  avatar: string;
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  role: string;
  salutation: string;
  mobileNumber: string;
  phoneNumber: string;
  address: string;
  gender: string;
  birthdate: Date;
  employmentType: string;
}

export interface IArchiveStaff {
  id: string;
  isArchived: boolean;
}

export const validateQueryStaffs = (data: IQueryStaffs) => {
  const schema = Joi.object<IQueryStaffs>({
    query: Joi.string().optional().allow(""),
    page: Joi.number().default(1),
    perPage: Joi.number().default(10).max(100),
    order: Joi.string().default("asc").valid("asc", "desc"),
    sort: Joi.string().default("createdAt").valid("email", "createdAt", "joinedAt"),
    // Accept roles as array, single string, or CSV string and always coerce to array
    "roles[]": Joi.alternatives()
      .try(Joi.array().items(Joi.string()).single(), Joi.string())
      .custom((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          return value.includes(",")
            ? value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [value];
        }
        return [];
      })
      .optional(),
    // Accept employmentTypes as array, single string, or CSV string and always coerce to array
    "employmentTypes[]": Joi.alternatives()
      .try(Joi.array().items(Joi.string()).single(), Joi.string())
      .custom((value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          return value.includes(",")
            ? value
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [value];
        }
        return [];
      })
      .optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateQueryStaff = (data: IQueryStaff) => {
  const schema = Joi.object<IQueryStaff>({
    staffId: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateInviteStaff = (data: IInviteStaff) => {
  const schema = Joi.object<IInviteStaff>({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    middleName: Joi.string().optional(),
    preferredName: Joi.string().optional(),
    role: Joi.string().required(),
    salutation: Joi.string()
      .valid("Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Them", "They")
      .optional(),
    mobileNumber: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    address: Joi.string().optional(),
    gender: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    employmentType: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateAcceptInvitation = (data: IAcceptInvitation) => {
  const schema = Joi.object<IAcceptInvitation>({
    token: Joi.string().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateUpdateStaff = (data: IUpdateStaff) => {
  const schema = Joi.object<IUpdateStaff>({
    avatar: Joi.string().optional().allow(""),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    middleName: Joi.string().optional().allow(""),
    preferredName: Joi.string().optional().allow(""),
    role: Joi.string().optional(),
    salutation: Joi.string().optional().allow(""),
    mobileNumber: Joi.string().optional().allow(""),
    phoneNumber: Joi.string().optional().allow(""),
    address: Joi.string().optional().allow(""),
    gender: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    employmentType: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateArchiveStaff = (data: IArchiveStaff) => {
  const schema = Joi.object<IArchiveStaff>({
    id: Joi.string().required(),
    isArchived: Joi.boolean().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};
