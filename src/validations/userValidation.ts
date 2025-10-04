import Joi from "joi";

interface IUpdateUser {
  address: string;
  firstName: string;
  middleName: string;
  lastName: string;
  prefferedName: string;
  gender: string;
  birthdate: string;
  phone: string;
  email: string;
}

export const validateUpdateUser = (data: IUpdateUser) => {
  const schema = Joi.object<IUpdateUser>({
    address: Joi.string().optional(),
    firstName: Joi.string().required(),
    middleName: Joi.string().optional(),
    lastName: Joi.string().required(),
    prefferedName: Joi.string().optional(),
    gender: Joi.string().optional(),
    birthdate: Joi.date().optional(),
    phone: Joi.string().optional(),
  });
  return schema.validate(data, { stripUnknown: true });
};
