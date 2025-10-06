import Joi from "joi";

interface IUpdateUser {
  avatar: string;
  address: string;
  salutation: string;
  firstName: string;
  middleName: string;
  lastName: string;
  prefferedName: string;
  gender: string;
  birthdate: string;
  phone: string;
}

export const validateUpdateUser = (data: IUpdateUser) => {
  const schema = Joi.object<IUpdateUser>({
    avatar: Joi.string().optional().allow(""),
    salutation: Joi.string().optional().allow(""),
    address: Joi.string().optional().allow(""),
    firstName: Joi.string().optional(),
    middleName: Joi.string().optional().allow(""),
    lastName: Joi.string().optional(),
    prefferedName: Joi.string().optional().allow(""),
    gender: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    phone: Joi.string().optional().allow(""),
  });
  return schema.validate(data, { stripUnknown: true });
};
