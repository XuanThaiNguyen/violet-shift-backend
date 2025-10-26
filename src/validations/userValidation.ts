import Joi from "joi";

interface IUpdateUser {
  avatar: string;
  address: string;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  gender: string;
  birthdate: string;
  phoneNumber: string;
  mobileNumber: string;
  languages: string[];
}

export const validateUpdateUser = (data: IUpdateUser) => {
  const schema = Joi.object<IUpdateUser>({
    avatar: Joi.string().optional().allow(""),
    salutation: Joi.string().optional().allow(""),
    address: Joi.string().optional().allow(""),
    firstName: Joi.string().optional(),
    middleName: Joi.string().optional().allow(""),
    lastName: Joi.string().optional(),
    preferredName: Joi.string().optional().allow(""),
    gender: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    phoneNumber: Joi.string().optional().allow(""),
    mobileNumber: Joi.string().optional().allow(""),
    languages: Joi.array().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
