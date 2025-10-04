import Joi from "joi";

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
  isProspect: boolean;
  isArchived: boolean;
}

export const validateAddClient = (data: IAddClient) => {
  const schema = Joi.object<IAddClient>({
    displayName: Joi.string().required(),
    email: Joi.string().optional(),
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
    isProspect: Joi.boolean().optional(),
    isArchived: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
