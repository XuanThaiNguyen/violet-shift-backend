import Joi from "joi";

interface IAuthLogin {
  email: string;
  password: string;
}

interface IAuthForgotPassword {
  email: string;
}

interface IAuthNewPassword {
  password: string;
}

interface IAuthUpdatePassword {
  currentPassword: string;
  password: string;
}

export const validateLoginUser = (data: IAuthLogin) => {
  const schema = Joi.object<IAuthLogin>({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateNewPassword = (data: IAuthNewPassword) => {
  const schema = Joi.object<IAuthNewPassword>({
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateUpdatePassword = (data: IAuthUpdatePassword) => {
  const schema = Joi.object<IAuthUpdatePassword>({
    currentPassword: Joi.string().required().label("Current Password"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};

export const validateForgotPassword = (data: IAuthForgotPassword) => {
  const schema = Joi.object<IAuthForgotPassword>({
    email: Joi.string().email().required().label("Email"),
  });
  return schema.validate(data, { stripUnknown: true });
};
