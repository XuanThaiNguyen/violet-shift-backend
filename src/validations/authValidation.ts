import Joi from "joi";

interface IAuthLogin {
  email: string;
  password: string;
}

interface IAuthNewPassword {
  password: string;
}

export const validateLoginUser = (data: IAuthLogin) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateNewPassword = (data: IAuthNewPassword) => {
  const schema = Joi.object({
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};