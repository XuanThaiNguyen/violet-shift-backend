import Joi from "joi";

export type ClientStatus = "active" | "inactive" | "prospect";
export type AgeStatus = "adult" | "children";

interface IAddClient {
  useSalutation: boolean;
  salutation: string;
  firstName: string;
  lastName: string;
  middleName: string;
  displayName: string;
  gender: string;
  email: string;
  birthdate: Date;
  address: string;
  apartmentNumber: string;
  mobileNumber: string;
  phoneNumber: string;
  religion: string;
  maritalStatus: string;
  nationality: string;
  languages: string[];
  status: ClientStatus;
  isArchived: boolean;
}

export const validateAddClient = (data: IAddClient) => {
  const schema = Joi.object<IAddClient>({
    displayName: Joi.string().required(),
    email: Joi.string().required(),
    useSalutation: Joi.boolean().optional(),
    salutation: Joi.string().optional(),
    firstName: Joi.string().optional(),
    middleName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    gender: Joi.string().optional(),
    birthdate: Joi.string().optional(),
    address: Joi.string().optional(),
    apartmentNumber: Joi.string().optional(),
    mobileNumber: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    religion: Joi.string().optional(),
    maritalStatus: Joi.string().optional(),
    nationality: Joi.string().optional(),
    languages: Joi.array().optional(),
    status: Joi.string().optional(),
    isArchived: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export interface IQueryClient {
  query: string;
  page: number;
  perPage: number;
  order: "asc" | "desc";
  sort: "email" | "createdAt" | "joinedAt";
  "statusTypes[]"?: string[];
  "ageTypes[]"?: string[];
}

export interface IArchiveClient {
  id: string;
  isArchived: boolean;
}

export interface IChangeStatusClient {
  id: string;
  status: string;
}

export const validateQueryClient = (data: IQueryClient) => {
  const schema = Joi.object<IQueryClient>({
    query: Joi.string().optional().allow(""),
    page: Joi.number().default(1),
    perPage: Joi.number().default(10).max(100),
    order: Joi.string().default("asc").valid("asc", "desc"),
    sort: Joi.string().default("createdAt").valid("email", "createdAt", "joinedAt"),
    // Accept roles as array, single string, or CSV string and always coerce to array
    "ageTypes[]": Joi.alternatives()
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
    "statusTypes[]": Joi.alternatives()
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

export const validateArchiveClient = (data: IArchiveClient) => {
  const schema = Joi.object<IArchiveClient>({
    id: Joi.string().required(),
    isArchived: Joi.boolean().required(),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateChangeStatusClient = (data: IChangeStatusClient) => {
  const schema = Joi.object<IChangeStatusClient>({
    id: Joi.string().required(),
    status: Joi.string().valid("active", "inactive", "prospect").required(),
  });
  return schema.validate(data, { stripUnknown: true });
};
