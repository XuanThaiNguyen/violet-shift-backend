import Joi from "joi";

interface IAuthLogin {
  email: string;
  password: string;
}

export const validateLoginUser = (data: IAuthLogin) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data, { stripUnknown: true });
};
